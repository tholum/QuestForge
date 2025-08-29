# P2-204: Real-time Notifications and Reminders System

## Task Overview

**Priority**: P2 (Enhanced Feature)  
**Status**: Not Started  
**Effort**: 5 Story Points  
**Sprint**: Enhanced User Experience  

## Description

Implement a comprehensive notification system that provides timely reminders for goal deadlines, progress updates, achievement notifications, and motivational messages. The system includes push notifications, email notifications, and in-app notifications with customizable preferences and delivery methods.

## Dependencies

- ✅ P0-001: Authentication System (for user notification preferences)
- ✅ P1-101: Goal Management CRUD (for goal-related notifications)
- ✅ P1-102: Progress Tracking (for progress reminders)
- ❌ P2-201: Gamification Integration (for achievement notifications)
- ❌ P2-203: Calendar View (for calendar-based reminders)

## Definition of Done

### Core Notification Features
- [ ] Push notification infrastructure and delivery
- [ ] Email notification system with templates
- [ ] In-app notification center with history
- [ ] Customizable notification preferences per category
- [ ] Smart notification timing based on user behavior
- [ ] Notification delivery status tracking

### Notification Types and Triggers
- [ ] Goal deadline reminders (configurable timing)
- [ ] Progress milestone celebrations
- [ ] Achievement unlock notifications
- [ ] Daily/weekly motivation messages
- [ ] Inactivity reminders and re-engagement
- [ ] Custom reminder scheduling

### Advanced Features
- [ ] Notification batching to prevent spam
- [ ] Smart quiet hours and do-not-disturb modes
- [ ] Rich notifications with action buttons
- [ ] Notification analytics and engagement tracking
- [ ] Integration with device notification settings
- [ ] Multi-language notification support

## User Stories

### US-204.1: Goal Deadline Reminders
```
As a user with upcoming deadlines
I want to receive timely reminders about my goal deadlines
So that I don't miss important dates and can plan accordingly
```

**Acceptance Criteria:**
- User receives notifications 1 day, 1 week, and custom intervals before deadlines
- Notification includes goal details and current progress
- User can snooze or dismiss reminders
- Overdue goal notifications are sent with increasing urgency
- Notifications respect user's quiet hours settings
- Mobile and desktop notifications work seamlessly

### US-204.2: Achievement Celebrations
```
As a user who completes goals and milestones
I want to receive celebratory notifications for my achievements
So that I feel motivated and acknowledged for my progress
```

**Acceptance Criteria:**
- Immediate notification when goals are completed
- Special notifications for streak achievements and milestones
- Rich notifications with celebration graphics and sounds
- Option to share achievements via notification actions
- Achievement notifications include XP and level information
- Customizable celebration preferences

### US-204.3: Smart Engagement Reminders
```
As a user who sometimes loses motivation
I want the app to send me encouraging reminders to stay engaged
So that I maintain consistency in working toward my goals
```

**Acceptance Criteria:**
- Inactivity detection triggers gentle re-engagement reminders
- Personalized motivational messages based on user preferences
- Smart timing based on user's historical activity patterns
- Progressive reminder intensity (gentle → firm → urgent)
- Easy opt-out options for users who prefer less guidance
- Context-aware reminders based on current goals

### US-204.4: Notification Management
```
As a user who values control over my digital environment
I want granular control over notification types and timing
So that I receive helpful reminders without being overwhelmed
```

**Acceptance Criteria:**
- Detailed notification preferences by category and type
- Quiet hours configuration with time zone support
- Notification frequency controls (immediate, batched, digest)
- Channel preferences (push, email, in-app only)
- Easy disable/enable toggles for all notification types
- Notification history and management interface

## Technical Implementation

### Database Schema
```sql
-- User notification preferences
CREATE TABLE NotificationPreference (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  category TEXT NOT NULL, -- 'deadlines', 'achievements', 'motivation', 'progress'
  notificationType TEXT NOT NULL, -- 'push', 'email', 'in_app'
  isEnabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'immediate', -- 'immediate', 'daily_digest', 'weekly_digest'
  quietHoursStart TIME,
  quietHoursEnd TIME,
  advanceNotice INTEGER, -- minutes before deadline
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, category, notificationType)
);

-- Notification queue and history
CREATE TABLE Notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  notificationType TEXT NOT NULL,
  data TEXT, -- JSON payload with additional data
  scheduledFor DATETIME,
  sentAt DATETIME,
  readAt DATETIME,
  clickedAt DATETIME,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  deliveryAttempts INTEGER DEFAULT 0,
  errorMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Push notification subscriptions
CREATE TABLE PushSubscription (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dhKey TEXT NOT NULL,
  authKey TEXT NOT NULL,
  userAgent TEXT,
  isActive BOOLEAN DEFAULT true,
  lastUsedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Notification templates
CREATE TABLE NotificationTemplate (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  templateType TEXT NOT NULL, -- 'push', 'email', 'in_app'
  language TEXT DEFAULT 'en',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  htmlTemplate TEXT, -- For email notifications
  variables TEXT, -- JSON array of template variables
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification analytics
CREATE TABLE NotificationAnalytics (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  notificationId TEXT NOT NULL,
  event TEXT NOT NULL, -- 'delivered', 'opened', 'clicked', 'dismissed'
  eventData TEXT, -- JSON with additional event data
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (notificationId) REFERENCES Notification(id)
);
```

### API Endpoints
```typescript
// src/app/api/v1/notifications/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = await getCurrentUserId(request);
  const type = searchParams.get('type'); // 'unread', 'all', 'preferences'
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  try {
    if (type === 'preferences') {
      const preferences = await notificationService.getUserPreferences(userId);
      return NextResponse.json({ success: true, data: preferences });
    }
    
    const notifications = await notificationService.getUserNotifications(userId, {
      unreadOnly: type === 'unread',
      limit,
      offset,
    });
    
    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'subscribe_push':
        const subscription = await notificationService.subscribeToPush(userId, data.subscription);
        return NextResponse.json({ success: true, data: subscription });
      
      case 'update_preferences':
        const preferences = await notificationService.updatePreferences(userId, data.preferences);
        return NextResponse.json({ success: true, data: preferences });
      
      case 'mark_read':
        await notificationService.markAsRead(userId, data.notificationIds);
        return NextResponse.json({ success: true });
      
      case 'test_notification':
        await notificationService.sendTestNotification(userId, data.type);
        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Notification Service Implementation
```typescript
// src/lib/services/notification-service.ts
import webpush from 'web-push';
import { Notification, NotificationPreference } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { emailService } from './email-service';

export class NotificationService {
  private webPushConfig = {
    publicKey: process.env.VAPID_PUBLIC_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!,
    subject: process.env.VAPID_SUBJECT!,
  };

  constructor() {
    webpush.setVapidDetails(
      this.webPushConfig.subject,
      this.webPushConfig.publicKey,
      this.webPushConfig.privateKey
    );
  }

  async scheduleNotification(userId: string, notification: {
    title: string;
    message: string;
    category: string;
    data?: any;
    scheduledFor?: Date;
  }) {
    const scheduledFor = notification.scheduledFor || new Date();
    
    const createdNotification = await prisma.notification.create({
      data: {
        userId,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        notificationType: 'push',
        data: JSON.stringify(notification.data || {}),
        scheduledFor,
      },
    });

    // If scheduled for now, send immediately
    if (scheduledFor <= new Date()) {
      await this.processNotification(createdNotification.id);
    }

    return createdNotification;
  }

  async processNotification(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });

    if (!notification) return;

    // Check user preferences
    const preferences = await this.getUserPreferences(notification.userId);
    const categoryPref = preferences.find(p => 
      p.category === notification.category && p.notificationType === 'push'
    );

    if (!categoryPref?.isEnabled) return;

    // Check quiet hours
    if (this.isInQuietHours(categoryPref)) return;

    try {
      // Send push notification
      await this.sendPushNotification(notification);
      
      // Send email if enabled
      const emailPref = preferences.find(p => 
        p.category === notification.category && p.notificationType === 'email'
      );
      
      if (emailPref?.isEnabled) {
        await this.sendEmailNotification(notification);
      }

      // Mark as sent
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          status: 'sent', 
          sentAt: new Date(),
        },
      });

    } catch (error) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          status: 'failed',
          errorMessage: error.message,
          deliveryAttempts: { increment: 1 },
        },
      });
    }
  }

  private async sendPushNotification(notification: Notification & { user: any }) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: notification.userId, isActive: true },
    });

    const payload = JSON.stringify({
      title: notification.title,
      message: notification.message,
      icon: '/icons/notification-icon.png',
      badge: '/icons/notification-badge.png',
      tag: notification.category,
      data: JSON.parse(notification.data || '{}'),
      actions: this.getNotificationActions(notification.category),
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey,
          },
        }, payload)
      )
    );

    // Handle failed subscriptions
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        // Mark subscription as inactive if it failed
        prisma.pushSubscription.update({
          where: { id: subscriptions[index].id },
          data: { isActive: false },
        });
      }
    });
  }

  private async sendEmailNotification(notification: Notification & { user: any }) {
    const template = await this.getEmailTemplate(notification.category, 'en');
    
    if (!template) return;

    const htmlContent = this.renderEmailTemplate(template, {
      userName: notification.user.firstName || 'there',
      notificationTitle: notification.title,
      notificationMessage: notification.message,
      data: JSON.parse(notification.data || '{}'),
    });

    await emailService.sendEmail({
      to: notification.user.email,
      subject: notification.title,
      html: htmlContent,
    });
  }

  async scheduleGoalDeadlineReminders(goalId: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { user: true, module: true },
    });

    if (!goal?.targetDate) return;

    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    
    // Schedule reminders at different intervals
    const reminderIntervals = [
      { days: 7, label: '1 week' },
      { days: 3, label: '3 days' },
      { days: 1, label: '1 day' },
      { days: 0, label: 'today' },
    ];

    for (const interval of reminderIntervals) {
      const reminderDate = new Date(targetDate);
      reminderDate.setDate(reminderDate.getDate() - interval.days);

      if (reminderDate > now) {
        await this.scheduleNotification(goal.userId, {
          title: `Goal Reminder: ${goal.title}`,
          message: `Your goal "${goal.title}" is due ${interval.label}!`,
          category: 'deadlines',
          scheduledFor: reminderDate,
          data: {
            goalId: goal.id,
            moduleId: goal.moduleId,
            targetDate: goal.targetDate,
          },
        });
      }
    }
  }

  async sendAchievementNotification(userId: string, achievement: any) {
    await this.scheduleNotification(userId, {
      title: '🎉 Achievement Unlocked!',
      message: `You've earned "${achievement.name}" - ${achievement.description}`,
      category: 'achievements',
      data: {
        achievementId: achievement.id,
        xpEarned: achievement.xpReward,
        type: 'achievement_unlocked',
      },
    });
  }

  async sendMotivationalReminder(userId: string) {
    const motivationalMessages = [
      "Great goals aren't achieved overnight. Keep going! 💪",
      "Every small step counts toward your big dreams! 🌟",
      "Your future self will thank you for the work you do today! 🚀",
      "Progress, not perfection. You've got this! ✨",
      "Consistency beats perfection every time! 🎯",
    ];

    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    await this.scheduleNotification(userId, {
      title: 'Stay Motivated! 🌟',
      message,
      category: 'motivation',
    });
  }

  private getNotificationActions(category: string) {
    const actions = {
      deadlines: [
        { action: 'view_goal', title: 'View Goal' },
        { action: 'snooze', title: 'Remind Later' },
      ],
      achievements: [
        { action: 'view_achievement', title: 'View Details' },
        { action: 'share', title: 'Share' },
      ],
      progress: [
        { action: 'log_progress', title: 'Log Progress' },
        { action: 'view_goal', title: 'View Goal' },
      ],
    };

    return actions[category] || [];
  }

  private isInQuietHours(preference: NotificationPreference): boolean {
    if (!preference.quietHoursStart || !preference.quietHoursEnd) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.parseTime(preference.quietHoursStart);
    const endTime = this.parseTime(preference.quietHoursEnd);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export const notificationService = new NotificationService();
```

## Mobile Optimizations

### Native Integration
- Push notification permissions handling
- Rich notifications with images and actions
- Notification channels and categories
- Background notification processing

### User Experience
- Smart notification timing based on usage patterns
- Adaptive notification frequency
- Quick actions from notification panel
- Notification history and management

## Testing Strategy

### Unit Tests
- Notification scheduling logic
- Preference filtering and validation
- Template rendering accuracy
- Push notification payload generation

### Integration Tests
- End-to-end notification delivery
- Email notification sending
- Push notification subscriptions
- Notification analytics tracking

### Mobile Testing
- Push notification delivery across platforms
- Notification action handling
- Background processing validation
- Battery usage optimization

## Success Metrics

### Functional Metrics
- 95%+ notification delivery success rate
- < 30 second notification delivery time
- 100% user preference compliance
- Zero spam notifications

### User Experience Metrics
- Notification engagement rate > 40%
- Notification click-through rate > 15%
- User satisfaction with notifications > 4.0/5
- Notification unsubscribe rate < 5%

### Performance Metrics
- Notification processing time < 5 seconds
- Email delivery success rate > 98%
- Push notification success rate > 90%
- Server response time < 500ms

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Enhanced User Experience