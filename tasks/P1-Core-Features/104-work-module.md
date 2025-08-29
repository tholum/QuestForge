# P1-104: Work Projects Module

## Task Overview

**Priority**: P1 (Core Feature)  
**Status**: Not Started  
**Effort**: 5 Story Points  
**Sprint**: Core Module Features  

## Description

Implement a comprehensive work projects module that allows users to manage professional goals, track project progress, monitor career development, and integrate work-life balance objectives. This module provides specialized features for workplace productivity and career advancement tracking.

## Dependencies

- ✅ P1-101: Goal Management CRUD (core goal functionality)
- ❌ P0-001: Authentication System (for user-specific data)
- ✅ P0-002: Database Integration (schema exists)
- ❌ P2-201: Gamification Integration (XP and achievements)
- ❌ P2-203: Calendar View (for project scheduling)

## Definition of Done

### Core Work Management Features
- [ ] Project creation and lifecycle management
- [ ] Task breakdown and assignment tracking
- [ ] Milestone and deadline management
- [ ] Time tracking and productivity metrics
- [ ] Career development goal integration
- [ ] Team collaboration features (if applicable)

### User Interface Components
- [ ] Work dashboard with project overview
- [ ] Project management interface (Kanban/List views)
- [ ] Time tracking component with start/stop functionality
- [ ] Career goals progression tracker
- [ ] Performance metrics visualization
- [ ] Mobile-optimized project management

### Professional Development Features
- [ ] Skills assessment and tracking
- [ ] Learning goal integration
- [ ] Performance review preparation
- [ ] Professional networking goal tracking
- [ ] Certification and achievement tracking

## User Stories

### US-104.1: Project Management
```
As a working professional
I want to create and manage work projects with tasks and milestones
So that I can track progress and meet deadlines effectively
```

**Acceptance Criteria:**
- User can create projects with detailed descriptions and timelines
- Projects can be broken down into tasks and subtasks
- Milestone tracking with progress visualization
- Deadline alerts and notifications
- Project status management (active, on-hold, completed)
- Integration with overall productivity goals

### US-104.2: Time Tracking
```
As a productivity-focused professional
I want to track time spent on different projects and tasks
So that I can analyze my work patterns and improve efficiency
```

**Acceptance Criteria:**
- Simple start/stop time tracking interface
- Time allocation across multiple projects
- Daily/weekly time summaries and reporting
- Productivity insights and trends
- Integration with billing or performance metrics
- Mobile time tracking with quick start options

### US-104.3: Career Development Tracking
```
As someone focused on career growth
I want to set and track professional development goals
So that I can advance my career systematically
```

**Acceptance Criteria:**
- Career goal creation with specific milestones
- Skills assessment and improvement tracking
- Learning opportunity integration
- Performance review preparation tools
- Professional achievement recording
- Long-term career path visualization

### US-104.4: Performance Analytics
```
As a data-driven professional
I want to see analytics about my work performance and productivity
So that I can identify areas for improvement and celebrate successes
```

**Acceptance Criteria:**
- Productivity metrics dashboard
- Project completion rate tracking
- Time utilization analysis
- Goal achievement statistics
- Performance trend visualization
- Export capabilities for reviews

## Technical Implementation

### Database Schema Extensions
```sql
-- Work projects
CREATE TABLE WorkProject (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT, -- Link to related goal
  name TEXT NOT NULL,
  description TEXT,
  projectType TEXT NOT NULL, -- 'client', 'internal', 'personal', 'team'
  status TEXT DEFAULT 'active', -- 'planning', 'active', 'on-hold', 'completed', 'cancelled'
  priority TEXT DEFAULT 'medium',
  startDate DATE,
  endDate DATE,
  estimatedHours INTEGER,
  actualHours INTEGER DEFAULT 0,
  budget DECIMAL(10,2),
  clientName TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (goalId) REFERENCES Goal(id)
);

-- Project tasks
CREATE TABLE ProjectTask (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  parentTaskId TEXT, -- For subtasks
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in-progress', 'review', 'completed'
  priority TEXT DEFAULT 'medium',
  estimatedHours DECIMAL(4,2),
  actualHours DECIMAL(4,2) DEFAULT 0,
  assignedTo TEXT, -- For team projects
  dueDate DATE,
  completedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES WorkProject(id),
  FOREIGN KEY (parentTaskId) REFERENCES ProjectTask(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Time tracking entries
CREATE TABLE TimeEntry (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  projectId TEXT NOT NULL,
  taskId TEXT,
  description TEXT,
  startTime DATETIME NOT NULL,
  endTime DATETIME,
  durationMinutes INTEGER,
  hourlyRate DECIMAL(8,2),
  isBillable BOOLEAN DEFAULT false,
  entryDate DATE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (projectId) REFERENCES WorkProject(id),
  FOREIGN KEY (taskId) REFERENCES ProjectTask(id)
);

-- Career development goals
CREATE TABLE CareerGoal (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT, -- Link to main goal
  category TEXT NOT NULL, -- 'skill', 'promotion', 'certification', 'networking', 'learning'
  title TEXT NOT NULL,
  description TEXT,
  currentLevel TEXT, -- For skills: 'beginner', 'intermediate', 'advanced', 'expert'
  targetLevel TEXT,
  targetDate DATE,
  isCompleted BOOLEAN DEFAULT false,
  completedAt DATETIME,
  evidence TEXT, -- JSON array of achievement evidence
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (goalId) REFERENCES Goal(id)
);

-- Performance metrics
CREATE TABLE PerformanceMetric (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  metricType TEXT NOT NULL, -- 'productivity', 'efficiency', 'quality', 'satisfaction'
  metricName TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  targetValue DECIMAL(10,2),
  unit TEXT, -- 'hours', 'tasks', 'projects', 'percentage', etc.
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  recordDate DATE NOT NULL,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Project milestones
CREATE TABLE ProjectMilestone (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dueDate DATE NOT NULL,
  completedAt DATETIME,
  isCompleted BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES WorkProject(id)
);
```

### API Endpoints

#### Work Module Routes
```typescript
// src/app/api/v1/modules/work/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = await getCurrentUserId(request);
  const type = searchParams.get('type'); // 'projects', 'tasks', 'time', 'career', 'analytics'
  
  try {
    switch (type) {
      case 'projects':
        const projects = await workRepository.getUserProjects(userId, {
          status: searchParams.get('status'),
          page: parseInt(searchParams.get('page') || '1'),
          limit: parseInt(searchParams.get('limit') || '20'),
        });
        return NextResponse.json({ success: true, data: projects });
      
      case 'tasks':
        const projectId = searchParams.get('projectId');
        const tasks = await workRepository.getProjectTasks(projectId, userId);
        return NextResponse.json({ success: true, data: tasks });
      
      case 'time':
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const timeEntries = await workRepository.getTimeEntries(userId, date);
        return NextResponse.json({ success: true, data: timeEntries });
      
      case 'career':
        const careerGoals = await workRepository.getCareerGoals(userId);
        return NextResponse.json({ success: true, data: careerGoals });
      
      case 'analytics':
        const period = searchParams.get('period') || 'week';
        const analytics = await workRepository.getAnalytics(userId, period);
        return NextResponse.json({ success: true, data: analytics });
      
      default:
        const dashboard = await workRepository.getDashboardData(userId);
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
      case 'project':
        const project = await workRepository.createProject(userId, data);
        
        // Create associated goal if specified
        if (data.createGoal) {
          const goal = await goalRepository.create({
            userId,
            title: `Complete ${project.name}`,
            description: `Work project: ${project.description}`,
            moduleId: 'work',
            targetDate: project.endDate,
            difficulty: 'medium',
            priority: project.priority,
          });
          
          await workRepository.updateProject(project.id, { goalId: goal.id });
        }
        
        return NextResponse.json({ success: true, data: project }, { status: 201 });
      
      case 'task':
        const task = await workRepository.createTask(userId, data);
        return NextResponse.json({ success: true, data: task }, { status: 201 });
      
      case 'time-entry':
        const timeEntry = await workRepository.createTimeEntry(userId, data);
        
        // Update project actual hours
        await workRepository.updateProjectHours(data.projectId);
        
        return NextResponse.json({ success: true, data: timeEntry }, { status: 201 });
      
      case 'career-goal':
        const careerGoal = await workRepository.createCareerGoal(userId, data);
        return NextResponse.json({ success: true, data: careerGoal }, { status: 201 });
      
      case 'performance-metric':
        const metric = await workRepository.recordPerformanceMetric(userId, data);
        return NextResponse.json({ success: true, data: metric }, { status: 201 });
      
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

#### Work Dashboard
```typescript
// src/modules/work/WorkDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  PlayCircle,
  PauseCircle 
} from 'lucide-react';
import { useWorkModule } from '@/hooks/useWorkModule';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
import { formatDuration, formatCurrency } from '@/lib/utils';

export function WorkDashboard() {
  const { dashboardData, loading, error, startTimer, stopTimer, activeTimer } = useWorkModule();

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error loading work data</div>;

  const {
    activeProjects,
    todayTasks,
    weekTimeTracked,
    monthlyProgress,
    upcomingDeadlines,
    careerGoals,
    performanceMetrics,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Active Timer Card */}
      {activeTimer && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{activeTimer.projectName}</h3>
                <p className="text-sm text-muted-foreground">{activeTimer.taskName}</p>
                <p className="text-lg font-mono text-green-600">
                  {formatDuration(activeTimer.elapsedMinutes)}
                </p>
              </div>
              <Button
                onClick={() => stopTimer(activeTimer.id)}
                size="lg"
                variant="outline"
                className="border-green-200 hover:bg-green-100"
              >
                <PauseCircle className="h-5 w-5 mr-2" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {activeProjects.length}
              </span>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeProjects.filter(p => p.isOverdue).length} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress 
                value={(todayTasks.completed / todayTasks.total) * 100} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {todayTasks.completed} of {todayTasks.total} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-600">
                {formatDuration(weekTimeTracked)}
              </span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">time tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={monthlyProgress.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {monthlyProgress.completed} of {monthlyProgress.target} goals
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeProjects.length > 0 ? (
              <div className="space-y-4">
                {activeProjects.slice(0, 5).map((project) => (
                  <div key={project.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge variant={project.isOverdue ? 'destructive' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <Progress value={project.progress} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.completedTasks} / {project.totalTasks} tasks</span>
                      <span>{project.daysRemaining} days left</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => startTimer(project.id)}
                        className="flex-1"
                      >
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Start Timer
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Projects
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No active projects</p>
                <Button>Create New Project</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-sm">{deadline.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {deadline.projectName}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={deadline.isOverdue ? 'destructive' : 'secondary'}>
                        {deadline.daysUntilDue} days
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(deadline.dueDate), 'MMM d')}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  View All Deadlines
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Career Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Career Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            {careerGoals.length > 0 ? (
              <div className="space-y-3">
                {careerGoals.slice(0, 4).map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{goal.title}</h4>
                      <Badge>{goal.category}</Badge>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Target: {format(new Date(goal.targetDate), 'MMM yyyy')}
                    </p>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  View Career Plan
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">No career goals set</p>
                <Button size="sm">Set Career Goals</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.name} className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-sm">{metric.name}</h4>
                    <p className="text-xs text-muted-foreground">{metric.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">
                      {metric.value}
                      <span className="text-sm font-normal text-muted-foreground">
                        {metric.unit}
                      </span>
                    </span>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${
                        metric.trend === 'up' ? 'bg-green-500' : 
                        metric.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-xs text-muted-foreground">
                        {metric.changePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                View Full Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### Time Tracker Component
```typescript
// src/modules/work/components/TimeTracker.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PlayCircle, PauseCircle, Square, Clock } from 'lucide-react';
import { useWorkModule } from '@/hooks/useWorkModule';
import { formatDuration } from '@/lib/utils';

export function TimeTracker() {
  const {
    projects,
    activeTimer,
    todayTimeEntries,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    createTimeEntry,
  } = useWorkModule();

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time for active timer
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(activeTimer.startTime);
        setElapsedTime(Math.floor((now.getTime() - start.getTime()) / 1000 / 60));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeTimer]);

  const handleStartTimer = async () => {
    if (!selectedProject) return;

    await startTimer({
      projectId: selectedProject,
      taskId: selectedTask || undefined,
      description,
    });
  };

  const handleStopTimer = async () => {
    if (activeTimer) {
      await stopTimer(activeTimer.id);
      setDescription('');
    }
  };

  const totalTodayMinutes = todayTimeEntries.reduce(
    (total, entry) => total + entry.durationMinutes, 
    0
  );

  return (
    <div className="space-y-6">
      {/* Timer Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTimer ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="font-medium text-lg mb-2">
                  {projects.find(p => p.id === activeTimer.projectId)?.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTimer.description || 'Working on project'}
                </p>
                <div className="text-3xl font-mono text-green-600 mb-4">
                  {formatDuration(elapsedTime)}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={activeTimer.isPaused ? resumeTimer : pauseTimer}
                    variant="outline"
                    size="lg"
                  >
                    {activeTimer.isPaused ? (
                      <PlayCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <PauseCircle className="h-5 w-5 mr-2" />
                    )}
                    {activeTimer.isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    onClick={handleStopTimer}
                    size="lg"
                    variant="destructive"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project</label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                  >
                    <option value="">Select project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Task (optional)</label>
                  <Select
                    value={selectedTask}
                    onValueChange={setSelectedTask}
                    disabled={!selectedProject}
                  >
                    <option value="">Select task...</option>
                    {selectedProject && projects
                      .find(p => p.id === selectedProject)
                      ?.tasks?.map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Input
                  placeholder="What are you working on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button
                onClick={handleStartTimer}
                disabled={!selectedProject}
                size="lg"
                className="w-full"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Start Timer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Time Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Time Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Total Today</span>
              <span className="text-xl font-bold">
                {formatDuration(totalTodayMinutes)}
              </span>
            </div>
            
            {todayTimeEntries.length > 0 ? (
              <div className="space-y-2">
                {todayTimeEntries.map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <h4 className="font-medium text-sm">{entry.projectName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {entry.description || entry.taskName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">
                        {formatDuration(entry.durationMinutes)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.startTime), 'HH:mm')} - {format(new Date(entry.endTime), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No time entries today
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Mobile Optimizations

### Touch-Friendly Timer Controls
- Large start/stop buttons with clear visual feedback
- Swipe gestures for quick project switching
- Notification support for timer status
- Quick-start buttons for common projects

### Productivity Features
- Offline time tracking with sync
- Voice notes for time entry descriptions
- Quick entry templates for common tasks
- Widget support for timer controls

## Testing Strategy

### Unit Tests
- Time tracking accuracy and calculations
- Project management functionality
- Career goal progression logic
- Performance metrics calculations

### Integration Tests
- Complete project management workflows
- Time tracking with project integration
- Career development tracking
- Analytics and reporting features

### Mobile Testing
- Timer functionality on various devices
- Background timer operation
- Notification handling
- Offline functionality

## Success Metrics

### Functional Metrics
- 100% accurate time tracking
- < 1 second project load time
- 99.9% timer reliability
- Zero data loss for time entries

### User Experience Metrics
- Daily time tracking usage > 80%
- Project completion rate improvement > 25%
- Career goal achievement rate > 70%
- Mobile timer usage > 60%

### Professional Development Metrics
- Skill improvement tracking accuracy
- Performance metric correlation with goals
- Career advancement milestone completion
- Productivity trend analysis effectiveness

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Core Module Features