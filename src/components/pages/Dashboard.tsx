"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BaseTable } from '@/components/base/BaseTable';
import { DataCard } from '@/components/base/DataCard';
import { StatusBadge } from '@/components/base/StatusBadge';
import { QuickAddButton } from '@/components/base/QuickAddButton';
import { formatRelativeTime } from '@/lib/date-utils';
import {
  Target,
  TrendingUp,
  Calendar,
  Award,
  Flame,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Dumbbell,
  BookOpen,
  Wrench,
  Heart,
  Briefcase,
  BarChart3,
  Star,
  Zap
} from 'lucide-react';

// Mock data
const mockGoals = [
  {
    id: 1,
    title: "Complete 30-minute workout",
    module: "fitness",
    status: "in_progress" as const,
    progress: 75,
    dueDate: "2024-01-15",
    priority: "high" as const,
    streak: 5
  },
  {
    id: 2,
    title: "Read 20 pages of JavaScript guide",
    module: "learning",
    status: "completed" as const,
    progress: 100,
    dueDate: "2024-01-14",
    priority: "medium" as const,
    streak: 3
  },
  {
    id: 3,
    title: "Fix kitchen faucet leak",
    module: "home",
    status: "pending" as const,
    progress: 0,
    dueDate: "2024-01-16",
    priority: "high" as const,
    streak: 0
  },
  {
    id: 4,
    title: "Bible study - Genesis 1-3",
    module: "bible",
    status: "in_progress" as const,
    progress: 60,
    dueDate: "2024-01-15",
    priority: "medium" as const,
    streak: 12
  }
];

const moduleConfig = {
  fitness: { icon: Dumbbell, label: 'Fitness', color: 'text-orange-600', bg: 'bg-orange-50' },
  learning: { icon: BookOpen, label: 'Learning', color: 'text-blue-600', bg: 'bg-blue-50' },
  home: { icon: Wrench, label: 'Home', color: 'text-green-600', bg: 'bg-green-50' },
  bible: { icon: Heart, label: 'Bible', color: 'text-purple-600', bg: 'bg-purple-50' },
  work: { icon: Briefcase, label: 'Work', color: 'text-indigo-600', bg: 'bg-indigo-50' }
} as const;

const recentAchievements = [
  {
    id: 1,
    title: "Fitness Enthusiast",
    description: "Completed 7-day workout streak",
    icon: Flame,
    tier: "gold" as const,
    xp: 50,
    unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
  },
  {
    id: 2,
    title: "Knowledge Seeker",
    description: "Read 5 learning modules",
    icon: Star,
    tier: "silver" as const,
    xp: 30,
    unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
  }
];

/**
 * Dashboard page with responsive layout and ADHD-friendly design
 * Features:
 * - Quick overview cards with key metrics
 * - Module-specific widgets
 * - Recent goals and progress tracking
 * - Achievement highlights
 * - Quick action buttons
 * - Responsive grid layout
 */
export function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<'today' | 'week' | 'month'>('today');

  // Calculate dashboard metrics
  const todayGoals = mockGoals.filter(goal => 
    new Date(goal.dueDate).toDateString() === new Date().toDateString()
  );
  const completedToday = todayGoals.filter(goal => goal.status === 'completed').length;
  const activeStreak = Math.max(...mockGoals.map(goal => goal.streak));
  const weeklyXp = 247; // Mock XP earned this week

  const tableColumns = [
    {
      id: 'title',
      header: 'Goal',
      accessorKey: 'title',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded ${moduleConfig[row.original.module as keyof typeof moduleConfig]?.bg}`}>
            {React.createElement(moduleConfig[row.original.module as keyof typeof moduleConfig]?.icon, {
              className: `w-4 h-4 ${moduleConfig[row.original.module as keyof typeof moduleConfig]?.color}`
            })}
          </div>
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {moduleConfig[row.original.module as keyof typeof moduleConfig]?.label}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => (
        <StatusBadge status={row.original.status} />
      )
    },
    {
      id: 'progress',
      header: 'Progress',
      accessorKey: 'progress',
      cell: ({ row }: any) => (
        <div className="w-20">
          <Progress value={row.original.progress} className="h-2" />
          <span className="text-xs text-muted-foreground mt-1">
            {row.original.progress}%
          </span>
        </div>
      )
    },
    {
      id: 'streak',
      header: 'Streak',
      accessorKey: 'streak',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-1">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">{row.original.streak}</span>
        </div>
      )
    },
    {
      id: 'due',
      header: 'Due',
      accessorKey: 'dueDate',
      cell: ({ row }: any) => (
        <div className="text-sm">
          {new Date(row.original.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </div>
      )
    }
  ];

  return (
    <MainContent
      currentPage="dashboard"
      pageTitle="Dashboard"
      pageSubtitle={`Welcome back! You have ${todayGoals.length} goals for today.`}
      pageActions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <QuickAddButton />
        </div>
      }
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <DataCard
          title="Today's Goals"
          value={`${completedToday}/${todayGoals.length}`}
          description="Completed today"
          icon={Target}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        
        <DataCard
          title="Active Streak"
          value={activeStreak.toString()}
          description="Days in a row"
          icon={Flame}
          trend={{ value: 2, isPositive: true }}
          color="orange"
        />
        
        <DataCard
          title="Weekly XP"
          value={weeklyXp.toString()}
          description="Experience points"
          icon={Zap}
          trend={{ value: 18, isPositive: true }}
          color="yellow"
        />
        
        <DataCard
          title="Level Progress"
          value="65%"
          description="To next level"
          icon={Star}
          trend={{ value: 8, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Jump into your most common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(moduleConfig).map(([moduleId, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={moduleId}
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:bg-muted/50"
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{config.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Goals</CardTitle>
              <CardDescription>
                Your active and recently completed goals
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BaseTable
            data={mockGoals}
            columns={tableColumns}
            pageSize={5}
            showSearch={false}
            showPagination={false}
            className="border-0"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Recent Achievements
            </CardTitle>
            <CardDescription>
              Your latest unlocked achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAchievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div key={achievement.id} className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full bg-gradient-to-r ${
                    achievement.tier === 'gold' ? 'from-yellow-400 to-yellow-600' :
                    achievement.tier === 'silver' ? 'from-gray-300 to-gray-500' :
                    'from-amber-600 to-amber-800'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        +{achievement.xp} XP
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(achievement.unlockedAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" className="w-full">
              View All Achievements
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Weekly Overview
            </CardTitle>
            <CardDescription>
              Your progress this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Goals Completed</span>
                <span className="text-2xl font-bold">12/15</span>
              </div>
              <Progress value={80} className="h-3" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Completed: 12</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>In Progress: 2</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span>Overdue: 1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  <span>Pending: 0</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Dumbbell className="w-5 h-5 mr-2 text-orange-600" />
              Fitness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Today's Workout</span>
              <Badge variant="secondary">75% done</Badge>
            </div>
            <Progress value={75} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">5 day streak</span>
              <Button variant="ghost" size="sm">
                Continue
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">JavaScript Basics</span>
              <Badge variant="secondary">Chapter 3</Badge>
            </div>
            <Progress value={45} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">3 day streak</span>
              <Button variant="ghost" size="sm">
                Continue
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Heart className="w-5 h-5 mr-2 text-purple-600" />
              Bible Study
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Genesis Reading</span>
              <Badge variant="secondary">60% done</Badge>
            </div>
            <Progress value={60} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">12 day streak</span>
              <Button variant="ghost" size="sm">
                Continue
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainContent>
  );
}

export default Dashboard;