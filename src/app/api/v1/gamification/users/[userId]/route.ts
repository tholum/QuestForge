import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { initializeGamificationService } from '../../../../../../lib/module-helpers';

// Initialize gamification service
let gamificationService: any = null;

async function ensureGamificationService() {
  if (!gamificationService) {
    gamificationService = initializeGamificationService(prisma);
  }
  return gamificationService;
}

/**
 * GET /api/v1/gamification/users/[userId]
 * Get user's complete gamification profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];

    const service = await ensureGamificationService();
    
    // Get base profile
    const profile = await service.getUserProfile(userId);
    
    // Add optional data based on include parameter
    const data: any = { profile };
    
    if (include.includes('activity')) {
      const limit = parseInt(searchParams.get('activityLimit') || '20');
      data.activityFeed = await service.getActivityFeed(userId, limit);
    }
    
    if (include.includes('notifications')) {
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      data.notifications = await service.getUserNotifications(userId, unreadOnly);
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user gamification profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user gamification profile',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/gamification/users/[userId]
 * Update user's gamification preferences
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid preferences object is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Update user preferences in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: preferences as any
      }
    });

    return NextResponse.json({
      success: true,
      message: `Preferences updated for user '${userId}'`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user preferences',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}