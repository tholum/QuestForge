/**
 * Individual Progress Entry API Routes
 * 
 * CRUD endpoints for individual progress entries with authentication and validation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { ProgressRepository } from '@/lib/prisma/repositories/progress-repository'
import { validateInput, ProgressUpdateSchema } from '@/lib/validation/schemas'
import { withErrorHandling } from '@/lib/prisma/error-handler'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/progress/[id]
 * Retrieve a specific progress entry
 */
async function handleGet(
  request: AuthenticatedRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const { id: progressId } = await params

    // Validate ID format
    if (!progressId || typeof progressId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid progress ID'
      }, { status: 400 })
    }

    // Find the progress entry
    const progress = await progressRepository.findById(progressId)
    
    if (!progress) {
      return NextResponse.json({
        success: false,
        error: 'Progress entry not found'
      }, { status: 404 })
    }

    // Verify user owns the progress entry
    if (progress.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to progress entry'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: progress
    })
  }, 'Fetching progress entry')
}

/**
 * PUT /api/v1/progress/[id]
 * Update a specific progress entry
 */
async function handlePut(
  request: AuthenticatedRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const { id: progressId } = await params

    // Validate ID format
    if (!progressId || typeof progressId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid progress ID'
      }, { status: 400 })
    }

    // Check if progress entry exists and user owns it
    const existingProgress = await progressRepository.findById(progressId)
    
    if (!existingProgress) {
      return NextResponse.json({
        success: false,
        error: 'Progress entry not found'
      }, { status: 404 })
    }

    if (existingProgress.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to progress entry'
      }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateInput(ProgressUpdateSchema, body)

    // Update the progress entry
    const updatedProgress = await progressRepository.update(progressId, validatedData)

    return NextResponse.json({
      success: true,
      data: updatedProgress,
      message: 'Progress entry updated successfully'
    })
  }, 'Updating progress entry')
}

/**
 * DELETE /api/v1/progress/[id]
 * Delete a specific progress entry
 */
async function handleDelete(
  request: AuthenticatedRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const { id: progressId } = await params

    // Validate ID format
    if (!progressId || typeof progressId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid progress ID'
      }, { status: 400 })
    }

    // Check if progress entry exists and user owns it
    const existingProgress = await progressRepository.findById(progressId)
    
    if (!existingProgress) {
      return NextResponse.json({
        success: false,
        error: 'Progress entry not found'
      }, { status: 404 })
    }

    if (existingProgress.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to progress entry'
      }, { status: 403 })
    }

    // Delete the progress entry
    await progressRepository.delete(progressId)

    return NextResponse.json({
      success: true,
      message: 'Progress entry deleted successfully'
    })
  }, 'Deleting progress entry')
}

/**
 * Main route handlers
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck

  return withAuth(request, (req) => handleGet(req, context))
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const methodCheck = withMethodValidation(request, ['PUT'])
  if (methodCheck) return methodCheck

  return withAuth(request, (req) => handlePut(req, context))
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const methodCheck = withMethodValidation(request, ['DELETE'])
  if (methodCheck) return methodCheck

  return withAuth(request, (req) => handleDelete(req, context))
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}