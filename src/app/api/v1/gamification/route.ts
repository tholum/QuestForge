import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { initializeGamificationService } from '../../../../lib/module-helpers';

// Initialize gamification service
let gamificationService: any = null;

async function ensureGamificationService() {
  if (!gamificationService) {
    gamificationService = initializeGamificationService(prisma);
  }
  return gamificationService;
}

/**
 * GET /api/v1/gamification
 * Get gamification system overview
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    
    const service = await ensureGamificationService();
    let data;

    switch (type) {
      case 'overview':
        data = await service.getOverviewStats();
        break;
      
      case 'leaderboard':
        const leaderboardType = searchParams.get('leaderboardType') || 'xp';
        const limit = parseInt(searchParams.get('limit') || '10');
        data = await service.getLeaderboards(leaderboardType as any, limit);
        break;
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown type '${type}'`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch gamification data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/gamification
 * Process a gamification action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, moduleId, difficulty, metadata } = body;

    if (!userId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID and action are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const service = await ensureGamificationService();
    
    const result = await service.processAction(
      userId,
      action,
      moduleId,
      difficulty || 'medium',
      metadata
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: `Action '${action}' processed for user '${userId}'`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing gamification action:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process gamification action',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}