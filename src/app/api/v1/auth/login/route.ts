import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth/core'
import { loginSchema, validateRequestBody } from '@/lib/auth/validation'
import { withRateLimit, withCORS, withMethodValidation } from '@/lib/auth/middleware'
import { getClientIP, logSecurityEvent, securityHeaders } from '@/lib/auth/security'

/**
 * POST /api/v1/auth/login
 * Authenticate user and create session
 */
export async function POST(request: NextRequest) {
  try {
    // Method validation
    const methodError = withMethodValidation(request, ['POST'])
    if (methodError) return methodError

    // Rate limiting - protect against brute force
    const rateLimitResponse = withRateLimit(request, { 
      maxAttempts: 5, 
      windowMs: 60 * 1000 // 5 attempts per minute
    })
    if (rateLimitResponse) return rateLimitResponse

    const clientIP = getClientIP(request)
    
    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON format',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      )
    }

    const { data: validatedData, error: validationError } = await validateRequestBody(
      loginSchema,
      body
    )

    if (validationError) {
      logSecurityEvent('login_validation_failed', {
        errors: validationError,
        clientIP
      }, 'warning')

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationError,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    // Authenticate user
    const result = await authenticateUser(
      validatedData.email,
      validatedData.password,
      clientIP
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: 'LOGIN_FAILED'
        },
        { status: 401 }
      )
    }

    // Determine cookie duration based on "remember me"
    const accessTokenMaxAge = validatedData.rememberMe 
      ? 7 * 24 * 60 * 60 // 7 days
      : 24 * 60 * 60 // 24 hours

    const refreshTokenMaxAge = validatedData.rememberMe 
      ? 30 * 24 * 60 * 60 // 30 days
      : 7 * 24 * 60 * 60 // 7 days

    // Create response with user data
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: result.user,
          message: 'Login successful'
        }
      },
      { status: 200 }
    )

    // Set secure cookies
    response.cookies.set('accessToken', result.tokens!.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenMaxAge,
      path: '/'
    })

    response.cookies.set('refreshToken', result.tokens!.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenMaxAge,
      path: '/'
    })

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers
    return withCORS(response, request)
  } catch (error) {
    console.error('Login error:', error)

    logSecurityEvent('login_system_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clientIP: getClientIP(request)
    }, 'error')

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/v1/auth/login
 * Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return withCORS(response, request)
}