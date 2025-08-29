import { NextRequest, NextResponse } from 'next/server'
import { completePasswordReset } from '@/lib/auth/core'
import { passwordResetSchema, validateRequestBody } from '@/lib/auth/validation'
import { withRateLimit, withCORS, withMethodValidation } from '@/lib/auth/middleware'
import { getClientIP, logSecurityEvent, securityHeaders } from '@/lib/auth/security'

/**
 * POST /api/v1/auth/reset-password
 * Complete password reset with token
 */
export async function POST(request: NextRequest) {
  try {
    // Method validation
    const methodError = withMethodValidation(request, ['POST'])
    if (methodError) return methodError

    // Rate limiting - moderate for password reset completion
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
      passwordResetSchema,
      body
    )

    if (validationError) {
      logSecurityEvent('password_reset_completion_validation_failed', {
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

    // Complete password reset
    const result = await completePasswordReset(
      validatedData.token,
      validatedData.password,
      clientIP
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: 'PASSWORD_RESET_FAILED'
        },
        { status: 400 }
      )
    }

    const response = NextResponse.json(
      {
        success: true,
        data: {
          message: 'Password has been reset successfully. You can now log in with your new password.'
        }
      },
      { status: 200 }
    )

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers
    return withCORS(response, request)
  } catch (error) {
    console.error('Reset password error:', error)

    logSecurityEvent('password_reset_completion_error', {
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
 * OPTIONS /api/v1/auth/reset-password
 * Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return withCORS(response, request)
}