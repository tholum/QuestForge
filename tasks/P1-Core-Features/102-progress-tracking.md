# P1-102: Progress Tracking System

## Task Overview

**Priority**: P1 (Core Feature)  
**Status**: Not Started  
**Effort**: 8 Story Points  
**Sprint**: Core Functionality  

## Description

Implement a comprehensive progress tracking system that allows users to record, visualize, and analyze their progress toward goals. This includes manual progress entry, automatic progress calculation, visual charts, and XP earning through progress updates.

## Dependencies

- ✅ P1-101: Goal Management CRUD (progress is tied to goals)
- ✅ P0-002: Database Integration (Progress model exists)
- ❌ Gamification system integration
- ✅ Chart/visualization components

## Definition of Done

### Core Progress Features
- [ ] Manual progress entry with validation
- [ ] Progress visualization (charts, bars, trends)
- [ ] Progress history and timeline view
- [ ] Automatic progress calculation where applicable
- [ ] XP earning through progress updates
- [ ] Progress streaks and consistency tracking
- [ ] Progress notes and context

### User Interface Components
- [ ] Progress entry form (quick and detailed)
- [ ] Progress charts (line, bar, circular)
- [ ] Progress timeline component
- [ ] Mobile-optimized progress entry
- [ ] Batch progress entry for multiple goals
- [ ] Progress statistics dashboard

### Gamification Integration
- [ ] XP calculation based on progress amount
- [ ] Streak bonuses for consistent progress
- [ ] Achievement triggers for milestones
- [ ] Progress-based level advancement
- [ ] Visual feedback for XP gains

### Data Analytics
- [ ] Progress trends and insights
- [ ] Goal completion predictions
- [ ] Performance comparisons across time periods
- [ ] Module-specific progress analytics
- [ ] Export progress data

## User Stories

### US-102.1: Quick Progress Entry
```
As a user
I want to quickly record progress on my goals
So that I can maintain momentum without disrupting my workflow
```

**Acceptance Criteria:**
- One-tap progress entry for common increments (25%, 50%, 75%, 100%)
- Quick numeric input for specific values
- Optional notes field for context
- Immediate XP feedback upon entry
- Works seamlessly on mobile devices
- Progress is saved automatically

### US-102.2: Progress Visualization
```
As a user
I want to see visual representations of my progress
So that I can understand my trends and stay motivated
```

**Acceptance Criteria:**
- Line charts showing progress over time
- Circular progress indicators for current status
- Bar charts comparing multiple goals
- Color-coded progress states (behind, on track, ahead)
- Interactive charts with drill-down capabilities
- Responsive design across all devices

### US-102.3: Progress History and Analysis
```
As a user
I want to review my progress history and patterns
So that I can learn from my experience and optimize my approach
```

**Acceptance Criteria:**
- Complete progress timeline with entry details
- Progress velocity calculations (progress per day/week)
- Identification of productive periods vs stagnant periods
- Correlation analysis between different goals
- Progress insights and recommendations
- Historical data export capabilities

## Technical Implementation

### Progress Entry API

#### Progress Creation Endpoint
```typescript
// src/app/api/v1/progress/route.ts
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(progressCreateSchema)(body);
    
    // Create progress entry
    const progress = await progressRepository.create({
      ...validatedData,
      userId,
      recordedAt: validatedData.recordedAt || new Date(),
    });
    
    // Calculate XP earned
    const xpEarned = calculateProgressXP(
      validatedData.value,
      validatedData.goalId,
      userId
    );
    
    // Update user XP and check for achievements
    await gamificationService.addXP(userId, xpEarned);
    await achievementService.checkProgressAchievements(userId, progress);
    
    // Update goal completion status if applicable
    if (progress.value >= progress.maxValue) {
      await goalRepository.markCompleted(validatedData.goalId);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        progress,
        xpEarned,
        newAchievements: await getNewAchievements(userId),
      },
    }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Progress Repository Implementation

```typescript
// src/lib/repositories/progress-repository.ts
import { BaseRepository } from '../prisma/base-repository';
import { Progress, Prisma } from '@prisma/client';

export class ProgressRepository extends BaseRepository<Progress> {
  model = prisma.progress;

  async findByGoalId(goalId: string, limit = 10) {
    return await this.model.findMany({
      where: { goalId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async getProgressStats(goalId: string) {
    const progress = await this.model.findMany({
      where: { goalId },
      orderBy: { recordedAt: 'asc' },
    });

    if (progress.length === 0) {
      return {
        totalEntries: 0,
        currentValue: 0,
        maxValue: 100,
        progressPercentage: 0,
        averageDaily: 0,
        streak: 0,
      };
    }

    const latest = progress[progress.length - 1];
    const oldest = progress[0];
    const daysDiff = Math.max(1, 
      Math.ceil(
        (latest.recordedAt.getTime() - oldest.recordedAt.getTime()) / 
        (1000 * 60 * 60 * 24)
      )
    );

    return {
      totalEntries: progress.length,
      currentValue: latest.value,
      maxValue: latest.maxValue,
      progressPercentage: (latest.value / latest.maxValue) * 100,
      averageDaily: (latest.value - oldest.value) / daysDiff,
      streak: this.calculateStreak(progress),
      velocity: this.calculateVelocity(progress),
    };
  }

  async getProgressTrend(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.model.findMany({
      where: {
        userId,
        recordedAt: { gte: startDate },
      },
      orderBy: { recordedAt: 'asc' },
      include: {
        goal: { select: { id: true, title: true, moduleId: true } },
      },
    });
  }

  private calculateStreak(progress: Progress[]): number {
    if (progress.length === 0) return 0;

    const sortedProgress = progress.sort(
      (a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of sortedProgress) {
      const entryDate = new Date(entry.recordedAt);
      entryDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff === streak + 1) {
        streak++;
      } else {
        break;
      }

      currentDate = entryDate;
    }

    return streak;
  }

  private calculateVelocity(progress: Progress[]): number {
    if (progress.length < 2) return 0;

    const recent = progress.slice(-7); // Last 7 entries
    if (recent.length < 2) return 0;

    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    const timeDiff = newest.recordedAt.getTime() - oldest.recordedAt.getTime();
    const valueDiff = newest.value - oldest.value;

    return valueDiff / (timeDiff / (1000 * 60 * 60 * 24)); // Progress per day
  }
}

export const progressRepository = new ProgressRepository();
```

### Progress Components

#### Progress Entry Form
```typescript
// src/components/progress/ProgressEntryForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Goal } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/base/ProgressIndicator';
import { useProgress } from '@/hooks/useProgress';
import { progressCreateSchema } from '@/lib/validation/schemas';

type ProgressFormData = z.infer<typeof progressCreateSchema>;

interface ProgressEntryFormProps {
  goal: Goal;
  onSuccess?: (progress: any) => void;
  quickEntry?: boolean;
}

export function ProgressEntryForm({ 
  goal, 
  onSuccess, 
  quickEntry = false 
}: ProgressEntryFormProps) {
  const [showDetails, setShowDetails] = useState(!quickEntry);
  const { addProgress, loading } = useProgress(goal.id);

  const form = useForm<ProgressFormData>({
    resolver: zodResolver(progressCreateSchema),
    defaultValues: {
      goalId: goal.id,
      value: 0,
      maxValue: 100,
      notes: '',
    },
  });

  const currentValue = form.watch('value');
  const maxValue = form.watch('maxValue');
  const percentage = (currentValue / maxValue) * 100;

  const handleSubmit = async (data: ProgressFormData) => {
    try {
      const result = await addProgress(data);
      onSuccess?.(result);
      form.reset();
      
      // Show XP earned notification
      if (result.xpEarned > 0) {
        showXPNotification(result.xpEarned);
      }
    } catch (error) {
      console.error('Failed to add progress:', error);
    }
  };

  const handleQuickProgress = (value: number) => {
    form.setValue('value', value);
    form.handleSubmit(handleSubmit)();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{goal.title}</CardTitle>
        <ProgressIndicator 
          value={percentage} 
          className="mt-2"
          showLabel
          label={`${currentValue}/${maxValue}`}
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {quickEntry && !showDetails && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Quick progress update:</p>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickProgress(value)}
                  disabled={loading}
                  className="text-xs"
                >
                  {value}%
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="w-full text-sm"
            >
              Detailed Entry
            </Button>
          </div>
        )}

        {(showDetails || !quickEntry) && (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium min-w-0">Progress:</label>
                <div className="flex-1">
                  <Slider
                    value={[currentValue]}
                    onValueChange={([value]) => form.setValue('value', value)}
                    max={maxValue}
                    step={1}
                    className="flex-1"
                  />
                </div>
                <Input
                  type="number"
                  value={currentValue}
                  onChange={(e) => form.setValue('value', parseInt(e.target.value) || 0)}
                  className="w-20 text-sm"
                  max={maxValue}
                  min={0}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium min-w-0">Max Value:</label>
                <Input
                  type="number"
                  {...form.register('maxValue', { valueAsNumber: true })}
                  className="w-24 text-sm"
                  min={1}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                {...form.register('notes')}
                placeholder="Add any notes about this progress update..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Adding...' : 'Add Progress'}
              </Button>
              {quickEntry && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Quick Mode
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Progress Chart Component
```typescript
// src/components/progress/ProgressChart.tsx
'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Progress } from '@prisma/client';
import { format } from 'date-fns';

interface ProgressChartProps {
  progress: Progress[];
  goal: Goal;
  height?: number;
  type?: 'line' | 'area';
}

export function ProgressChart({ 
  progress, 
  goal, 
  height = 300, 
  type = 'line' 
}: ProgressChartProps) {
  const chartData = useMemo(() => {
    return progress
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((entry) => ({
        date: format(new Date(entry.recordedAt), 'MMM d'),
        value: entry.value,
        percentage: (entry.value / entry.maxValue) * 100,
        notes: entry.notes,
      }));
  }, [progress]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            Progress: {data.value} ({data.percentage.toFixed(1)}%)
          </p>
          {data.notes && (
            <p className="text-sm text-muted-foreground mt-1">{data.notes}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded-lg"
        style={{ height }}
      >
        <p className="text-muted-foreground">No progress data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'area' ? (
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs fill-muted-foreground"
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      ) : (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs fill-muted-foreground"
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
```

## Mobile Optimizations

### Touch-Friendly Progress Entry
- Large slider controls for easy manipulation
- Quick-tap buttons for common progress values
- Swipe gestures for rapid entry
- Haptic feedback on progress milestones

### Performance Considerations
- Virtualized progress history lists
- Optimistic UI updates for immediate feedback
- Cached chart data for smooth interactions
- Lazy loading of historical data

## Gamification Integration

### XP Calculation
```typescript
// src/lib/gamification/progress-xp.ts
export function calculateProgressXP(
  progressValue: number,
  goalDifficulty: string,
  streakMultiplier: number = 1
): number {
  const baseXP = Math.floor(progressValue / 10); // 1 XP per 10% progress
  
  const difficultyMultipliers = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 3,
  };
  
  const difficultyXP = baseXP * (difficultyMultipliers[goalDifficulty] || 1);
  const streakXP = difficultyXP * streakMultiplier;
  
  return Math.max(1, Math.floor(streakXP));
}
```

### Achievement Triggers
- First progress entry: "Getting Started"
- 7-day streak: "Consistent Progress"
- 50% completion: "Halfway Hero"
- Goal completion: "Achievement Unlocked"
- Perfect week: "Flawless Execution"

## Testing Strategy

### Unit Tests
- Progress calculation accuracy
- XP earning calculations
- Streak calculation logic
- Chart data transformations
- Form validation

### Integration Tests
- Complete progress entry workflow
- Gamification system integration
- Chart rendering with various data sets
- Mobile gesture interactions
- Performance with large datasets

### Performance Tests
- Chart rendering with 1000+ data points
- Progress entry response time
- Mobile scroll performance
- Memory usage with historical data

## Success Metrics

### Functional Metrics
- Progress entry success rate > 99%
- Chart rendering time < 1 second
- XP calculation accuracy 100%
- Mobile interaction response time < 200ms

### User Engagement Metrics
- Daily progress entries > 80% of active users
- Progress streak length average > 5 days
- User satisfaction with progress tracking > 4.5/5
- Time spent in progress view > 2 minutes per session

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Core Functionality