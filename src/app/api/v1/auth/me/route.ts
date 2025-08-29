import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withCORS, withMethodValidation } from '@/lib/auth/middleware'
import { securityHeaders } from '@/lib/auth/security'

/**
 * GET /api/v1/auth/me
 * Get current authenticated user information
 */
export async function GET(request: NextRequest) {
  // Method validation
  const methodError = withMethodValidation(request, ['GET'])
  if (methodError) return methodError

  return withAuth(request, async (authenticatedRequest) => {
    try {
      const user = authenticatedRequest.user

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
              emailVerified: user.emailVerified,
              lastLoginAt: user.lastLoginAt,
            }
          }
        },
        { status: 200 }
      )

      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return withCORS(response, request)
    } catch (error) {
      console.error('Get user info error:', error)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get user information',
          code: 'GET_USER_ERROR'
        },
        { status: 500 }
      )
    }
  })
}

/**
 * OPTIONS /api/v1/auth/me
 * Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return withCORS(response, request)
}