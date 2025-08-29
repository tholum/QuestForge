# P1-105: Missing Core Pages Implementation

## Task Overview

**Priority**: P1 (Core Feature)  
**Status**: Not Started  
**Effort**: 5 Story Points  
**Sprint**: Core Application Pages  

## Description

Implement all missing core pages that are essential for the Goal Assistant application's complete functionality. This includes settings management, module overview, achievements display, analytics dashboard, and calendar view. These pages are crucial for providing users with a complete goal management experience.

## Dependencies

- ✅ P1-101: Goal Management CRUD (for data display)
- ✅ P0-001: Authentication System (for user settings)
- ✅ P0-002: Database Integration (for data persistence)
- ❌ P2-201: Gamification Integration (for achievements page)
- ❌ P2-203: Calendar View (for calendar functionality)

## Definition of Done

### Core Pages Implementation
- [ ] Settings page with user preferences and account management
- [ ] Modules overview page with module management
- [ ] Achievements page displaying user accomplishments
- [ ] Analytics dashboard with goal and progress insights
- [ ] Calendar view for goal scheduling and deadline tracking
- [ ] Profile page with user information and statistics

### User Interface Components
- [ ] Settings forms with validation and save functionality
- [ ] Module cards with enable/disable toggles
- [ ] Achievement badges and progress displays
- [ ] Interactive charts and graphs for analytics
- [ ] Calendar component with goal integration
- [ ] Responsive design for all screen sizes

### Data Integration Features
- [ ] Real-time data updates across all pages
- [ ] Export functionality for analytics data
- [ ] Import/sync capabilities where applicable
- [ ] Proper error handling and loading states
- [ ] Mobile optimization for all pages

## User Stories

### US-105.1: Settings Management
```
As a user
I want to manage my account settings and application preferences
So that I can customize the application to my needs and maintain my account
```

**Acceptance Criteria:**
- User can update personal information (name, email, profile picture)
- User can change password with proper validation
- User can set notification preferences
- User can choose theme and display preferences
- User can manage privacy settings
- Settings are saved immediately with visual feedback

### US-105.2: Module Management
```
As a user
I want to view and manage available modules
So that I can enable/disable features based on my current life focus areas
```

**Acceptance Criteria:**
- User can see all available modules with descriptions
- User can enable/disable modules with immediate effect
- User can see module-specific statistics and usage
- User can access module-specific settings
- Changes update navigation and available features
- Module dependencies are handled properly

### US-105.3: Achievements Overview
```
As a user
I want to view my achievements and progress milestones
So that I can see my accomplishments and stay motivated
```

**Acceptance Criteria:**
- User can view earned and available achievements
- User can see progress toward unearned achievements
- Achievements are organized by categories and modules
- User can share achievements (if enabled)
- Recent achievements are highlighted prominently
- Achievement details include earning criteria and dates

### US-105.4: Analytics Dashboard
```
As a user
I want to view detailed analytics about my goals and progress
So that I can understand my patterns and improve my performance
```

**Acceptance Criteria:**
- User can view goal completion rates and trends
- User can see time-based analytics (daily, weekly, monthly)
- User can filter analytics by module, time period, or goal type
- User can export analytics data
- Visual charts and graphs display data clearly
- Mobile view maintains data readability

### US-105.5: Calendar Integration
```
As a user
I want to view my goals and deadlines in a calendar format
So that I can better plan and schedule my goal-related activities
```

**Acceptance Criteria:**
- User can view goals and deadlines in monthly, weekly, daily views
- User can create goals directly from calendar interface
- User can drag and drop to reschedule goal deadlines
- Color coding differentiates modules and priorities
- Calendar syncs with external calendar apps (optional)
- Mobile calendar is touch-friendly and responsive

## Technical Implementation

### Database Schema Extensions
```sql
-- User settings and preferences
CREATE TABLE UserSetting (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  category TEXT NOT NULL, -- 'notification', 'privacy', 'display', 'account'
  settingKey TEXT NOT NULL,
  settingValue TEXT NOT NULL,
  dataType TEXT DEFAULT 'string', -- 'string', 'boolean', 'number', 'json'
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, category, settingKey)
);

-- Module configurations
CREATE TABLE UserModuleConfig (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  moduleId TEXT NOT NULL,
  isEnabled BOOLEAN DEFAULT true,
  configuration TEXT, -- JSON config specific to module
  lastUsedAt DATETIME,
  usageCount INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, moduleId)
);

-- Analytics cache for performance
CREATE TABLE AnalyticsCache (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  cacheKey TEXT NOT NULL, -- 'weekly_summary', 'monthly_trends', etc.
  data TEXT NOT NULL, -- JSON cached data
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, cacheKey)
);

-- Calendar events (for goals and deadlines)
CREATE TABLE CalendarEvent (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT,
  title TEXT NOT NULL,
  description TEXT,
  eventType TEXT NOT NULL, -- 'goal_deadline', 'milestone', 'reminder', 'custom'
  startDate DATETIME NOT NULL,
  endDate DATETIME,
  isAllDay BOOLEAN DEFAULT false,
  color TEXT, -- Hex color for display
  isCompleted BOOLEAN DEFAULT false,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (goalId) REFERENCES Goal(id)
);

-- User profile enhancements
ALTER TABLE User ADD COLUMN profilePicture TEXT;
ALTER TABLE User ADD COLUMN bio TEXT;
ALTER TABLE User ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE User ADD COLUMN locale TEXT DEFAULT 'en-US';
ALTER TABLE User ADD COLUMN onboardingCompleted BOOLEAN DEFAULT false;
ALTER TABLE User ADD COLUMN lastActiveAt DATETIME;
```

### API Endpoints

#### Settings Management
```typescript
// src/app/api/v1/settings/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = await getCurrentUserId(request);
  const category = searchParams.get('category');
  
  try {
    const settings = await settingsRepository.getUserSettings(userId, category);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    const { category, settings } = body;
    
    const updatedSettings = await settingsRepository.updateUserSettings(
      userId, 
      category, 
      settings
    );
    
    // Clear relevant caches
    await cacheService.clearUserCache(userId, category);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedSettings 
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Analytics Data
```typescript
// src/app/api/v1/analytics/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = await getCurrentUserId(request);
  const period = searchParams.get('period') || 'month';
  const module = searchParams.get('module');
  
  try {
    // Check cache first
    const cacheKey = `analytics_${period}_${module || 'all'}`;
    const cached = await analyticsRepository.getCachedData(userId, cacheKey);
    
    if (cached && new Date(cached.expiresAt) > new Date()) {
      return NextResponse.json({ 
        success: true, 
        data: JSON.parse(cached.data) 
      });
    }
    
    // Generate fresh analytics
    const analytics = await analyticsService.generateAnalytics(userId, {
      period,
      moduleId: module,
    });
    
    // Cache for future requests
    await analyticsRepository.cacheData(userId, cacheKey, analytics, {
      expiresIn: period === 'day' ? '1 hour' : '6 hours'
    });
    
    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### React Components

#### Settings Page
```typescript
// src/app/settings/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/useUser';
import { useSettings } from '@/hooks/useSettings';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';

export default function SettingsPage() {
  const { user, updateUser } = useUser();
  const { settings, updateSettings, loading } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={user?.firstName || ''}
                    onChange={(e) => updateUser({ firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={user?.lastName || ''}
                    onChange={(e) => updateUser({ lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  onChange={(e) => updateUser({ email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={user?.bio || ''}
                  onChange={(e) => updateUser({ bio: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={user?.timezone || 'UTC'}
                    onValueChange={(value) => updateUser({ timezone: value })}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale">Language</Label>
                  <Select
                    value={user?.locale || 'en-US'}
                    onValueChange={(value) => updateUser({ locale: value })}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">Change Password</Button>
              <Separator />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Account created: {format(new Date(user?.createdAt), 'MMMM d, yyyy')}</p>
                <p>Last active: {format(new Date(user?.lastActiveAt || user?.updatedAt), 'MMMM d, yyyy')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your goals and achievements
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings?.emailNotifications || false}
                  onCheckedChange={(checked) => 
                    updateSettings('notification', { emailNotifications: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications for reminders and updates
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings?.pushNotifications || false}
                  onCheckedChange={(checked) => 
                    updateSettings('notification', { pushNotifications: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-summary">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your progress
                  </p>
                </div>
                <Switch
                  id="weekly-summary"
                  checked={settings?.weeklySummary || false}
                  onCheckedChange={(checked) => 
                    updateSettings('notification', { weeklySummary: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-visibility">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch
                  id="profile-visibility"
                  checked={settings?.publicProfile || false}
                  onCheckedChange={(checked) => 
                    updateSettings('privacy', { publicProfile: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics-sharing">Analytics Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Share anonymous usage data to improve the app
                  </p>
                </div>
                <Switch
                  id="analytics-sharing"
                  checked={settings?.analyticsSharing ?? true}
                  onCheckedChange={(checked) => 
                    updateSettings('privacy', { analyticsSharing: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings?.theme || 'system'}
                  onValueChange={(value) => updateSettings('display', { theme: value })}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="density">Display Density</Label>
                <Select
                  value={settings?.density || 'comfortable'}
                  onValueChange={(value) => updateSettings('display', { density: value })}
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="animations">Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable smooth transitions and animations
                  </p>
                </div>
                <Switch
                  id="animations"
                  checked={settings?.animations ?? true}
                  onCheckedChange={(checked) => 
                    updateSettings('display', { animations: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Analytics Dashboard
```typescript
// src/app/analytics/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  Download,
  Filter,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const [module, setModule] = useState('all');
  const { analytics, loading, exportData } = useAnalytics({ period, module });

  if (loading) return <LoadingSpinner />;

  const {
    overview,
    completionTrends,
    moduleBreakdown,
    productivityMetrics,
    timeAnalysis,
    achievementStats,
  } = analytics;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Insights into your goal achievement and productivity patterns
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </Select>
          
          <Select value={module} onValueChange={setModule}>
            <option value="all">All Modules</option>
            <option value="fitness">Fitness</option>
            <option value="learning">Learning</option>
            <option value="bible">Bible Study</option>
            <option value="work">Work</option>
          </Select>
          
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goals Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overview.completedGoals}
            </div>
            <p className="text-xs text-muted-foreground">
              of {overview.totalGoals} goals ({overview.completionRate}%)
            </p>
            <Progress value={overview.completionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(overview.totalHours)}h
            </div>
            <p className="text-xs text-muted-foreground">
              +{overview.hoursChange}% from last {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overview.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground">
              days active (best: {overview.bestStreak})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overview.achievementsEarned}
            </div>
            <p className="text-xs text-muted-foreground">
              of {overview.totalAchievements} available
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Completion Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={completionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Completed Goals"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="New Goals"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timeAnalysis.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={moduleBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {moduleBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Module Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moduleBreakdown.map((module) => (
                    <div key={module.name} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{module.name}</span>
                        <Badge style={{ backgroundColor: module.color }}>
                          {module.completionRate}%
                        </Badge>
                      </div>
                      <Progress value={module.completionRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {module.completed} of {module.total} goals completed
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Productivity Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-green-600">
                    {productivityMetrics.overallScore}
                  </div>
                  <p className="text-muted-foreground">
                    Based on goal completion, consistency, and time investment
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">
                        {productivityMetrics.consistency}%
                      </div>
                      <div className="text-xs text-muted-foreground">Consistency</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {productivityMetrics.efficiency}%
                      </div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {productivityMetrics.focus}%
                      </div>
                      <div className="text-xs text-muted-foreground">Focus</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeAnalysis.distribution.map((item) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.hours}h ({item.percentage}%)
                        </span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievementStats.recent.map((achievement) => (
              <Card key={achievement.id} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <h3 className="font-semibold">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  <Badge variant="secondary">
                    {format(new Date(achievement.earnedAt), 'MMM d, yyyy')}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Mobile Optimizations

### Touch-Friendly Interface
- Large buttons and touch targets
- Swipe gestures for navigation
- Pull-to-refresh functionality
- Mobile-optimized charts and graphs

### Performance Optimizations
- Lazy loading of heavy components
- Chart data virtualization
- Efficient data caching
- Progressive web app features

## Testing Strategy

### Unit Tests
- Settings management functionality
- Analytics calculations accuracy
- Calendar date handling
- Module configuration logic

### Integration Tests
- Complete user settings workflows
- Analytics data generation and display
- Calendar integration with goals
- Module enable/disable functionality

### Mobile Testing
- Responsive design across devices
- Touch interaction testing
- Performance on various screen sizes
- Offline functionality where applicable

## Success Metrics

### Functional Metrics
- 100% settings save success rate
- < 2 second analytics load time
- 99.9% data accuracy in analytics
- Zero data loss in user preferences

### User Experience Metrics
- Settings page usage rate > 80%
- Analytics page engagement > 60%
- Calendar feature adoption > 70%
- Mobile usability score > 90%

### Performance Metrics
- Page load times < 2 seconds
- Analytics chart render time < 1 second
- Settings save response < 500ms
- Mobile scroll performance at 60fps

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Core Application Pages