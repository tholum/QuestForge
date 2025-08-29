import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth/core'
import { registerSchema, validateRequestBody } from '@/lib/auth/validation'
import { withRateLimit, withCORS, withMethodValidation } from '@/lib/auth/middleware'
import { getClientIP, logSecurityEvent, securityHeaders } from '@/lib/auth/security'
import cookie from 'cookie'

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  try {
    // Method validation
    const methodError = withMethodValidation(request, ['POST'])
    if (methodError) return methodError

    // Rate limiting - stricter for registration
    const rateLimitResponse = withRateLimit(request, { 
      maxAttempts: 3, 
      windowMs: 60 * 1000 // 3 attempts per minute
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
      registerSchema,
      body
    )

    if (validationError) {
      logSecurityEvent('registration_validation_failed', {
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

    // Register user
    const result = await registerUser(
      validatedData.email,
      validatedData.name,
      validatedData.password,
      clientIP
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: 'REGISTRATION_FAILED'
        },
        { status: 400 }
      )
    }

    // Set secure cookies
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: result.user,
          message: 'Registration successful'
        }
      },
      { status: 201 }
    )

    // Set access token cookie
    response.cookies.set('accessToken', result.tokens!.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    // Set refresh token cookie
    response.cookies.set('refreshToken', result.tokens!.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers
    return withCORS(response, request)
  } catch (error) {
    console.error('Registration error:', error)

    logSecurityEvent('registration_system_error', {
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
 * OPTIONS /api/v1/auth/register
 * Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return withCORS(response, request)
}