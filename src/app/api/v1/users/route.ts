import { NextRequest, NextResponse } from 'next/server'
import { prisma, handlePrismaError, validateInput, UserQuerySchema } from '@/lib/prisma'

/**
 * Enhanced API route with error handling and validation
 * GET /api/v1/users - List all users with pagination
 * POST /api/v1/users - Create a new user
 */

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      limit: Number(searchParams.get('limit')) || 20,
      offset: Number(searchParams.get('offset')) || 0,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      email: searchParams.get('email') || undefined,
      minLevel: searchParams.get('minLevel') ? Number(searchParams.get('minLevel')) : undefined,
      hasStreak: searchParams.get('hasStreak') === 'true' ? true : undefined,
    }

    // Validate query parameters
    const validatedQuery = validateInput(UserQuerySchema, queryParams)

    const users = await prisma.user.findMany({
      where: {
        email: validatedQuery.email ? { contains: validatedQuery.email, mode: 'insensitive' } : undefined,
        currentLevel: validatedQuery.minLevel ? { gte: validatedQuery.minLevel } : undefined,
        streakCount: validatedQuery.hasStreak ? { gt: 0 } : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        totalXp: true,
        currentLevel: true,
        streakCount: true,
        lastActivity: true,
        createdAt: true,
        _count: {
          select: {
            goals: true,
            progress: true,
            userAchievements: true,
          },
        },
      },
      orderBy: { [validatedQuery.sortBy]: validatedQuery.sortOrder },
      take: validatedQuery.limit,
      skip: validatedQuery.offset,
    })

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: {
        email: validatedQuery.email ? { contains: validatedQuery.email, mode: 'insensitive' } : undefined,
        currentLevel: validatedQuery.minLevel ? { gte: validatedQuery.minLevel } : undefined,
        streakCount: validatedQuery.hasStreak ? { gt: 0 } : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total: totalCount,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore: validatedQuery.offset + users.length < totalCount
      }
    })
  } catch (error) {
    const dbError = handlePrismaError(error)
    console.error('Error fetching users:', dbError)
    
    return NextResponse.json(
      {
        success: false,
        error: dbError.message,
        code: dbError.code,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Note: This simplified version doesn't include password for demonstration
    // In production, you'd use the auth endpoints for user registration
    const userData = {
      email: body.email,
      name: body.name,
      password: body.password || 'temp-password-123' // Should be handled by auth system
    }

    // Validate input data (this would validate password requirements in real usage)
    // For demonstration, we'll do basic validation
    if (!userData.email || !userData.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and name are required',
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: userData.password, // In real implementation, would be hashed
      },
      select: {
        id: true,
        email: true,
        name: true,
        totalXp: true,
        currentLevel: true,
        streakCount: true,
        createdAt: true,
        _count: {
          select: {
            goals: true,
            progress: true,
            userAchievements: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'User created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    const dbError = handlePrismaError(error)
    console.error('Error creating user:', dbError)
    
    const statusCode = dbError.code === 'CONSTRAINT_ERROR' ? 409 : 500
    
    return NextResponse.json(
      {
        success: false,
        error: dbError.message,
        code: dbError.code,
      },
      { status: statusCode }
    )
  }
}