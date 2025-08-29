import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from './core'
import { extractTokenFromHeader } from './jwt'
import { isRateLimited, getClientIP, securityHeaders } from './security'
import cookie from 'cookie'

/**
 * Authentication middleware for API routes
 * Handles token verification, rate limiting, and user authentication
 */

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    name: string | null
    totalXp: number
    currentLevel: number
    streakCount: number
    emailVerified: boolean
    lastLoginAt: Date | null
  }
}

/**
 * Middleware to protect API routes requiring authentication
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Add security headers
    const response = new NextResponse()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Extract token from Authorization header or cookies
    let token = extractTokenFromHeader(request.headers.get('Authorization'))
    
    if (!token) {
      // Try to get token from cookies
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookie.parse(cookieHeader)
        token = cookies.accessToken
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { 
          status: 401,
          headers: response.headers
        }
      )
    }

    // Get current user
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        },
        { 
          status: 401,
          headers: response.headers
        }
      )
    }

    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = user

    // Call the handler
    return await handler(authenticatedRequest)
  } catch (error) {
    console.error('Auth middleware error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  request: NextRequest,
  options: { maxAttempts?: number; windowMs?: number } = {}
) {
  const clientIP = getClientIP(request)
  const { isLimited, remainingAttempts, resetTime } = isRateLimited(clientIP, {
    maxAttempts: options.maxAttempts || 5,
    windowMs: options.windowMs || 60 * 1000 // 1 minute
  })

  if (isLimited) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': options.maxAttempts?.toString() || '5',
          'X-RateLimit-Remaining': remainingAttempts.toString(),
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
        }
      }
    )
  }

  return null // Not rate limited
}

/**
 * Combined middleware for authentication endpoints (with rate limiting)
 */
export async function withAuthAndRateLimit(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  rateLimitOptions?: { maxAttempts?: number; windowMs?: number }
): Promise<NextResponse> {
  // Check rate limiting first
  const rateLimitResponse = withRateLimit(request, rateLimitOptions)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Then check authentication
  return withAuth(request, handler)
}

/**
 * Optional authentication middleware (user can be null)
 */
export async function withOptionalAuth(
  request: NextRequest,
  handler: (request: NextRequest & { user?: AuthenticatedRequest['user'] }) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract token
    let token = extractTokenFromHeader(request.headers.get('Authorization'))
    
    if (!token) {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookie.parse(cookieHeader)
        token = cookies.accessToken
      }
    }

    let user = null
    if (token) {
      user = await getCurrentUser(token)
    }

    // Add user to request (can be null)
    const requestWithOptionalUser = request as NextRequest & { user?: AuthenticatedRequest['user'] }
    requestWithOptionalUser.user = user || undefined

    return await handler(requestWithOptionalUser)
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    
    // Continue without authentication if there's an error
    const requestWithoutUser = request as NextRequest & { user?: AuthenticatedRequest['user'] }
    return await handler(requestWithoutUser)
  }
}

/**
 * CORS middleware for authentication endpoints
 */
export function withCORS(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  
  // Allow requests from allowed origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
  ]

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set(
    'Access-Control-Allow-Methods', 
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cookie'
  )

  return response
}

/**
 * Method validation middleware
 */
export function withMethodValidation(
  request: NextRequest,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      {
        success: false,
        error: `Method ${request.method} not allowed`,
        code: 'METHOD_NOT_ALLOWED'
      },
      { 
        status: 405,
        headers: {
          'Allow': allowedMethods.join(', ')
        }
      }
    )
  }

  return null
}