# Project Requirements Plan: Goal Management CRUD Implementation

## Overview

This PRP defines the comprehensive implementation of Goal Management CRUD (Create, Read, Update, Delete) functionality for the Goal Assistant application. Based on the existing codebase analysis and modern Next.js patterns, this implementation will provide a complete goal management system with mobile-first design, robust authentication, and gamification integration.

## Context Analysis

### Existing Architecture
- **Framework**: Next.js 15 with App Router and TypeScript (strict mode)
- **Database**: SQLite with Prisma ORM, PostgreSQL/MySQL support planned
- **Authentication**: Custom JWT-based system with middleware protection
- **UI**: shadcn/ui components with Tailwind CSS v4
- **Testing**: Vitest, React Testing Library, MSW for API mocking
- **State Management**: React hooks with custom hook patterns
- **Module System**: Plugin-based architecture for different life areas

### Current Database Schema
The Goal model already exists with:
- Basic CRUD fields (id, title, description, isCompleted, etc.)
- User association and module integration
- Hierarchical structure (parentGoalId, subGoals)
- Progress tracking relationship
- Proper indexing for performance

### Existing Infrastructure
- BaseRepository pattern with validation and error handling
- GoalRepository with advanced querying capabilities
- Authentication middleware system
- BaseTable component with comprehensive features
- Validation schemas with Zod
- API route structure under `/api/v1/`

## Technical Requirements

### API Endpoints Implementation

#### 1. Goal CRUD Routes (`/api/v1/goals`)

**GET /api/v1/goals**
- Query parameters: page, limit, filter, moduleId, search, sort, order
- Authentication: Required via middleware
- Response: Paginated list with goal relations (user, module, progress, subGoals)
- Features: Search across title/description, filtering by status/module/priority/difficulty

**POST /api/v1/goals**  
- Body: GoalCreateInput (validated with Zod schema)
- Authentication: Required with user context
- Features: Auto-assign userId, trigger gamification events
- Response: Created goal with relations

**GET /api/v1/goals/[id]**
- Authentication: Required, ownership validation
- Response: Goal with full relations (user, module, parentGoal, subGoals, progress)

**PUT /api/v1/goals/[id]**
- Body: GoalUpdateInput (validated with Zod schema)
- Authentication: Required, ownership validation
- Features: Audit trail logging, concurrent edit handling
- Response: Updated goal with relations

**DELETE /api/v1/goals/[id]**
- Authentication: Required, ownership validation
- Features: Soft delete by default, cascade handling for subGoals, achievement recalculation
- Response: Success confirmation

#### 2. Bulk Operations Routes

**POST /api/v1/goals/bulk**
- Actions: bulk-update-status, bulk-delete, bulk-archive
- Body: { action: string, goalIds: string[], data?: object }
- Authentication: Required, ownership validation for all goals
- Features: Transaction-based operations, progress tracking

### UI Components Implementation

#### 1. Goal List Component (`src/components/goals/GoalList.tsx`)

**Features:**
- Mobile-first responsive design (card view default on mobile)
- Table view for desktop with sortable columns
- Real-time search with debounced input
- Advanced filtering (status, module, priority, difficulty, date ranges)
- Bulk selection with actions (complete, delete, archive)
- Infinite scroll or pagination options
- Pull-to-refresh on mobile
- Gamification indicators (XP earned, achievements unlocked)

**Key Patterns:**
- Custom useGoals hook for data fetching
- BaseTable integration for advanced features
- Touch-friendly interactions (44px minimum targets)
- Optimistic updates for better UX

#### 2. Goal Form Component (`src/components/goals/GoalForm.tsx`)

**Features:**
- React Hook Form with Zod validation
- Rich text editor for description
- Smart date picker with presets
- Module selection with dynamic loading
- Hierarchical goal selection (parent/sub-goals)
- Difficulty/priority visual indicators
- Auto-save draft functionality
- Accessibility compliance (ARIA labels, keyboard navigation)

**Validation:**
- Real-time field validation
- Cross-field validation (target date logic)
- Server-side validation echo
- User-friendly error messages

#### 3. Goal Card Component (`src/components/goals/GoalCard.tsx`)

**Features:**
- Touch-friendly mobile design
- Progress visualization
- Quick actions (complete, edit, delete)
- Swipe gestures for mobile
- Status indicators with color coding
- Achievement badges display
- Sub-goal counter and progress

#### 4. Goal Details Component (`src/components/goals/GoalDetail.tsx`)

**Features:**
- Comprehensive goal information
- Progress history visualization
- Sub-goal management interface
- Activity timeline
- Related achievements display
- Quick edit capabilities
- Share/export options

### Custom Hooks Implementation

#### 1. useGoals Hook (`src/hooks/useGoals.ts`)

```typescript
interface UseGoalsOptions {
  userId?: string;
  moduleId?: string;
  page?: number;
  limit?: number;
  filter?: 'all' | 'active' | 'completed';
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface UseGoalsReturn {
  goals: GoalWithRelations[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo;
  filters: FilterState;
  updateFilters: (filters: Partial<FilterState>) => void;
  refetch: () => Promise<void>;
  createGoal: (data: GoalCreateInput) => Promise<Goal>;
  updateGoal: (id: string, data: GoalUpdateInput) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  bulkUpdateGoals: (ids: string[], data: Partial<GoalUpdateInput>) => Promise<void>;
}
```

Features:
- TanStack Query integration for caching
- Optimistic updates
- Background refetching
- Error retry logic
- Loading state management

#### 2. useGoalForm Hook (`src/hooks/useGoalForm.ts`)

Features:
- Form state management
- Validation integration
- Auto-save functionality  
- Draft recovery
- Submission handling

### Database Schema Enhancements

#### 1. Goal Audit Table
```sql
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

#### 2. Performance Indexes
```sql
CREATE INDEX idx_goal_user_status ON Goal(userId, isCompleted, priority);
CREATE INDEX idx_goal_module_date ON Goal(moduleId, targetDate);
CREATE INDEX idx_goal_search_text ON Goal(title, description);
CREATE INDEX idx_goal_audit_timeline ON GoalAudit(goalId, timestamp);
```

## Implementation Strategy

### Phase 1: Core API Development (Days 1-3)
1. **API Route Implementation**
   - Implement all CRUD endpoints with authentication
   - Add comprehensive error handling
   - Implement audit trail system
   - Add input validation and sanitization

2. **Repository Enhancements**
   - Extend GoalRepository with bulk operations
   - Add audit trail methods
   - Implement soft delete functionality
   - Add advanced filtering capabilities

3. **Testing Infrastructure**
   - Write API route tests with MSW mocks
   - Add repository unit tests
   - Create integration test suite
   - Set up performance benchmarks

### Phase 2: UI Components Development (Days 4-7)
1. **Goal List Implementation**
   - Build responsive table/card views
   - Add search and filtering
   - Implement bulk operations
   - Add mobile optimizations

2. **Goal Form Development**
   - Create form with validation
   - Add rich editing capabilities
   - Implement auto-save
   - Add accessibility features

3. **Supporting Components**
   - Goal card component
   - Goal detail component
   - Quick-add button
   - Status indicators

### Phase 3: Advanced Features (Days 8-10)
1. **Custom Hooks**
   - Implement useGoals hook
   - Create useGoalForm hook
   - Add caching and optimizations
   - Test hook behaviors

2. **Mobile Optimizations**
   - Add touch gestures
   - Implement pull-to-refresh
   - Add offline capabilities
   - Optimize performance

3. **Gamification Integration**
   - Connect XP rewards
   - Add achievement triggers
   - Display progress indicators
   - Create celebration animations

### Phase 4: Testing & Polish (Days 11-13)
1. **Comprehensive Testing**
   - Unit tests for all components
   - Integration tests for workflows
   - E2E tests for critical paths
   - Performance testing

2. **Accessibility & UX**
   - ARIA compliance testing
   - Keyboard navigation
   - Screen reader compatibility
   - User feedback integration

3. **Documentation**
   - API documentation
   - Component storybook stories
   - User guide updates
   - Developer documentation

## File Structure

```
src/
├── app/
│   ├── api/v1/goals/
│   │   ├── route.ts                 # GET /goals, POST /goals
│   │   ├── [id]/route.ts           # GET/PUT/DELETE /goals/:id
│   │   ├── bulk/route.ts           # POST /goals/bulk
│   │   └── stats/route.ts          # GET /goals/stats
│   └── goals/
│       ├── page.tsx                # Goals listing page
│       ├── new/page.tsx            # Create goal page
│       └── [id]/
│           ├── page.tsx            # Goal detail page
│           └── edit/page.tsx       # Edit goal page
├── components/goals/
│   ├── GoalList.tsx               # Main goals list component
│   ├── GoalForm.tsx               # Goal create/edit form
│   ├── GoalCard.tsx               # Goal card component
│   ├── GoalDetail.tsx             # Goal detail view
│   ├── GoalActions.tsx            # Action buttons/dropdowns
│   ├── GoalFilters.tsx            # Filter components
│   ├── GoalStats.tsx              # Statistics dashboard
│   └── index.ts                   # Exports
├── hooks/
│   ├── useGoals.ts                # Goals data management
│   ├── useGoalForm.ts             # Form state management
│   ├── useGoalStats.ts            # Statistics hook
│   └── useGoalActions.ts          # Action handlers
├── lib/repositories/
│   └── goal-repository.ts         # Extended with new methods
└── test/
    ├── api/goals/                 # API route tests
    ├── components/goals/          # Component tests
    └── hooks/                     # Hook tests
```

## Validation Gates

### 1. Code Quality
```bash
# TypeScript compilation
npx tsc --noEmit

# Linting and formatting
npm run lint

# Type checking
npm run type-check
```

### 2. Testing
```bash
# Unit tests with coverage (80% minimum)
npm run test:coverage

# API integration tests
npm run test:api

# Component testing
npm run test:unit

# E2E testing critical paths
npm run test:e2e -- --spec="goals/**"
```

### 3. Performance
```bash
# Database query performance
npm run test:db

# Bundle size analysis
npm run analyze

# Performance testing
npm run test:performance
```

### 4. Accessibility
```bash
# Accessibility testing
npm run test:a11y

# Screen reader testing
npm run storybook -- --test-runner
```

## Success Criteria

### Functional Requirements
- [ ] All CRUD operations working correctly (Create, Read, Update, Delete)
- [ ] Bulk operations for multiple goals
- [ ] Advanced filtering and search functionality
- [ ] Mobile-responsive design with touch optimizations
- [ ] Real-time updates and optimistic UI
- [ ] Offline capability with sync

### Performance Requirements
- [ ] Goal list loads in < 1 second
- [ ] Search results appear in < 500ms
- [ ] Form submission completes in < 2 seconds
- [ ] Mobile scrolling at 60fps
- [ ] Bundle size impact < 150kb

### Quality Requirements
- [ ] 80%+ test coverage across all metrics
- [ ] Zero TypeScript errors
- [ ] WCAG 2.1 AA compliance
- [ ] 100% API route error handling
- [ ] Comprehensive audit trail

### User Experience Requirements
- [ ] Goal creation completion rate > 95%
- [ ] User satisfaction with goal management > 4.5/5
- [ ] Mobile usability score > 90%
- [ ] Task completion time < 30 seconds for basic operations

## Dependencies and Prerequisites

### Internal Dependencies
- ✅ Authentication system (existing)
- ✅ Database schema (existing)  
- ✅ Base components (existing)
- ✅ Repository pattern (existing)
- ✅ API structure (existing)
- ❌ Storybook configuration (P0-003 task)

### External Resources
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Hook Form Guide](https://react-hook-form.com/get-started)
- [Prisma CRUD Operations](https://www.prisma.io/docs/concepts/components/prisma-client/crud)
- [TanStack Query Best Practices](https://tanstack.com/query/latest)
- [Zod Validation Patterns](https://zod.dev/)

## Risk Mitigation

### High-Risk Areas
1. **Performance with Large Datasets**: Use virtual scrolling and proper indexing
2. **Concurrent Edit Conflicts**: Implement optimistic locking and conflict resolution
3. **Mobile UX Complexity**: Extensive testing on real devices
4. **Data Consistency**: Use database transactions for bulk operations

### Monitoring and Alerts
- API response time monitoring
- Database query performance tracking  
- User interaction analytics
- Error rate monitoring

## Estimated Timeline

- **Phase 1 (API)**: 3 days
- **Phase 2 (UI)**: 4 days  
- **Phase 3 (Advanced)**: 3 days
- **Phase 4 (Testing)**: 3 days
- **Buffer**: 2 days

**Total: 15 days**

## Confidence Score

**9/10** - High confidence for one-pass implementation success due to:

✅ **Existing Infrastructure**: Strong foundation with repository pattern, validation, authentication
✅ **Clear Requirements**: Well-defined task specification with acceptance criteria  
✅ **Proven Patterns**: Following established Next.js and React best practices
✅ **Comprehensive Context**: Thorough analysis of existing codebase and external research
✅ **Incremental Approach**: Phased implementation allows for validation at each stage

**Risk Factors**: Complex mobile interactions and gamification integration may require iteration.

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Task**: P1-101 Goal Management CRUD  
**Sprint**: Core Functionality