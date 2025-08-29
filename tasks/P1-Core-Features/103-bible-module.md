# P1-103: Bible Study Module

## Task Overview

**Priority**: P1 (Core Feature)  
**Status**: Not Started  
**Effort**: 5 Story Points  
**Sprint**: Core Module Features  

## Description

Implement a comprehensive Bible study module that allows users to create and track Bible reading plans, study goals, and spiritual growth objectives. This module integrates with the core goal management system while providing specialized features for Bible study tracking.

## Dependencies

- ✅ P1-101: Goal Management CRUD (core goal functionality)
- ❌ P0-001: Authentication System (for user-specific data)
- ✅ P0-002: Database Integration (schema exists)
- ❌ P2-201: Gamification Integration (XP and achievements)

## Definition of Done

### Core Bible Study Features
- [ ] Bible reading plan creation and management
- [ ] Daily reading progress tracking
- [ ] Study session logging with notes
- [ ] Scripture verse bookmarking and highlighting
- [ ] Study goal creation with Bible-specific metrics
- [ ] Prayer request and answer tracking

### User Interface Components
- [ ] Bible study dashboard with progress overview
- [ ] Reading plan selector (popular plans + custom)
- [ ] Daily reading interface with progress tracking
- [ ] Study notes interface with verse references
- [ ] Prayer journal component
- [ ] Mobile-optimized reading experience

### Integration Features
- [ ] Bible API integration for verse lookup
- [ ] Reading plan templates (One Year Bible, etc.)
- [ ] Progress synchronization with main goals
- [ ] Achievement triggers for study milestones
- [ ] Export study notes and highlights

## User Stories

### US-103.1: Bible Reading Plan Creation
```
As a Christian user
I want to create and follow Bible reading plans
So that I can systematically study Scripture and track my progress
```

**Acceptance Criteria:**
- User can select from popular reading plans (One Year Bible, Chronological, etc.)
- User can create custom reading plans with specific schedules
- Reading plans generate daily assignments automatically
- User can modify or pause reading plans as needed
- Progress is tracked and visualized clearly
- Mobile interface optimizes reading experience

### US-103.2: Study Session Tracking
```
As a Bible study participant
I want to log my study sessions with notes and insights
So that I can remember key learnings and track spiritual growth
```

**Acceptance Criteria:**
- User can log study sessions with duration and passages studied
- Rich text notes support with verse references
- Tag system for organizing study topics
- Search functionality across all study notes
- Export options for study materials
- Integration with overall spiritual growth goals

### US-103.3: Prayer Journal
```
As a person of faith
I want to record prayer requests and track answers
So that I can see God's faithfulness and grow in prayer life
```

**Acceptance Criteria:**
- User can add prayer requests with categories
- Prayer requests can be marked as answered with dates
- Private and shared prayer request options
- Progress tracking for prayer life goals
- Reminder system for regular prayer times
- Export prayer journal data

### US-103.4: Scripture Bookmarking
```
As a Bible reader
I want to bookmark and highlight meaningful verses
So that I can easily return to important passages
```

**Acceptance Criteria:**
- User can bookmark verses with personal notes
- Multiple highlight colors for different themes
- Organize bookmarks by topics or books
- Search bookmarked verses and notes
- Share bookmarks with study groups
- Export bookmarked verses with notes

## Technical Implementation

### Database Schema Extensions
```sql
-- Bible reading plans
CREATE TABLE BibleReadingPlan (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  planType TEXT NOT NULL, -- 'preset', 'custom'
  presetId TEXT, -- Reference to preset plans
  startDate DATE NOT NULL,
  endDate DATE,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Daily reading assignments
CREATE TABLE BibleReading (
  id TEXT PRIMARY KEY,
  planId TEXT NOT NULL,
  userId TEXT NOT NULL,
  assignedDate DATE NOT NULL,
  passages TEXT NOT NULL, -- JSON array of scripture references
  isCompleted BOOLEAN DEFAULT false,
  completedAt DATETIME,
  readingTimeMinutes INTEGER,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (planId) REFERENCES BibleReadingPlan(id),
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(planId, assignedDate)
);

-- Study sessions
CREATE TABLE StudySession (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT, -- Link to related goal
  title TEXT NOT NULL,
  description TEXT,
  passages TEXT, -- JSON array of scripture references
  durationMinutes INTEGER,
  studyDate DATE NOT NULL,
  notes TEXT, -- Rich text content
  tags TEXT, -- JSON array of tags
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (goalId) REFERENCES Goal(id)
);

-- Prayer requests
CREATE TABLE PrayerRequest (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'personal', 'family', 'ministry', 'world', etc.
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  isPrivate BOOLEAN DEFAULT true,
  isAnswered BOOLEAN DEFAULT false,
  answeredAt DATETIME,
  answerDescription TEXT,
  requestDate DATE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Scripture bookmarks
CREATE TABLE ScriptureBookmark (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  reference TEXT NOT NULL, -- "Genesis 1:1", "John 3:16", etc.
  version TEXT DEFAULT 'NIV', -- Bible translation
  text TEXT, -- Cached verse text
  notes TEXT,
  highlights TEXT, -- JSON array of highlight objects
  tags TEXT, -- JSON array of tags
  isPrivate BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Preset reading plans
CREATE TABLE BibleReadingPlanPreset (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  durationDays INTEGER NOT NULL,
  planData TEXT NOT NULL, -- JSON with daily assignments
  category TEXT, -- 'chronological', 'canonical', 'topical', etc.
  difficulty TEXT DEFAULT 'medium',
  isPopular BOOLEAN DEFAULT false,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### Bible Module Routes
```typescript
// src/app/api/v1/modules/bible/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = await getCurrentUserId(request);
  const type = searchParams.get('type'); // 'plans', 'readings', 'studies', 'prayers'
  
  try {
    switch (type) {
      case 'plans':
        const plans = await bibleRepository.getUserReadingPlans(userId);
        return NextResponse.json({ success: true, data: plans });
      
      case 'readings':
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const readings = await bibleRepository.getDailyReadings(userId, date);
        return NextResponse.json({ success: true, data: readings });
      
      case 'studies':
        const studies = await bibleRepository.getStudySessions(userId, {
          page: parseInt(searchParams.get('page') || '1'),
          limit: parseInt(searchParams.get('limit') || '20'),
        });
        return NextResponse.json({ success: true, data: studies });
      
      case 'prayers':
        const prayers = await bibleRepository.getPrayerRequests(userId, {
          filter: searchParams.get('filter') || 'active',
        });
        return NextResponse.json({ success: true, data: prayers });
      
      default:
        const dashboard = await bibleRepository.getDashboardData(userId);
        return NextResponse.json({ success: true, data: dashboard });
    }
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    const { type, ...data } = body;
    
    switch (type) {
      case 'reading-plan':
        const plan = await bibleRepository.createReadingPlan(userId, data);
        return NextResponse.json({ success: true, data: plan }, { status: 201 });
      
      case 'study-session':
        const session = await bibleRepository.createStudySession(userId, data);
        
        // Update related goal progress if linked
        if (data.goalId) {
          await progressRepository.recordProgress(data.goalId, {
            value: data.durationMinutes || 30,
            type: 'minutes_studied',
          });
        }
        
        return NextResponse.json({ success: true, data: session }, { status: 201 });
      
      case 'prayer-request':
        const prayer = await bibleRepository.createPrayerRequest(userId, data);
        return NextResponse.json({ success: true, data: prayer }, { status: 201 });
      
      case 'bookmark':
        const bookmark = await bibleRepository.createBookmark(userId, data);
        return NextResponse.json({ success: true, data: bookmark }, { status: 201 });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### React Components

#### Bible Study Dashboard
```typescript
// src/modules/bible/BibleStudyDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, Heart, Target } from 'lucide-react';
import { useBibleModule } from '@/hooks/useBibleModule';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';

export function BibleStudyDashboard() {
  const { dashboardData, loading, error } = useBibleModule();

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error loading Bible study data</div>;

  const {
    activePlan,
    todaysReading,
    weekProgress,
    recentStudies,
    prayerRequests,
    studyStreak,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Daily Reading Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Today's Reading
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysReading ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{todaysReading.passages.join(', ')}</h3>
                <p className="text-sm text-muted-foreground">
                  {activePlan?.name} - Day {todaysReading.dayNumber}
                </p>
              </div>
              <Progress 
                value={todaysReading.isCompleted ? 100 : 0} 
                className="h-2"
              />
              <div className="flex gap-2">
                {!todaysReading.isCompleted ? (
                  <Button size="sm" className="flex-1">
                    Start Reading
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1">
                    Review Notes
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  View Plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No active reading plan</p>
              <Button>Create Reading Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">
                {studyStreak}
              </span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">consecutive days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Week Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={weekProgress.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {weekProgress.completed} of {weekProgress.total} days
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Prayers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-600">
                {prayerRequests.active}
              </span>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {prayerRequests.answered} answered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Study Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Studies</CardTitle>
          </CardHeader>
          <CardContent>
            {recentStudies.length > 0 ? (
              <div className="space-y-3">
                {recentStudies.map((study) => (
                  <div key={study.id} className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">{study.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {study.passages.join(', ')} • {study.durationMinutes}min
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(study.studyDate))}
                    </span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View All Studies
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No study sessions yet</p>
                <Button size="sm">Log Study Session</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prayer Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Prayers</CardTitle>
          </CardHeader>
          <CardContent>
            {prayerRequests.recent.length > 0 ? (
              <div className="space-y-3">
                {prayerRequests.recent.map((prayer) => (
                  <div key={prayer.id} className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">{prayer.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {prayer.category} • {prayer.isAnswered ? 'Answered' : 'Active'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(prayer.requestDate))}
                    </span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View Prayer Journal
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No prayer requests</p>
                <Button size="sm">Add Prayer Request</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### Bible Reading Plan Creator
```typescript
// src/modules/bible/components/ReadingPlanCreator.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useBibleModule } from '@/hooks/useBibleModule';

const readingPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  planType: z.enum(['preset', 'custom']),
  presetId: z.string().optional(),
  startDate: z.date(),
  customDuration: z.number().optional(),
  description: z.string().optional(),
});

type ReadingPlanFormData = z.infer<typeof readingPlanSchema>;

export function ReadingPlanCreator() {
  const { presetPlans, createReadingPlan, loading } = useBibleModule();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const form = useForm<ReadingPlanFormData>({
    resolver: zodResolver(readingPlanSchema),
    defaultValues: {
      planType: 'preset',
      startDate: new Date(),
    },
  });

  const planType = form.watch('planType');

  const handleSubmit = async (data: ReadingPlanFormData) => {
    try {
      await createReadingPlan(data);
      // Handle success (redirect, toast, etc.)
    } catch (error) {
      console.error('Failed to create reading plan:', error);
    }
  };

  const popularPlans = presetPlans.filter(plan => plan.isPopular);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Bible Reading Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <FormControl>
                      <Select {...field} onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedPreset(null);
                      }}>
                        <option value="preset">Choose from Popular Plans</option>
                        <option value="custom">Create Custom Plan</option>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {planType === 'preset' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {popularPlans.map((plan) => (
                    <Card 
                      key={plan.id}
                      className={`cursor-pointer transition-colors ${
                        selectedPreset === plan.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedPreset(plan.id);
                        form.setValue('presetId', plan.id);
                        form.setValue('name', plan.name);
                      }}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {plan.durationDays} days • {plan.difficulty}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Bible Reading Plan"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {planType === 'custom' && (
                <>
                  <FormField
                    control={form.control}
                    name="customDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="365"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your reading plan goals..."
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Plan'}
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Mobile Optimizations

### Reading Experience
- Large, readable fonts optimized for small screens
- Swipe gestures for navigation between passages
- Offline reading capability with cached content
- Dark mode support for nighttime reading
- Adjustable text size and spacing

### Touch Interactions
- Quick-add buttons for bookmarks and notes
- Swipe actions for marking readings complete
- Long-press for verse selection and highlighting
- Pull-to-refresh for sync updates

## Testing Strategy

### Unit Tests
- Bible module service functionality
- Reading plan generation logic
- Progress calculation accuracy
- Prayer request management
- Bookmark and highlight features

### Integration Tests
- Complete Bible study workflows
- Reading plan creation and execution
- Study session logging and tracking
- Prayer journal functionality
- Mobile interface testing

### API Tests
- Bible module endpoints
- External Bible API integration
- Data synchronization
- Performance under load

## Success Metrics

### Functional Metrics
- 100% reading plan creation success rate
- < 1 second daily reading load time
- 99.9% study session save success rate
- Zero data loss for user notes and bookmarks

### User Experience Metrics
- Daily reading completion rate > 70%
- User retention with active plans > 80%
- Study session logging frequency > 3/week
- Mobile usability score > 90%

### Spiritual Growth Metrics
- Average reading streak length
- Study session duration trends
- Prayer request response tracking
- Scripture memorization progress

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Core Module Features