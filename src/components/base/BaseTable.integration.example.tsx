/**
 * BaseTable Integration Example
 * 
 * This example demonstrates how to integrate BaseTable with:
 * - Prisma data from the Goal Assistant database
 * - Gamification features (XP, achievements, progress)
 * - Real-world goal management scenarios
 * - Server-side operations
 * - Mobile-responsive design
 */

import { useState, useEffect, useMemo } from 'react';
import { BaseTable } from './BaseTable';
import { StatusBadge } from './StatusBadge';
import { ProgressIndicator } from './ProgressIndicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Target,
  Calendar,
  User,
  Trophy,
  Star,
  Clock,
} from 'lucide-react';

import type { 
  ColumnDef, 
  RowAction, 
  BulkAction, 
  TableData 
} from '@/types/table';

import type { 
  Goal, 
  User as PrismaUser, 
  Progress as PrismaProgress,
  Achievement,
  UserAchievement 
} from '@prisma/client';

// =============================================================================
// Prisma Type Extensions for Table Data
// =============================================================================

interface GoalWithRelations extends Goal, TableData {
  user: PrismaUser;
  progress: PrismaProgress[];
  _count: {
    progress: number;
  };
}

interface UserWithRelations extends PrismaUser, TableData {
  goals: Goal[];
  userAchievements: (UserAchievement & {
    achievement: Achievement;
  })[];
  _count: {
    goals: number;
    userAchievements: number;
  };
}

// =============================================================================
// Goals Table Implementation
// =============================================================================

export function GoalsTable() {
  const [goals, setGoals] = useState<GoalWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [selectedGoals, setSelectedGoals] = useState<GoalWithRelations[]>([]);

  // Fetch goals from API
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      const response = await fetch('/api/v1/goals?include=user,progress,_count');
      if (!response.ok) throw new Error('Failed to fetch goals');
      
      const data = await response.json();
      setGoals(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Column definitions with Prisma data integration
  const columns = useMemo<ColumnDef<GoalWithRelations>[]>(() => [
    {
      id: 'title',
      header: 'Goal Title',
      accessor: 'title',
      sortable: true,
      filterable: true,
      width: 300,
      mobilePriority: 1,
      Cell: ({ row, value }) => (
        <div className="space-y-1">
          <div className="font-medium line-clamp-2">{value}</div>
          {row.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'isCompleted',
      dataType: 'custom',
      sortable: true,
      filterable: true,
      width: 120,
      mobilePriority: 2,
      align: 'center',
      Cell: ({ row }) => {
        const status = row.isCompleted 
          ? 'completed' 
          : new Date(row.targetDate || '') < new Date() 
            ? 'overdue' 
            : 'active';
        return <StatusBadge status={status} />;
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessor: 'priority',
      dataType: 'badge',
      sortable: true,
      filterable: true,
      width: 100,
      mobilePriority: 3,
      align: 'center',
    },
    {
      id: 'progress',
      header: 'Progress',
      accessor: (row) => {
        const latestProgress = row.progress[row.progress.length - 1];
        return latestProgress ? latestProgress.percentage : 0;
      },
      dataType: 'progress',
      sortable: true,
      width: 150,
      mobilePriority: 2,
      Cell: ({ row, value }) => {
        const xpEarned = row.progress.reduce((total, p) => total + p.xpEarned, 0);
        return (
          <div className="space-y-1">
            <ProgressIndicator 
              value={value} 
              max={100}
              showGamification={true}
              xp={xpEarned}
            />
            <div className="text-xs text-muted-foreground text-center">
              +{xpEarned} XP earned
            </div>
          </div>
        );
      },
    },
    {
      id: 'difficulty',
      header: 'Difficulty',
      accessor: 'difficulty',
      dataType: 'badge',
      sortable: true,
      filterable: true,
      width: 100,
      mobilePriority: 4,
      align: 'center',
    },
    {
      id: 'targetDate',
      header: 'Due Date',
      accessor: 'targetDate',
      dataType: 'date',
      sortable: true,
      filterable: true,
      width: 120,
      mobilePriority: 3,
      Cell: ({ value }) => {
        if (!value) return <span className="text-muted-foreground">—</span>;
        
        const date = new Date(value);
        const isOverdue = date < new Date();
        const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        return (
          <div className={`space-y-1 ${isOverdue ? 'text-destructive' : ''}`}>
            <div>{date.toLocaleDateString()}</div>
            <div className="text-xs">
              {isOverdue 
                ? `${Math.abs(daysUntil)} days overdue`
                : daysUntil === 0 
                  ? 'Due today'
                  : `${daysUntil} days left`
              }
            </div>
          </div>
        );
      },
    },
    {
      id: 'assignedUser',
      header: 'Assigned To',
      accessor: (row) => row.user.name || row.user.email,
      sortable: true,
      filterable: true,
      width: 150,
      mobilePriority: 4,
      Cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">{row.user.name || 'Unnamed User'}</div>
            <div className="text-sm text-muted-foreground">
              Level {row.user.currentLevel}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      accessor: 'moduleId',
      dataType: 'badge',
      sortable: true,
      filterable: true,
      width: 100,
      mobilePriority: 5,
      Cell: ({ value }) => {
        const categoryLabels = {
          fitness: 'Fitness',
          learning: 'Learning',
          home: 'Home',
          work: 'Work',
          bible: 'Spiritual',
        };
        return (
          <Badge variant="outline">
            {categoryLabels[value as keyof typeof categoryLabels] || value}
          </Badge>
        );
      },
    },
    {
      id: 'xpEarned',
      header: 'XP Earned',
      accessor: (row) => row.progress.reduce((total, p) => total + p.xpEarned, 0),
      dataType: 'number',
      sortable: true,
      width: 100,
      mobilePriority: 5,
      align: 'right',
      Cell: ({ value }) => (
        <div className="flex items-center justify-end space-x-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-mono">{value}</span>
        </div>
      ),
    },
  ], []);

  // Row actions for individual goals
  const rowActions = useMemo<RowAction<GoalWithRelations>[]>(() => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Target className="h-4 w-4 mr-2" />,
      onClick: (goal) => {
        // Navigate to goal details page
        window.location.href = `/goals/${goal.id}`;
      },
    },
    {
      id: 'edit',
      label: 'Edit Goal',
      icon: <Edit className="h-4 w-4 mr-2" />,
      onClick: (goal) => {
        // Open edit modal or navigate to edit page
        console.log('Edit goal:', goal.id);
      },
    },
    {
      id: 'toggle-status',
      label: (goal) => goal.isCompleted ? 'Mark Incomplete' : 'Mark Complete',
      icon: (goal) => goal.isCompleted 
        ? <Pause className="h-4 w-4 mr-2" />
        : <CheckCircle className="h-4 w-4 mr-2" />,
      onClick: async (goal) => {
        try {
          await fetch(`/api/v1/goals/${goal.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isCompleted: !goal.isCompleted }),
          });
          fetchGoals(); // Refresh data
        } catch (err) {
          console.error('Failed to update goal status:', err);
        }
      },
    },
    {
      id: 'delete',
      label: 'Delete Goal',
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: async (goal) => {
        if (confirm(`Are you sure you want to delete "${goal.title}"?`)) {
          try {
            await fetch(`/api/v1/goals/${goal.id}`, {
              method: 'DELETE',
            });
            fetchGoals(); // Refresh data
          } catch (err) {
            console.error('Failed to delete goal:', err);
          }
        }
      },
      destructive: true,
      requireConfirmation: true,
      confirmationMessage: 'This action cannot be undone.',
    },
  ], [fetchGoals]);

  // Bulk actions for multiple goals
  const bulkActions = useMemo<BulkAction<GoalWithRelations>[]>(() => [
    {
      id: 'bulk-complete',
      label: 'Mark as Completed',
      icon: <CheckCircle className="h-4 w-4 mr-2" />,
      onClick: async (goals) => {
        try {
          await Promise.all(
            goals.map(goal =>
              fetch(`/api/v1/goals/${goal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: true }),
              })
            )
          );
          fetchGoals(); // Refresh data
        } catch (err) {
          console.error('Failed to update goals:', err);
        }
      },
      disabled: (goals) => goals.every(goal => goal.isCompleted),
    },
    {
      id: 'bulk-assign',
      label: 'Reassign Goals',
      icon: <User className="h-4 w-4 mr-2" />,
      onClick: (goals) => {
        // Open bulk assignment modal
        console.log('Bulk assign:', goals.length, 'goals');
      },
    },
    {
      id: 'bulk-delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: async (goals) => {
        if (confirm(`Delete ${goals.length} goals? This cannot be undone.`)) {
          try {
            await Promise.all(
              goals.map(goal =>
                fetch(`/api/v1/goals/${goal.id}`, {
                  method: 'DELETE',
                })
              )
            );
            fetchGoals(); // Refresh data
          } catch (err) {
            console.error('Failed to delete goals:', err);
          }
        }
      },
      destructive: true,
      requireConfirmation: true,
      confirmationMessage: `Delete ${selectedGoals.length} goals? This action cannot be undone.`,
      minSelections: 1,
    },
  ], [fetchGoals, selectedGoals.length]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Goals Dashboard</h2>
          <p className="text-muted-foreground">
            Track and manage your personal goals with progress tracking and gamification.
          </p>
        </div>
        <Button onClick={() => window.location.href = '/goals/new'}>
          <Target className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      </div>

      {/* Goals Table */}
      <BaseTable
        data={goals}
        columns={columns}
        loading={loading}
        error={error}
        title="My Goals"
        description="View and manage all your goals with detailed progress tracking."
        emptyMessage="🎯 No goals yet! Create your first goal to start your journey."
        
        // Selection
        selection={{ mode: 'multiple' }}
        onSelectionChange={setSelectedGoals}
        
        // Actions
        rowActions={rowActions}
        bulkActions={bulkActions}
        
        // Pagination
        pagination={{
          pageSize: 20,
          pageSizeOptions: [10, 20, 50, 100],
        }}
        
        // Initial state
        initialSorting={[
          { columnId: 'targetDate', direction: 'asc' },
          { columnId: 'priority', direction: 'desc' },
        ]}
        
        // Gamification
        showXP={true}
        showAchievements={true}
        showProgress={true}
        
        // Responsive
        responsive={true}
        initialViewMode="table"
        
        // Accessibility
        keyboardNavigation={true}
        highlightFocusedRow={true}
        
        // Event handlers
        onRowClick={(goal) => {
          window.location.href = `/goals/${goal.id}`;
        }}
        onRowDoubleClick={(goal) => {
          window.location.href = `/goals/${goal.id}/edit`;
        }}
        
        // Export
        exportConfig={{
          formats: ['csv', 'json'],
          filename: 'my-goals',
          transformData: (data) => data.map(goal => ({
            title: goal.title,
            status: goal.isCompleted ? 'Completed' : 'Active',
            priority: goal.priority,
            difficulty: goal.difficulty,
            progress: goal.progress[goal.progress.length - 1]?.percentage || 0,
            dueDate: goal.targetDate,
            assignedTo: goal.user.name || goal.user.email,
            xpEarned: goal.progress.reduce((total, p) => total + p.xpEarned, 0),
          })),
        }}
        
        // Testing
        testId="goals-table"
      />

      {/* Summary Statistics */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold">{goals.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {goals.filter(g => g.isCompleted).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {goals.reduce((total, goal) => 
                    total + goal.progress.reduce((sum, p) => sum + p.xpEarned, 0), 0
                  )}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    goals.reduce((total, goal) => {
                      const progress = goal.progress[goal.progress.length - 1];
                      return total + (progress?.percentage || 0);
                    }, 0) / goals.length
                  )}%
                </p>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Users Management Table (Admin View)
// =============================================================================

export function UsersManagementTable() {
  const [users, setUsers] = useState<UserWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users with relations
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/users?include=goals,userAchievements,_count');
      const data = await response.json();
      setUsers(data.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  // User management columns
  const userColumns = useMemo<ColumnDef<UserWithRelations>[]>(() => [
    {
      id: 'name',
      header: 'User',
      accessor: (row) => row.name || row.email,
      sortable: true,
      filterable: true,
      width: 200,
      mobilePriority: 1,
      Cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium">{row.name || 'Unnamed User'}</div>
            <div className="text-sm text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'level',
      header: 'Level',
      accessor: 'currentLevel',
      dataType: 'number',
      sortable: true,
      width: 80,
      mobilePriority: 2,
      align: 'center',
      Cell: ({ value }) => (
        <Badge variant="secondary">
          Level {value}
        </Badge>
      ),
    },
    {
      id: 'totalXp',
      header: 'Total XP',
      accessor: 'totalXp',
      dataType: 'number',
      sortable: true,
      width: 120,
      mobilePriority: 3,
      align: 'right',
      Cell: ({ value }) => (
        <div className="flex items-center justify-end space-x-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-mono">{value.toLocaleString()}</span>
        </div>
      ),
    },
    {
      id: 'goals',
      header: 'Goals',
      accessor: (row) => row._count.goals,
      dataType: 'number',
      sortable: true,
      width: 100,
      mobilePriority: 3,
      align: 'center',
    },
    {
      id: 'achievements',
      header: 'Achievements',
      accessor: (row) => row._count.userAchievements,
      dataType: 'number',
      sortable: true,
      width: 120,
      mobilePriority: 4,
      align: 'center',
      Cell: ({ value }) => (
        <div className="flex items-center justify-center space-x-1">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      id: 'streak',
      header: 'Streak',
      accessor: 'streakCount',
      dataType: 'number',
      sortable: true,
      width: 100,
      mobilePriority: 4,
      align: 'center',
      Cell: ({ value }) => (
        <Badge variant={value > 7 ? 'default' : 'outline'}>
          🔥 {value}
        </Badge>
      ),
    },
    {
      id: 'lastActivity',
      header: 'Last Active',
      accessor: 'lastActivity',
      dataType: 'datetime',
      sortable: true,
      width: 120,
      mobilePriority: 5,
      Cell: ({ value }) => {
        if (!value) return <span className="text-muted-foreground">Never</span>;
        
        const date = new Date(value);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        return (
          <div className="text-sm">
            {diffDays === 0 ? 'Today' : 
             diffDays === 1 ? 'Yesterday' : 
             diffDays < 7 ? `${diffDays} days ago` : 
             date.toLocaleDateString()}
          </div>
        );
      },
    },
  ], []);

  return (
    <BaseTable
      data={users}
      columns={userColumns}
      loading={loading}
      title="User Management"
      description="Manage system users, view their progress, and track engagement."
      selection={{ mode: 'multiple' }}
      pagination={{ pageSize: 25 }}
      showXP={true}
      showAchievements={true}
      initialSorting={[
        { columnId: 'totalXp', direction: 'desc' },
      ]}
      responsive={true}
      keyboardNavigation={true}
    />
  );
}

// =============================================================================
// Export Examples
// =============================================================================

// Example of server-side data fetching hook
export function useGoalsData(filters: any, sorting: any, pagination: any) {
  const [data, setData] = useState<GoalWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [filters, sorting, pagination]);

  const fetchData = async () => {
    setLoading(true);
    setError(undefined);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.pageSize.toString(),
        ...(filters && { filters: JSON.stringify(filters) }),
        ...(sorting && { sort: JSON.stringify(sorting) }),
      });

      const response = await fetch(`/api/v1/goals?${params}`);
      if (!response.ok) throw new Error('Failed to fetch goals');

      const result = await response.json();
      setData(result.data);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    totalCount,
    refetch: fetchData,
  };
}

export default GoalsTable;