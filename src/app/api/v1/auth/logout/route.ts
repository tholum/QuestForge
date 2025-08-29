import { NextRequest, NextResponse } from 'next/server'
import { withMethodValidation, withCORS } from '@/lib/auth/middleware'
import { getClientIP, logSecurityEvent, securityHeaders } from '@/lib/auth/security'
import { getCurrentUser, extractTokenFromHeader } from '@/lib/auth'
import cookie from 'cookie'

/**
 * POST /api/v1/auth/logout
 * Logout user and clear session cookies
 */
export async function POST(request: NextRequest) {
  try {
    // Method validation
    const methodError = withMethodValidation(request, ['POST'])
    if (methodError) return methodError

    const clientIP = getClientIP(request)
    
    // Try to get user info before logout (for logging)
    let userId = 'unknown'
    try {
      let token = extractTokenFromHeader(request.headers.get('Authorization'))
      
      if (!token) {
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
          const cookies = cookie.parse(cookieHeader)
          token = cookies.accessToken
        }
      }

      if (token) {
        const user = await getCurrentUser(token)
        if (user) {
          userId = user.id
        }
      }
    } catch {
      // Ignore errors, just log as unknown user
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      },
      { status: 200 }
    )

    // Clear authentication cookies
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    // Log logout event
    logSecurityEvent('logout_success', {
      userId,
      clientIP
    }, 'info')

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers
    return withCORS(response, request)
  } catch (error) {
    console.error('Logout error:', error)

    logSecurityEvent('logout_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      clientIP: getClientIP(request)
    }, 'error')

    // Even if there's an error, we should clear cookies
    const response = NextResponse.json(
      {
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      },
      { status: 200 }
    )

    // Clear cookies even on error
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return withCORS(response, request)
  }
}

/**
 * OPTIONS /api/v1/auth/logout
 * Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return withCORS(response, request)
}