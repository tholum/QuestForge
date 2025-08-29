import { NextRequest, NextResponse } from 'next/server'
import { initiatePasswordReset } from '@/lib/auth/core'
import { passwordResetRequestSchema, validateRequestBody } from '@/lib/auth/validation'
import { withRateLimit, withCORS, withMethodValidation } from '@/lib/auth/middleware'
import { getClientIP, logSecurityEvent, securityHeaders } from '@/lib/auth/security'

/**
 * POST /api/v1/auth/forgot-password
 * Initiate password reset process
 */
export async function POST(request: NextRequest) {
  try {
    // Method validation
    const methodError = withMethodValidation(request, ['POST'])
    if (methodError) return methodError

    // Rate limiting - strict for password reset to prevent abuse
    const rateLimitResponse = withRateLimit(request, { 
      maxAttempts: 3, 
      windowMs: 15 * 60 * 1000 // 3 attempts per 15 minutes
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
      passwordResetRequestSchema,
      body
    )

    if (validationError) {
      logSecurityEvent('password_reset_validation_failed', {
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

    // Initiate password reset
    const result = await initiatePasswordReset(validatedData.email, clientIP)

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

    // Always return success to prevent email enumeration
    // Don't reveal if the email exists or not
    const response = NextResponse.json(
      {
        success: true,
        data: {
          message: 'If an account with that email exists, you will receive password reset instructions.'
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
    console.error('Forgot password error:', error)

    logSecurityEvent('password_reset_system_error', {
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
 * OPTIONS /api/v1/auth/forgot-password
 * Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return withCORS(response, request)
}