"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { BaseTable } from '@/components/base/BaseTable';
import { TouchFriendlyCard } from '@/components/mobile/TouchFriendlyCard';
import { SwipeActions, commonSwipeActions } from '@/components/mobile/SwipeActions';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/base/StatusBadge';
import {
  Target,
  Plus,
  Filter,
  SortAsc,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  BookOpen,
  Wrench,
  Heart,
  Briefcase
} from 'lucide-react';

// Mock data
const mockGoals = [
  {
    id: 1,
    title: "Complete 30-minute workout",
    description: "Daily cardio and strength training routine",
    module: "fitness",
    status: "in_progress" as const,
    progress: 75,
    dueDate: "2024-01-15",
    priority: "high" as const,
    streak: 5,
    createdAt: "2024-01-10",
    xp: 50,
    difficulty: "medium" as const
  },
  {
    id: 2,
    title: "Read 20 pages of JavaScript guide",
    description: "Continue learning modern JavaScript concepts",
    module: "learning",
    status: "completed" as const,
    progress: 100,
    dueDate: "2024-01-14",
    priority: "medium" as const,
    streak: 3,
    createdAt: "2024-01-12",
    xp: 30,
    difficulty: "easy" as const
  },
  {
    id: 3,
    title: "Fix kitchen faucet leak",
    description: "Replace worn gaskets and check water pressure",
    module: "home",
    status: "pending" as const,
    progress: 0,
    dueDate: "2024-01-16",
    priority: "high" as const,
    streak: 0,
    createdAt: "2024-01-13",
    xp: 75,
    difficulty: "hard" as const
  },
  {
    id: 4,
    title: "Bible study - Genesis 1-3",
    description: "Read and take notes on creation chapters",
    module: "bible",
    status: "in_progress" as const,
    progress: 60,
    dueDate: "2024-01-15",
    priority: "medium" as const,
    streak: 12,
    createdAt: "2024-01-08",
    xp: 40,
    difficulty: "easy" as const
  },
  {
    id: 5,
    title: "Complete project proposal",
    description: "Draft and submit quarterly project proposal",
    module: "work",
    status: "overdue" as const,
    progress: 25,
    dueDate: "2024-01-12",
    priority: "high" as const,
    streak: 0,
    createdAt: "2024-01-05",
    xp: 100,
    difficulty: "expert" as const
  }
];

const moduleConfig = {
  fitness: { icon: Dumbbell, label: 'Fitness', color: 'text-orange-600', bg: 'bg-orange-50' },
  learning: { icon: BookOpen, label: 'Learning', color: 'text-blue-600', bg: 'bg-blue-50' },
  home: { icon: Wrench, label: 'Home', color: 'text-green-600', bg: 'bg-green-50' },
  bible: { icon: Heart, label: 'Bible', color: 'text-purple-600', bg: 'bg-purple-50' },
  work: { icon: Briefcase, label: 'Work', color: 'text-indigo-600', bg: 'bg-indigo-50' }
} as const;

/**
 * Goals page with responsive layout and ADHD-friendly design
 * Features:
 * - Desktop: Advanced table with filtering and sorting
 * - Mobile: Card-based layout with swipe actions
 * - Pull-to-refresh on mobile
 * - Quick filters and tabs
 * - Bulk operations on desktop
 */
export function GoalsPage() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState('all');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Responsive detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter goals based on selected tab
  const filteredGoals = React.useMemo(() => {
    switch (selectedTab) {
      case 'active':
        return mockGoals.filter(goal => goal.status === 'in_progress' || goal.status === 'pending');
      case 'completed':
        return mockGoals.filter(goal => goal.status === 'completed');
      case 'overdue':
        return mockGoals.filter(goal => goal.status === 'overdue');
      default:
        return mockGoals;
    }
  }, [selectedTab]);

  // Desktop table columns
  const tableColumns = [
    {
      id: 'title',
      header: 'Goal',
      accessorKey: 'title',
      cell: ({ row }: any) => {
        const goal = row.original;
        const moduleInfo = moduleConfig[goal.module as keyof typeof moduleConfig];
        const Icon = moduleInfo?.icon;

        return (
          <div className="flex items-center space-x-3">
            <div className={`p-1.5 rounded ${moduleInfo?.bg}`}>
              <Icon className={`w-4 h-4 ${moduleInfo?.color}`} />
            </div>
            <div className="max-w-xs">
              <p className="font-medium truncate">{goal.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {goal.description}
              </p>
            </div>
          </div>
        );
      }
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />
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
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ row }: any) => {
        const priority = row.original.priority;
        const colors = {
          low: 'bg-gray-100 text-gray-800',
          medium: 'bg-yellow-100 text-yellow-800',
          high: 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={colors[priority as keyof typeof colors]}>
            {priority}
          </Badge>
        );
      }
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
      header: 'Due Date',
      accessorKey: 'dueDate',
      cell: ({ row }: any) => {
        const dueDate = new Date(row.original.dueDate);
        const isOverdue = dueDate < new Date() && row.original.status !== 'completed';
        
        return (
          <div className={`text-sm ${isOverdue ? 'text-red-600' : ''}`}>
            {dueDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        );
      }
    }
  ];

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  // Mobile card component
  const GoalCard = ({ goal }: { goal: typeof mockGoals[0] }) => {
    const moduleInfo = moduleConfig[goal.module as keyof typeof moduleConfig];
    const Icon = moduleInfo?.icon;
    const dueDate = new Date(goal.dueDate);
    const isOverdue = dueDate < new Date() && goal.status !== 'completed';

    const swipeActions = {
      left: goal.status === 'completed' ? [] : [
        {
          ...commonSwipeActions.complete,
          onAction: () => console.log(`Complete goal ${goal.id}`)
        }
      ],
      right: [
        {
          ...commonSwipeActions.edit,
          onAction: () => console.log(`Edit goal ${goal.id}`)
        },
        {
          ...commonSwipeActions.delete,
          onAction: () => console.log(`Delete goal ${goal.id}`)
        }
      ]
    };

    return (
      <TouchFriendlyCard
        swipeActions={swipeActions}
        onClick={() => console.log(`View goal ${goal.id}`)}
        className="mb-3"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className={`p-2 rounded-lg ${moduleInfo?.bg}`}>
                <Icon className={`w-5 h-5 ${moduleInfo?.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{goal.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {goal.description}
                </p>
              </div>
            </div>
            <StatusBadge status={goal.status} />
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className={isOverdue ? 'text-red-600' : ''}>
                  {dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {goal.streak > 0 && (
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{goal.streak}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{goal.xp} XP</Badge>
              <Badge 
                variant="outline"
                className={`
                  ${goal.priority === 'high' ? 'border-red-200 text-red-700' :
                    goal.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                    'border-gray-200 text-gray-700'}
                `}
              >
                {goal.priority}
              </Badge>
            </div>
          </div>
        </div>
      </TouchFriendlyCard>
    );
  };

  return (
    <MainContent
      currentPage="goals"
      pageTitle="Goals"
      pageSubtitle={`${filteredGoals.length} goals found`}
      pageActions={
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      }
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Goals</p>
                <p className="text-2xl font-bold">{mockGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">
                  {mockGoals.filter(g => g.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold">
                  {mockGoals.filter(g => g.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold">
                  {mockGoals.filter(g => g.status === 'overdue').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Content */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Done</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
              {!isMobile && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <SortAsc className="w-4 h-4 mr-2" />
                    Sort
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value={selectedTab} className="mt-4">
              {/* Desktop View */}
              {!isMobile ? (
                <BaseTable
                  data={filteredGoals}
                  columns={tableColumns}
                  pageSize={10}
                  enableSelection
                  enableSorting
                  enableFiltering
                  className="border-0"
                />
              ) : (
                /* Mobile View */
                <PullToRefresh onRefresh={handleRefresh} disabled={isRefreshing}>
                  <div className="space-y-0 p-4 -mx-4">
                    {filteredGoals.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No goals found</h3>
                        <p className="text-muted-foreground mb-4">
                          Get started by creating your first goal
                        </p>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Goal
                        </Button>
                      </div>
                    ) : (
                      filteredGoals.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} />
                      ))
                    )}
                  </div>
                </PullToRefresh>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </MainContent>
  );
}

export default GoalsPage;