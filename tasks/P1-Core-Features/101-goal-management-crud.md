# P1-101: Goal Management CRUD

## Task Overview

**Priority**: P1 (Core Feature)  
**Status**: Not Started  
**Effort**: 13 Story Points  
**Sprint**: Core Functionality  

## Description

Implement comprehensive CRUD (Create, Read, Update, Delete) operations for goal management, including the user interface components, API endpoints, and data persistence layer. This is the core feature that enables users to manage their life goals across different modules.

## Dependencies

- ✅ P0-001: Authentication System (for user-specific goals)
- ✅ P0-002: Database Integration (schema exists)
- ❌ P0-003: Storybook Configuration (for component development)
- ✅ Base components available
- ✅ Layout system implemented

## Definition of Done

### Core CRUD Operations
- [ ] Create new goals with full validation
- [ ] Read/view goals with filtering and sorting
- [ ] Update existing goals with change tracking
- [ ] Delete goals with confirmation and cascade handling
- [ ] Bulk operations (select multiple, bulk delete, bulk update)
- [ ] Goal status management (active, completed, paused, archived)

### User Interface Components
- [ ] Goal creation form with validation
- [ ] Goal list view (table and card modes)
- [ ] Goal detail view with edit capabilities
- [ ] Goal quick-add component
- [ ] Search and filter interface
- [ ] Mobile-responsive design throughout

### API Implementation
- [ ] RESTful API endpoints for all CRUD operations
- [ ] Proper HTTP status codes and error handling
- [ ] Input validation and sanitization
- [ ] Rate limiting and security measures
- [ ] API documentation and testing

### Data Management
- [ ] Efficient database queries with pagination
- [ ] Proper indexing for performance
- [ ] Data validation and constraints
- [ ] Audit trail for goal changes
- [ ] Soft delete implementation

## User Stories

### US-101.1: Goal Creation
```
As a user
I want to create new goals with detailed information
So that I can track my progress toward specific objectives
```

**Acceptance Criteria:**
- User can enter goal title, description, target date, difficulty, and priority
- Form validates all inputs with clear error messages
- User can select appropriate module for the goal
- Goal is saved with proper user association
- Success feedback is provided after creation
- Form supports both desktop and mobile interfaces

### US-101.2: Goal Viewing and Management
```
As a user
I want to view all my goals in an organized manner
So that I can quickly understand my current objectives and priorities
```

**Acceptance Criteria:**
- Goals are displayed in both table and card views
- User can filter by module, status, priority, and difficulty
- Goals can be sorted by creation date, priority, target date, or progress
- Search functionality works across title and description
- Pagination handles large numbers of goals efficiently
- Mobile view shows condensed, touch-friendly card layout

### US-101.3: Goal Editing
```
As a user
I want to edit existing goals to update their information
So that I can adapt my objectives as circumstances change
```

**Acceptance Criteria:**
- All goal fields are editable except creation metadata
- Changes are validated before saving
- User receives confirmation of successful updates
- Edit history is tracked for accountability
- Concurrent editing conflicts are handled gracefully
- Mobile editing experience is optimized for touch

### US-101.4: Goal Deletion
```
As a user
I want to delete goals that are no longer relevant
So that I can maintain a clean and focused goal list
```

**Acceptance Criteria:**
- Deletion requires explicit confirmation
- Related progress data is handled appropriately (archive vs delete)
- Bulk deletion is available for multiple goals
- Deleted goals can be recovered within 30 days (soft delete)
- Cascade deletion affects sub-goals appropriately
- Achievement progress is recalculated after deletion

### US-101.5: Goal Status Management
```
As a user
I want to change goal statuses (active, completed, paused)
So that I can accurately represent my current focus and achievements
```

**Acceptance Criteria:**
- Status changes are reflected immediately in the UI
- Completed goals trigger XP rewards and achievement checks
- Paused goals are visually distinct but remain editable
- Status changes are logged for progress tracking
- Status filters work correctly in goal views
- Mobile status changes use intuitive gestures

## Technical Implementation

### Database Schema Enhancements
```sql
-- Additional indexes for performance
CREATE INDEX idx_goal_user_status ON Goal(userId, isCompleted, priority);
CREATE INDEX idx_goal_module_date ON Goal(moduleId, targetDate);
CREATE INDEX idx_goal_search ON Goal(title, description);

-- Audit trail table
CREATE TABLE GoalAudit (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  userId TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'status_change'
  changes JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goalId) REFERENCES Goal(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### API Endpoints

#### Goal CRUD Routes
```typescript
// src/app/api/v1/goals/route.ts
export async function GET(request: NextRequest) {
  // Query parameters: page, limit, filter, sort, search
  const { searchParams } = new URL(request.url);
  const userId = await getCurrentUserId(request);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const filter = searchParams.get('filter'); // 'active', 'completed', 'all'
  const moduleId = searchParams.get('moduleId');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';

  try {
    const goals = await goalRepository.findMany({
      userId,
      filter,
      moduleId,
      search,
      page,
      limit,
      sort,
      order,
    });
    
    return NextResponse.json({
      success: true,
      data: goals,
      pagination: {
        page,
        limit,
        total: goals.length,
        hasMore: goals.length === limit,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    // Validate input
    const validatedData = validateInput(goalCreateSchema)(body);
    
    const goal = await goalRepository.create({
      ...validatedData,
      userId,
    });
    
    // Trigger gamification checks
    await gamificationService.processGoalCreation(userId, goal);
    
    return NextResponse.json({
      success: true,
      data: goal,
    }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

```typescript
// src/app/api/v1/goals/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId(request);
    const goal = await goalRepository.findByIdAndUser(params.id, userId);
    
    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(goalUpdateSchema)(body);
    
    const goal = await goalRepository.update(params.id, userId, validatedData);
    
    // Log audit trail
    await auditService.logGoalChange(params.id, userId, 'update', validatedData);
    
    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId(request);
    
    // Soft delete by default
    const goal = await goalRepository.softDelete(params.id, userId);
    
    // Handle related data
    await progressRepository.archiveByGoalId(params.id);
    
    // Recalculate achievements
    await gamificationService.recalculateAchievements(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Repository Implementation

#### Goal Repository
```typescript
// src/lib/repositories/goal-repository.ts
import { BaseRepository } from '../prisma/base-repository';
import { Goal, Prisma } from '@prisma/client';

export class GoalRepository extends BaseRepository<Goal> {
  model = prisma.goal;

  async findMany(options: {
    userId: string;
    filter?: string;
    moduleId?: string;
    search?: string;
    page: number;
    limit: number;
    sort: string;
    order: string;
  }) {
    const {
      userId,
      filter,
      moduleId,
      search,
      page,
      limit,
      sort,
      order,
    } = options;

    const where: Prisma.GoalWhereInput = {
      userId,
      ...(moduleId && { moduleId }),
      ...(filter === 'active' && { isCompleted: false }),
      ...(filter === 'completed' && { isCompleted: true }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.GoalOrderByWithRelationInput = {
      [sort]: order as 'asc' | 'desc',
    };

    return await this.model.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        module: true,
        progress: {
          take: 1,
          orderBy: { recordedAt: 'desc' },
        },
        _count: {
          select: { subGoals: true },
        },
      },
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return await this.model.findFirst({
      where: { id, userId },
      include: {
        module: true,
        progress: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        parentGoal: true,
        subGoals: true,
      },
    });
  }

  async update(id: string, userId: string, data: Partial<Goal>) {
    return await this.model.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(id: string, userId: string) {
    return await this.model.update({
      where: { id },
      data: {
        isCompleted: true,
        updatedAt: new Date(),
        // Add soft delete field if implemented
      },
    });
  }

  async bulkUpdateStatus(ids: string[], userId: string, status: boolean) {
    return await this.model.updateMany({
      where: {
        id: { in: ids },
        userId,
      },
      data: {
        isCompleted: status,
        updatedAt: new Date(),
      },
    });
  }
}

export const goalRepository = new GoalRepository();
```

### React Components

#### Goal List Component
```typescript
// src/components/goals/GoalList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Goal, Module } from '@prisma/client';
import { BaseTable } from '@/components/base/BaseTable';
import { DataCard } from '@/components/base/DataCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useGoals } from '@/hooks/useGoals';

interface GoalWithModule extends Goal {
  module: Module;
  progress?: Array<{ value: number; maxValue: number }>;
  _count: { subGoals: number };
}

export function GoalList() {
  const { isMobile } = useBreakpoint();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'table' | 'card'>(isMobile ? 'card' : 'table');
  
  const {
    goals,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    refetch,
  } = useGoals({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 20,
    filter: searchParams.get('filter') || 'all',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'createdAt',
    order: searchParams.get('order') || 'desc',
  });

  const handleSearch = (search: string) => {
    updateFilters({ search, page: 1 });
  };

  const handleFilterChange = (key: string, value: string) => {
    updateFilters({ [key]: value, page: 1 });
  };

  const tableColumns = [
    {
      key: 'title',
      label: 'Goal',
      sortable: true,
      render: (goal: GoalWithModule) => (
        <div>
          <div className="font-medium">{goal.title}</div>
          <div className="text-sm text-muted-foreground">{goal.module.name}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (goal: GoalWithModule) => (
        <StatusBadge variant={goal.priority} size="sm">
          {goal.priority}
        </StatusBadge>
      ),
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      sortable: true,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (goal: GoalWithModule) => {
        const latestProgress = goal.progress?.[0];
        const percentage = latestProgress
          ? (latestProgress.value / latestProgress.maxValue) * 100
          : 0;
        return <ProgressIndicator value={percentage} size="sm" />;
      },
    },
    {
      key: 'targetDate',
      label: 'Target Date',
      sortable: true,
      render: (goal: GoalWithModule) =>
        goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : '—',
    },
    {
      key: 'actions',
      label: '',
      render: (goal: GoalWithModule) => (
        <GoalActions goal={goal} onUpdate={refetch} />
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading goals: {error.message}</p>
        <Button onClick={refetch} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Search goals..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={filters.filter}
            onValueChange={(value) => handleFilterChange('filter', value)}
          >
            <option value="all">All Goals</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
        
        {/* View Mode Toggle (Desktop only) */}
        {!isMobile && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              Cards
            </Button>
          </div>
        )}
      </div>

      {/* Goals Display */}
      {viewMode === 'table' && !isMobile ? (
        <BaseTable
          data={goals}
          columns={tableColumns}
          loading={loading}
          pagination={pagination}
          onSort={(column, direction) =>
            updateFilters({ sort: column, order: direction })
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={refetch} />
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No goals found</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search
              ? 'Try adjusting your search terms'
              : 'Create your first goal to get started'}
          </p>
          <Button onClick={() => router.push('/goals/new')}>
            Create Goal
          </Button>
        </div>
      )}
    </div>
  );
}
```

#### Goal Form Component
```typescript
// src/components/goals/GoalForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Goal, Module } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useModules } from '@/hooks/useModules';
import { goalCreateSchema } from '@/lib/validation/schemas';

type GoalFormData = z.infer<typeof goalCreateSchema>;

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function GoalForm({ goal, onSubmit, onCancel, loading }: GoalFormProps) {
  const { modules } = useModules();
  const isEditing = Boolean(goal);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalCreateSchema),
    defaultValues: {
      title: goal?.title || '',
      description: goal?.description || '',
      difficulty: goal?.difficulty || 'medium',
      priority: goal?.priority || 'medium',
      targetDate: goal?.targetDate ? new Date(goal.targetDate) : undefined,
      moduleId: goal?.moduleId || '',
    },
  });

  const handleSubmit = async (data: GoalFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to save goal:', error);
      // Handle error (toast notification, etc.)
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your goal title..."
                  {...field}
                  className="text-lg"
                />
              </FormControl>
              <FormMessage />
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
                  placeholder="Describe your goal in detail..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="moduleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module</FormLabel>
                <FormControl>
                  <Select {...field}>
                    <option value="">Select module...</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Date</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    placeholder="Select target date..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <Select {...field}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
                <FormControl>
                  <Select {...field}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="sm:flex-1"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Goal' : 'Create Goal'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="sm:flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

## Mobile Optimizations

### Touch-Friendly Interactions
- 44px minimum touch targets
- Swipe gestures for quick actions
- Long press for context menus
- Pull-to-refresh for goal lists

### Performance Optimizations
- Virtual scrolling for large goal lists
- Lazy loading of goal details
- Optimistic UI updates
- Efficient re-renders with React.memo

### Offline Support (Future)
- Cache goal data locally
- Queue goal changes when offline
- Sync when connection restored

## Testing Strategy

### Unit Tests
```typescript
// src/components/goals/GoalForm.test.tsx
describe('GoalForm', () => {
  it('validates required fields', async () => {
    const { user } = render(<GoalForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    await user.click(screen.getByRole('button', { name: /create goal/i }));
    
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const mockSubmit = vi.fn();
    const { user } = render(<GoalForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    await user.type(screen.getByLabelText(/goal title/i), 'Learn React');
    await user.selectOptions(screen.getByLabelText(/module/i), 'learning');
    await user.click(screen.getByRole('button', { name: /create goal/i }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      title: 'Learn React',
      moduleId: 'learning',
      // ... other default values
    });
  });
});
```

### Integration Tests
- Complete goal CRUD workflows
- Filter and search functionality
- Bulk operations
- Mobile responsive behavior

### API Tests
- All endpoint functionality
- Error handling scenarios
- Authentication and authorization
- Performance under load

## Success Metrics

### Functional Metrics
- 100% CRUD operations working correctly
- < 2 second goal creation time
- < 1 second goal list loading time
- 99.9% API uptime
- Zero data loss incidents

### User Experience Metrics
- Goal creation completion rate > 95%
- User satisfaction with goal management > 4.5/5
- Mobile usability score > 90%
- Task completion time < 30 seconds

### Performance Metrics
- Goal list loads in < 1 second
- Search results in < 500ms
- Mobile scrolling at 60fps
- Bundle size impact < 100kb

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Core Functionality