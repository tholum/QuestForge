"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { BaseTable } from '@/components/base/BaseTable';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { GoalCard, GoalForm, GoalDetail } from '@/components/goals';
import { useGoals } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/base/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
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
  Briefcase,
  Search,
  X,
  MoreVertical
} from 'lucide-react';

/**
 * Module configuration
 */
const moduleConfig = {
  fitness: { icon: Dumbbell, label: 'Fitness', color: 'text-orange-600', bg: 'bg-orange-50' },
  learning: { icon: BookOpen, label: 'Learning', color: 'text-blue-600', bg: 'bg-blue-50' },
  home: { icon: Wrench, label: 'Home', color: 'text-green-600', bg: 'bg-green-50' },
  bible: { icon: Heart, label: 'Bible', color: 'text-purple-600', bg: 'bg-purple-50' },
  work: { icon: Briefcase, label: 'Work', color: 'text-indigo-600', bg: 'bg-indigo-50' }
} as const;

/**
 * Filter options
 */
const FILTER_OPTIONS = [
  { value: 'all', label: 'All Goals' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' }
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' }
];

const MODULE_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'learning', label: 'Learning' },
  { value: 'home', label: 'Home Projects' },
  { value: 'bible', label: 'Bible Study' },
  { value: 'work', label: 'Work' }
];

/**
 * Goals page with responsive layout and real API integration
 */
export function GoalsPage() {
  // State management
  const [isMobile, setIsMobile] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedModule, setSelectedModule] = React.useState('');
  const [selectedPriority, setSelectedPriority] = React.useState('');
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = React.useState(1);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDetailDialog, setShowDetailDialog] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState(null);

  // Responsive detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // API hook with filters
  const {
    goals,
    loading,
    error,
    pagination,
    isCreating,
    isUpdating,
    isDeleting,
    createGoal,
    updateGoal,
    deleteGoal,
    refetch
  } = useGoals({
    page: currentPage,
    limit: 20,
    filter: selectedTab === 'all' ? undefined : selectedTab,
    search: searchQuery || undefined,
    moduleId: selectedModule || undefined,
    priority: selectedPriority || undefined,
    sort: sortBy,
    order: sortOrder,
  });

  // Handle goal actions
  const handleCreateGoal = async (data: any) => {
    try {
      await createGoal(data);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleEditGoal = async (data: any) => {
    if (!selectedGoal) return;
    try {
      await updateGoal((selectedGoal as any).id, data);
      setShowEditDialog(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      await updateGoal(goalId, { isCompleted: true });
    } catch (error) {
      console.error('Failed to complete goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await deleteGoal(goalId);
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleViewGoal = (goal: any) => {
    setSelectedGoal(goal);
    setShowDetailDialog(true);
  };

  const handleEditClick = (goal: any) => {
    setSelectedGoal(goal);
    setShowEditDialog(true);
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
  };

  // Desktop table columns
  const tableColumns = [
    {
      id: 'title',
      header: 'Goal',
      accessorKey: 'title',
      cell: ({ row }: any) => {
        const goal = row.original;
        const moduleInfo = moduleConfig[goal.moduleId as keyof typeof moduleConfig];
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
      accessorKey: 'isCompleted',
      cell: ({ row }: any) => {
        const goal = row.original;
        const isCompleted = goal.isCompleted;
        const isOverdue = goal.targetDate && new Date(goal.targetDate) < new Date() && !isCompleted;
        
        if (isCompleted) return <StatusBadge status="completed" />;
        if (isOverdue) return <StatusBadge status="overdue" />;
        return <StatusBadge status="in_progress" />;
      }
    },
    {
      id: 'progress',
      header: 'Progress',
      cell: ({ row }: any) => {
        const goal = row.original;
        const progress = goal.progress?.[0] || { value: 0, maxValue: 100 };
        const percentage = Math.min(100, Math.max(0, (progress.value / progress.maxValue) * 100));
        
        return (
          <div className="w-20">
            <Progress value={percentage} className="h-2" />
            <span className="text-xs text-muted-foreground mt-1">
              {Math.round(percentage)}%
            </span>
          </div>
        );
      }
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
          high: 'bg-red-100 text-red-800',
          urgent: 'bg-red-200 text-red-900'
        };
        return (
          <Badge className={colors[priority as keyof typeof colors]}>
            {priority}
          </Badge>
        );
      }
    },
    {
      id: 'due',
      header: 'Due Date',
      accessorKey: 'targetDate',
      cell: ({ row }: any) => {
        const targetDate = row.original.targetDate;
        if (!targetDate) return <span className="text-muted-foreground">-</span>;
        
        const dueDate = new Date(targetDate);
        const isOverdue = dueDate < new Date() && !row.original.isCompleted;
        
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
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => {
        const goal = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewGoal(goal);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        );
      }
    }
  ];

  // Calculate stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.isCompleted).length;
  const inProgressGoals = goals.filter(g => !g.isCompleted).length;
  const overdueGoals = goals.filter(g => 
    g.targetDate && new Date(g.targetDate) < new Date() && !g.isCompleted
  ).length;

  return (
    <MainContent
      currentPage="goals"
      pageTitle="Goals"
      pageSubtitle={loading ? "Loading..." : `${pagination.total} goals found`}
      pageActions={
        <Button onClick={() => setShowCreateDialog(true)} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      }
    >
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load goals: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Goals</p>
                <p className="text-2xl font-bold">{totalGoals}</p>
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
                <p className="text-2xl font-bold">{completedGoals}</p>
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
                <p className="text-2xl font-bold">{inProgressGoals}</p>
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
                <p className="text-2xl font-bold">{overdueGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                  <SelectItem value="targetDate-asc">Due Date (Soon)</SelectItem>
                  <SelectItem value="targetDate-desc">Due Date (Late)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Goals Content */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={selectedTab} onValueChange={setSelectedTab as any} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Done</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="large" />
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No goals found</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first goal
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Goal
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  {!isMobile ? (
                    <BaseTable
                      data={goals}
                      columns={tableColumns}
                      pageSize={20}
                      enableSelection
                      enableSorting
                      enableFiltering
                      className="border-0"
                      onRowClick={(goal) => handleViewGoal(goal)}
                    />
                  ) : (
                    /* Mobile View */
                    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
                      <div className="space-y-0 p-4 -mx-4">
                        {goals.map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onComplete={handleCompleteGoal}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteGoal}
                            onView={handleViewGoal}
                            enableSwipeActions
                          />
                        ))}
                      </div>
                    </PullToRefresh>
                  )}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} goals
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!pagination.hasPreviousPage || loading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!pagination.hasNextPage || loading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
          </DialogHeader>
          <GoalForm
            mode="create"
            onSubmit={handleCreateGoal}
            onCancel={() => setShowCreateDialog(false)}
            enableDraftRecovery
          />
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <GoalForm
              mode="edit"
              initialData={selectedGoal}
              onSubmit={handleEditGoal}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedGoal(null);
              }}
              enableDraftRecovery
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Goal Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Goal Details</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <GoalDetail
              goal={selectedGoal}
              onEdit={handleEditClick}
              onDelete={handleDeleteGoal}
              onComplete={handleCompleteGoal}
              onBack={() => setShowDetailDialog(false)}
              showBackButton={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainContent>
  );
}

export default GoalsPage;