import { NextRequest, NextResponse } from 'next/server'
import { generateAccessToken, verifyRefreshToken } from '@/lib/auth/jwt'
import { withMethodValidation, withCORS } from '@/lib/auth/middleware'
import { getClientIP, logSecurityEvent, securityHeaders } from '@/lib/auth/security'
import { prisma } from '@/lib/prisma'
import cookie from 'cookie'

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Method validation
    const methodError = withMethodValidation(request, ['POST'])
    if (methodError) return methodError

    const clientIP = getClientIP(request)
    
    // Get refresh token from cookies
    const cookieHeader = request.headers.get('cookie')
    let refreshToken: string | null = null

    if (cookieHeader) {
      const cookies = cookie.parse(cookieHeader)
      refreshToken = cookies.refreshToken
    }

    if (!refreshToken) {
      logSecurityEvent('token_refresh_failed', {
        reason: 'no_refresh_token',
        clientIP
      }, 'warning')

      return NextResponse.json(
        {
          success: false,
          error: 'No refresh token provided',
          code: 'NO_REFRESH_TOKEN'
        },
        { status: 401 }
      )
    }

    // Verify refresh token
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      logSecurityEvent('token_refresh_failed', {
        reason: 'invalid_refresh_token',
        clientIP
      }, 'warning')

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        },
        { status: 401 }
      )
    }

    // Verify user still exists and is not locked
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        totalXp: true,
        currentLevel: true,
        streakCount: true,
        emailVerified: true,
        lastLoginAt: true,
        lockedUntil: true,
      },
    })

    if (!user) {
      logSecurityEvent('token_refresh_failed', {
        reason: 'user_not_found',
        userId: payload.userId,
        clientIP
      }, 'warning')

      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      logSecurityEvent('token_refresh_failed', {
        reason: 'account_locked',
        userId: user.id,
        clientIP
      }, 'warning')

      return NextResponse.json(
        {
          success: false,
          error: 'Account is locked',
          code: 'ACCOUNT_LOCKED'
        },
        { status: 401 }
      )
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id, user.email)

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            totalXp: user.totalXp,
            currentLevel: user.currentLevel,
            streakCount: user.streakCount,
          },
          message: 'Token refreshed successfully'
        }
      },
      { status: 200 }
    )

    // Set new access token cookie
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    logSecurityEvent('token_refresh_success', {
      userId: user.id,
      clientIP
    }, 'info')

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers
    return withCORS(response, request)
  } catch (error) {
    console.error('Token refresh error:', error)

    logSecurityEvent('token_refresh_error', {
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
 * OPTIONS /api/v1/auth/refresh
 * Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return withCORS(response, request)
}