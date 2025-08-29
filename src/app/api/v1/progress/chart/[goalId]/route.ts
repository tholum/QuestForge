/**
 * Progress Chart Data API Routes
 * 
 * Endpoints for retrieving chart-ready progress data for visualization components.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { ProgressRepository } from '@/lib/prisma/repositories/progress-repository'
import { GoalRepository } from '@/lib/prisma/repositories/goal-repository'
import { withErrorHandling } from '@/lib/prisma/error-handler'

interface RouteContext {
  params: Promise<{
    goalId: string
  }>
}

/**
 * GET /api/v1/progress/chart/[goalId]
 * Retrieve chart-formatted progress data for a specific goal
 */
async function handleGet(
  request: AuthenticatedRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const goalRepository = new GoalRepository()
    const { goalId } = await params
    const url = new URL(request.url)

    // Validate goal ID format
    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid goal ID'
      }, { status: 400 })
    }

    // Verify goal exists and user owns it
    const goal = await goalRepository.findById(goalId)
    
    if (!goal) {
      return NextResponse.json({
        success: false,
        error: 'Goal not found'
      }, { status: 404 })
    }

    if (goal.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to goal'
      }, { status: 403 })
    }

    // Parse query parameters
    const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 365)
    const chartType = url.searchParams.get('type') || 'line' // line, area, bar
    const aggregation = url.searchParams.get('aggregation') || 'daily' // daily, weekly, monthly
    const includeXP = url.searchParams.get('includeXP') === 'true'
    const includeTrend = url.searchParams.get('includeTrend') === 'true'

    // Get chart data
    const chartData = await progressRepository.getProgressChartData(goalId, days)

    // Process data based on aggregation
    let processedData = chartData

    if (aggregation === 'weekly') {
      // Group by week
      const weeklyData = new Map<string, { progress: number; xpEarned: number; count: number }>()
      
      chartData.forEach(entry => {
        const date = new Date(entry.date)
        const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        
        const existing = weeklyData.get(weekKey) || { progress: 0, xpEarned: 0, count: 0 }
        weeklyData.set(weekKey, {
          progress: Math.max(existing.progress, entry.progress), // Use highest progress in week
          xpEarned: existing.xpEarned + entry.xpEarned,
          count: existing.count + (entry.progress > 0 ? 1 : 0)
        })
      })

      processedData = Array.from(weeklyData.entries()).map(([date, data]) => ({
        date,
        progress: data.progress,
        xpEarned: data.xpEarned
      }))
    } else if (aggregation === 'monthly') {
      // Group by month
      const monthlyData = new Map<string, { progress: number; xpEarned: number; count: number }>()
      
      chartData.forEach(entry => {
        const date = new Date(entry.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
        
        const existing = monthlyData.get(monthKey) || { progress: 0, xpEarned: 0, count: 0 }
        monthlyData.set(monthKey, {
          progress: Math.max(existing.progress, entry.progress), // Use highest progress in month
          xpEarned: existing.xpEarned + entry.xpEarned,
          count: existing.count + (entry.progress > 0 ? 1 : 0)
        })
      })

      processedData = Array.from(monthlyData.entries()).map(([date, data]) => ({
        date,
        progress: data.progress,
        xpEarned: data.xpEarned
      }))
    }

    // Calculate trend line if requested
    let trendLine: Array<{ date: string; trend: number }> = []
    
    if (includeTrend && processedData.length > 1) {
      // Simple linear regression for trend
      const n = processedData.length
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
      
      processedData.forEach((point, index) => {
        sumX += index
        sumY += point.progress
        sumXY += index * point.progress
        sumXX += index * index
      })
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
      const intercept = (sumY - slope * sumX) / n
      
      trendLine = processedData.map((point, index) => ({
        date: point.date,
        trend: Math.max(0, Math.min(100, slope * index + intercept))
      }))
    }

    // Format response
    const response: any = {
      success: true,
      data: {
        goalId,
        goal: {
          title: goal.title,
          difficulty: goal.difficulty,
          isCompleted: goal.isCompleted
        },
        chartConfig: {
          type: chartType,
          aggregation,
          timeframe: days,
          includeXP,
          includeTrend
        },
        chartData: processedData.map(point => ({
          ...point,
          date: point.date,
          progress: Math.round(point.progress * 100) / 100,
          ...(includeXP && { xpEarned: point.xpEarned })
        }))
      }
    }

    if (includeTrend) {
      response.data.trendLine = trendLine
    }

    // Add summary statistics
    const stats = {
      totalDataPoints: processedData.length,
      averageProgress: processedData.length > 0 
        ? processedData.reduce((sum, point) => sum + point.progress, 0) / processedData.length 
        : 0,
      maxProgress: Math.max(...processedData.map(p => p.progress), 0),
      totalXP: processedData.reduce((sum, point) => sum + point.xpEarned, 0),
      progressTrend: processedData.length > 1
        ? processedData[processedData.length - 1].progress > processedData[0].progress 
          ? 'increasing' 
          : processedData[processedData.length - 1].progress < processedData[0].progress 
            ? 'decreasing' 
            : 'stable'
        : 'stable'
    }

    response.data.stats = stats

    return NextResponse.json(response)
  }, 'Fetching progress chart data')
}

/**
 * Main route handler
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck

  return withAuth(request, (req) => handleGet(req, context))
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}