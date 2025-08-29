# P3-303: Social Features and Accountability Partners

## Task Overview

**Priority**: P3 (Nice-to-Have)  
**Status**: Not Started  
**Effort**: 13 Story Points  
**Sprint**: Social Integration  

## Description

Implement social features that enable users to connect with accountability partners, share achievements, create goal-focused communities, and participate in challenges. This includes user profiles, friend systems, sharing mechanisms, and privacy controls for a supportive goal-achievement environment.

## Dependencies

- ✅ P0-001: Authentication System (user accounts and security)
- ✅ P1-101: Goal Management CRUD (goals to share)
- ✅ P2-201: Gamification Integration (achievements to share)
- ❌ P2-204: Notifications System (social notifications)
- ❌ Real-time communication infrastructure

## Definition of Done

### Core Social Features
- [ ] User profiles with customizable privacy settings
- [ ] Friend/connection system with requests and approvals
- [ ] Goal sharing with permission controls
- [ ] Achievement sharing and celebrations
- [ ] Activity feed showing friends' progress
- [ ] Direct messaging between connected users

### Community Features
- [ ] Goal-focused groups and communities
- [ ] Community challenges and competitions
- [ ] Leaderboards and rankings
- [ ] Group goal creation and collaboration
- [ ] Community moderation tools
- [ ] Event organization and participation

### Accountability System
- [ ] Accountability partner matching
- [ ] Progress check-ins and reporting
- [ ] Peer support and encouragement
- [ ] Goal commitment ceremonies
- [ ] Progress accountability metrics
- [ ] Mutual goal tracking

## User Stories

### US-303.1: Social Connections
```
As a user seeking motivation
I want to connect with friends and share my goal progress
So that I can stay accountable and celebrate achievements together
```

**Acceptance Criteria:**
- User can send/receive friend requests
- User can share selected goals with friends
- Friends can see progress updates and offer encouragement
- Privacy controls allow selective sharing
- Achievement notifications are shared with chosen connections
- Activity feed shows relevant friend updates

### US-303.2: Accountability Partnership
```
As a user who needs external motivation
I want to pair with an accountability partner
So that we can help each other stay committed to our goals
```

**Acceptance Criteria:**
- System matches users with similar goals or interests
- Partners can view each other's committed goals
- Regular check-in reminders and progress sharing
- Partner feedback and encouragement features
- Mutual goal tracking and comparison
- Partnership evaluation and adjustment tools

### US-303.3: Community Challenges
```
As a competitive user
I want to participate in goal-related challenges
So that I can push myself harder and connect with like-minded people
```

**Acceptance Criteria:**
- Various challenge types (weight loss, reading, productivity)
- Challenge creation by community members
- Leaderboards and progress tracking
- Team-based and individual challenges
- Challenge completion rewards and recognition
- Fair competition with category divisions

### US-303.4: Goal Communities
```
As a user with specific goal interests
I want to join communities focused on my goal areas
So that I can learn from others and share experiences
```

**Acceptance Criteria:**
- Communities organized by goal categories/topics
- Community discussion boards and resources
- Expert-led communities with verified leaders
- Resource sharing and best practices
- Community events and group goals
- Moderation tools for healthy discussions

## Technical Implementation

### Database Schema
```sql
-- User connections/friendships
CREATE TABLE UserConnection (
  id TEXT PRIMARY KEY,
  requesterId TEXT NOT NULL,
  addresseeId TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  connectionType TEXT DEFAULT 'friend', -- 'friend', 'accountability_partner', 'mentor'
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  respondedAt DATETIME,
  FOREIGN KEY (requesterId) REFERENCES User(id),
  FOREIGN KEY (addresseeId) REFERENCES User(id),
  UNIQUE(requesterId, addresseeId)
);

-- Communities and groups
CREATE TABLE Community (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'fitness', 'learning', 'productivity', etc.
  type TEXT DEFAULT 'open', -- 'open', 'closed', 'private'
  createdByUserId TEXT NOT NULL,
  memberCount INTEGER DEFAULT 0,
  isOfficial BOOLEAN DEFAULT false,
  rules TEXT,
  coverImage TEXT,
  tags TEXT, -- JSON array
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (createdByUserId) REFERENCES User(id)
);

-- Community memberships
CREATE TABLE CommunityMembership (
  id TEXT PRIMARY KEY,
  communityId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'member', 'moderator', 'admin', 'owner'
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  isActive BOOLEAN DEFAULT true,
  FOREIGN KEY (communityId) REFERENCES Community(id),
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(communityId, userId)
);

-- Goal sharing and visibility
CREATE TABLE GoalShare (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  userId TEXT NOT NULL,
  shareType TEXT NOT NULL, -- 'public', 'friends', 'community', 'partner'
  targetId TEXT, -- Community ID or user ID for targeted sharing
  permissions TEXT, -- JSON: {canComment: true, canCheer: true}
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goalId) REFERENCES Goal(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Social activity feed
CREATE TABLE SocialActivity (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  activityType TEXT NOT NULL, -- 'goal_created', 'goal_completed', 'achievement_earned', 'progress_update'
  entityType TEXT NOT NULL, -- 'goal', 'achievement', 'progress'
  entityId TEXT NOT NULL,
  visibility TEXT DEFAULT 'friends', -- 'public', 'friends', 'private'
  metadata TEXT, -- JSON with activity details
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Community challenges
CREATE TABLE Challenge (
  id TEXT PRIMARY KEY,
  communityId TEXT,
  createdByUserId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  challengeType TEXT NOT NULL, -- 'individual', 'team', 'community'
  category TEXT,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  rules TEXT,
  prizes TEXT, -- JSON with prize information
  participantLimit INTEGER,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (communityId) REFERENCES Community(id),
  FOREIGN KEY (createdByUserId) REFERENCES User(id)
);

-- Challenge participation
CREATE TABLE ChallengeParticipation (
  id TEXT PRIMARY KEY,
  challengeId TEXT NOT NULL,
  userId TEXT NOT NULL,
  teamName TEXT, -- For team challenges
  goals TEXT, -- JSON array of goal IDs for this challenge
  currentScore DECIMAL(10,2) DEFAULT 0,
  isCompleted BOOLEAN DEFAULT false,
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME,
  FOREIGN KEY (challengeId) REFERENCES Challenge(id),
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(challengeId, userId)
);

-- Social interactions (likes, comments, cheers)
CREATE TABLE SocialInteraction (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  targetType TEXT NOT NULL, -- 'goal', 'achievement', 'activity', 'challenge'
  targetId TEXT NOT NULL,
  interactionType TEXT NOT NULL, -- 'like', 'cheer', 'comment', 'encourage'
  content TEXT, -- For comments
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- User privacy settings
CREATE TABLE UserPrivacySettings (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  profileVisibility TEXT DEFAULT 'friends', -- 'public', 'friends', 'private'
  goalsVisibility TEXT DEFAULT 'friends',
  achievementsVisibility TEXT DEFAULT 'friends',
  activityFeedVisibility TEXT DEFAULT 'friends',
  allowFriendRequests BOOLEAN DEFAULT true,
  allowChallengeInvites BOOLEAN DEFAULT true,
  allowDirectMessages BOOLEAN DEFAULT true,
  emailNotifications BOOLEAN DEFAULT true,
  pushNotifications BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId)
);
```

### API Endpoints
```typescript
// src/app/api/v1/social/connections/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = await getCurrentUserId(request);
  const type = searchParams.get('type') || 'friends';
  
  try {
    const connections = await socialService.getUserConnections(userId, type);
    return NextResponse.json({ success: true, data: connections });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    const { action, targetUserId, connectionType } = body;
    
    let result;
    switch (action) {
      case 'send_request':
        result = await socialService.sendConnectionRequest(userId, targetUserId, connectionType);
        break;
      case 'accept_request':
        result = await socialService.acceptConnectionRequest(userId, targetUserId);
        break;
      case 'decline_request':
        result = await socialService.declineConnectionRequest(userId, targetUserId);
        break;
      case 'remove_connection':
        result = await socialService.removeConnection(userId, targetUserId);
        break;
      default:
        throw new Error('Invalid action');
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Social Service Implementation
```typescript
// src/lib/services/social-service.ts
export class SocialService {
  async sendConnectionRequest(requesterId: string, addresseeId: string, connectionType = 'friend') {
    // Check if connection already exists
    const existing = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });
    
    if (existing) {
      throw new Error('Connection already exists or pending');
    }
    
    const connection = await prisma.userConnection.create({
      data: {
        requesterId,
        addresseeId,
        connectionType,
        status: 'pending',
      },
    });
    
    // Send notification to addressee
    await notificationService.sendConnectionRequest(addresseeId, requesterId);
    
    return connection;
  }
  
  async getActivityFeed(userId: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 20, offset = 0 } = options;
    
    // Get user's friends
    const friends = await this.getUserConnections(userId, 'friends');
    const friendIds = friends.map(f => f.id);
    
    // Get activities from friends and user
    const activities = await prisma.socialActivity.findMany({
      where: {
        OR: [
          { userId, visibility: { in: ['public', 'friends'] } },
          { 
            userId: { in: friendIds },
            visibility: { in: ['public', 'friends'] },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    
    // Enhance activities with additional data
    const enhancedActivities = await Promise.all(
      activities.map(async activity => {
        const metadata = JSON.parse(activity.metadata || '{}');
        
        // Add entity details based on type
        if (activity.entityType === 'goal') {
          const goal = await prisma.goal.findUnique({
            where: { id: activity.entityId },
            select: { id: true, title: true, description: true },
          });
          metadata.goal = goal;
        }
        
        // Add interaction counts
        const interactions = await prisma.socialInteraction.groupBy({
          by: ['interactionType'],
          where: {
            targetType: activity.entityType,
            targetId: activity.entityId,
          },
          _count: true,
        });
        
        metadata.interactions = interactions.reduce((acc, interaction) => {
          acc[interaction.interactionType] = interaction._count;
          return acc;
        }, {});
        
        return {
          ...activity,
          metadata,
        };
      })
    );
    
    return enhancedActivities;
  }
  
  async shareGoal(userId: string, goalId: string, shareOptions: {
    shareType: string;
    targetId?: string;
    permissions?: any;
  }) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });
    
    if (!goal) throw new Error('Goal not found');
    
    const share = await prisma.goalShare.create({
      data: {
        goalId,
        userId,
        shareType: shareOptions.shareType,
        targetId: shareOptions.targetId,
        permissions: JSON.stringify(shareOptions.permissions || {}),
      },
    });
    
    // Create activity for feed
    await this.createSocialActivity(userId, {
      activityType: 'goal_shared',
      entityType: 'goal',
      entityId: goalId,
      visibility: shareOptions.shareType,
      metadata: {
        goalTitle: goal.title,
        shareType: shareOptions.shareType,
      },
    });
    
    return share;
  }
  
  async createChallenge(userId: string, challengeData: any) {
    const challenge = await prisma.challenge.create({
      data: {
        createdByUserId: userId,
        title: challengeData.title,
        description: challengeData.description,
        challengeType: challengeData.challengeType,
        category: challengeData.category,
        startDate: new Date(challengeData.startDate),
        endDate: new Date(challengeData.endDate),
        rules: challengeData.rules,
        prizes: JSON.stringify(challengeData.prizes || {}),
        participantLimit: challengeData.participantLimit,
        communityId: challengeData.communityId,
      },
    });
    
    // Notify community members if it's a community challenge
    if (challengeData.communityId) {
      await this.notifyCommunityMembers(
        challengeData.communityId,
        'new_challenge',
        { challengeId: challenge.id }
      );
    }
    
    return challenge;
  }
  
  private async createSocialActivity(userId: string, activityData: {
    activityType: string;
    entityType: string;
    entityId: string;
    visibility: string;
    metadata: any;
  }) {
    return await prisma.socialActivity.create({
      data: {
        userId,
        activityType: activityData.activityType,
        entityType: activityData.entityType,
        entityId: activityData.entityId,
        visibility: activityData.visibility,
        metadata: JSON.stringify(activityData.metadata),
      },
    });
  }
}
```

## Mobile Optimizations

### Social Interactions
- Touch-friendly social action buttons
- Swipe gestures for feed navigation
- Quick reaction options (like, cheer, encourage)
- Offline support for viewing cached social content

### Real-time Features
- Push notifications for social interactions
- Live activity updates in feeds
- Real-time challenge progress updates
- Instant messaging with offline message queuing

## Testing Strategy

### Unit Tests
- Social connection logic
- Privacy setting enforcement
- Activity feed generation
- Challenge scoring algorithms

### Integration Tests
- Complete social interaction workflows
- Privacy control validation
- Community management features
- Real-time notification delivery

### Social Testing
- User acceptance testing with focus groups
- Community moderation scenario testing
- Challenge participation flow testing
- Cross-platform social feature testing

## Success Metrics

### Engagement Metrics
- Social feature adoption rate > 40%
- Daily active social interactions > 1000
- Average session duration increase > 25%
- User retention improvement > 30%

### Community Metrics
- Community creation rate > 10/month
- Average community size > 50 members
- Challenge participation rate > 60%
- User-generated content volume > 500/week

### Quality Metrics
- User satisfaction with social features > 4.0/5
- Community moderation response time < 2 hours
- Social feature bug reports < 1% of interactions
- Privacy compliance score 100%

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Social Integration