# Fitness Workout System - Product Requirements Document (PRD)

## Executive Summary

This PRD outlines the complete implementation of a comprehensive fitness workout planning system for the Goal Assistant application. The system will replace the current mock implementation with a fully functional workout tracking platform that supports weekly regimens, day copying, exercise management, and progress tracking with NO mock data.

## Current State Analysis

### Existing Implementation
- **Location**: `/src/modules/fitness/FitnessModule.tsx` and `/src/app/modules/fitness/page.tsx`
- **Status**: Basic module shell with mock UI components
- **Issues**: 
  - Sub-routes like `/modules/fitness/workouts` return 404
  - All data is mock/hardcoded
  - No database schema for fitness data
  - No API endpoints for workout management
  - Missing core workout planning functionality

### Database Schema Gaps
- **Missing Tables**: Workouts, Exercises, WorkoutSets, ExerciseTemplates, WorkoutPlans
- **Current Schema**: Only has User, Goal, Progress, Achievement tables
- **References**: Need fitness-specific extensions to existing schema

### API Patterns Analysis
- **Existing Pattern**: `/api/v1/modules/{moduleId}` with type-based operations
- **Reference Implementation**: Work module shows comprehensive CRUD patterns
- **Authentication**: Uses `withAuth` middleware with proper user context

## Product Requirements

### Core Features Required

#### 1. Weekly Workout Planning System
- Create, edit, and delete weekly workout plans
- Assign workouts to specific days of the week
- Copy entire weeks to new date ranges
- Template-based workout creation
- Progress tracking across weekly cycles

#### 2. Daily Workout Management  
- Create individual workout sessions
- Copy entire days between weeks/dates
- Assign multiple exercises to daily workouts
- Track completion status per day
- Calendar integration for scheduling

#### 3. Exercise Library & Management
- Comprehensive exercise database with categories
- Custom exercise creation and editing
- Exercise templates with default sets/reps
- Copy individual exercises between workouts
- Exercise variation and progression tracking

#### 4. Workout Execution & Tracking
- Real-time workout logging (sets, reps, weight, duration)
- Rest timer between sets
- Workout completion tracking
- Progress photos integration
- Personal records tracking

#### 5. Progress Analytics
- Workout frequency analytics
- Strength progression tracking
- Volume load calculations
- Achievement milestones
- Calendar heatmap visualization

## Technical Architecture

### Database Schema Design
Based on research from fitness database design best practices:

```prisma
// Fitness Module Tables
model WorkoutPlan {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  isTemplate  Boolean  @default(false)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workouts Workout[]

  @@index([userId, startDate])
  @@map("WorkoutPlan")
}

model Workout {
  id           String   @id @default(cuid())
  planId       String?
  userId       String
  name         String
  description  String?
  scheduledDate DateTime?
  completedAt  DateTime?
  isTemplate   Boolean  @default(false)
  workoutType  String   // 'cardio', 'strength', 'flexibility', 'mixed'
  estimatedDuration Int? // minutes
  actualDuration    Int? // minutes
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  plan         WorkoutPlan?  @relation(fields: [planId], references: [id], onDelete: SetNull)
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercises    WorkoutExercise[]

  @@index([userId, scheduledDate])
  @@index([planId])
  @@map("Workout")
}

model ExerciseTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String?
  category        String   // 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
  muscleGroups    Json     // Array of targeted muscle groups
  equipmentNeeded String?
  instructions    Json?    // Array of instruction steps
  videoUrl        String?
  isCustom        Boolean  @default(false)
  userId          String?  // null for system exercises
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User?           @relation(fields: [userId], references: [id], onDelete: Cascade)
  workoutExercises WorkoutExercise[]

  @@index([category, name])
  @@index([userId])
  @@map("ExerciseTemplate")
}

model WorkoutExercise {
  id               String   @id @default(cuid())
  workoutId        String
  exerciseId       String
  orderIndex       Int      // Order within workout
  targetSets       Int?
  targetReps       Int?
  targetWeight     Float?
  targetDuration   Int?     // seconds for time-based exercises
  targetDistance   Float?   // for cardio exercises
  restBetweenSets  Int?     // seconds
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  workout   Workout          @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercise  ExerciseTemplate @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  sets      WorkoutSet[]

  @@unique([workoutId, exerciseId, orderIndex])
  @@index([workoutId, orderIndex])
  @@map("WorkoutExercise")
}

model WorkoutSet {
  id                String   @id @default(cuid())
  workoutExerciseId String
  setNumber         Int      // 1, 2, 3, etc.
  reps              Int?
  weight            Float?
  duration          Int?     // seconds
  distance          Float?
  restAfter         Int?     // seconds of rest after this set
  rpe               Int?     // Rate of Perceived Exertion (1-10)
  notes             String?
  completedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  workoutExercise WorkoutExercise @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)

  @@unique([workoutExerciseId, setNumber])
  @@index([workoutExerciseId])
  @@map("WorkoutSet")
}

model PersonalRecord {
  id           String   @id @default(cuid())
  userId       String
  exerciseId   String
  recordType   String   // '1rm', '5rm', 'volume', 'duration', 'distance'
  value        Float
  unit         String   // 'lbs', 'kg', 'seconds', 'miles', 'km'
  achievedAt   DateTime
  workoutId    String?  // Reference to workout where PR was achieved
  createdAt    DateTime @default(now())

  // Relations
  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise ExerciseTemplate @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  workout  Workout?         @relation(fields: [workoutId], references: [id], onDelete: SetNull)

  @@index([userId, exerciseId, recordType])
  @@map("PersonalRecord")
}
```

### API Endpoint Structure
Following the existing `/api/v1/modules/fitness` pattern from work module:

```
GET    /api/v1/modules/fitness?type=dashboard
GET    /api/v1/modules/fitness?type=workout-plans
GET    /api/v1/modules/fitness?type=workouts&planId=123
GET    /api/v1/modules/fitness?type=exercises&category=chest
GET    /api/v1/modules/fitness?type=workout&id=123
POST   /api/v1/modules/fitness (type: workout-plan, workout, exercise-template)
PUT    /api/v1/modules/fitness (type: workout-plan, workout, exercise-template)
DELETE /api/v1/modules/fitness?type=workout&id=123
```

### UI Component Architecture
Based on existing base components and patterns:

```
src/
  components/
    fitness/
      WorkoutPlanner/
        WeeklyView.tsx
        DayView.tsx
        WorkoutList.tsx
      ExerciseLibrary/
        ExerciseGrid.tsx
        ExerciseCard.tsx
        ExerciseForm.tsx
      WorkoutExecution/
        ActiveWorkout.tsx
        SetTracker.tsx
        RestTimer.tsx
      Analytics/
        ProgressCharts.tsx
        CalendarHeatmap.tsx
        PRTable.tsx
```

## Implementation Plan - Ordered PRPs

### Phase 1: Foundation (PRPs 1-2)
**Priority**: Critical
**Dependencies**: None
**Estimated Effort**: High

#### PRP 1: Database Schema & Migration Implementation
**File**: `fitness-database-schema.md`
**Focus**: Implement complete fitness database schema with migrations
**Dependencies**: None

#### PRP 2: Core API Endpoints & Business Logic  
**File**: `fitness-api-endpoints.md`
**Focus**: Implement CRUD operations for all fitness entities
**Dependencies**: PRP 1

### Phase 2: Core Functionality (PRPs 3-5)
**Priority**: High
**Dependencies**: Phase 1
**Estimated Effort**: High

#### PRP 3: Exercise Library & Management System
**File**: `fitness-exercise-library.md`
**Focus**: Exercise templates, categories, custom exercises
**Dependencies**: PRP 1, PRP 2

#### PRP 4: Workout Planning & Scheduling
**File**: `fitness-workout-planning.md`
**Focus**: Weekly plans, daily workouts, scheduling system
**Dependencies**: PRP 1, PRP 2, PRP 3

#### PRP 5: Workout Execution & Real-time Tracking
**File**: `fitness-workout-execution.md`
**Focus**: Live workout logging, set tracking, timers
**Dependencies**: PRP 1-4

### Phase 3: Advanced Features (PRPs 6-7)
**Priority**: Medium
**Dependencies**: Phase 1-2
**Estimated Effort**: Medium

#### PRP 6: Copy/Duplicate Functionality
**File**: `fitness-copy-operations.md`
**Focus**: Copy days, weeks, exercises, entire workout plans
**Dependencies**: PRP 1-5

#### PRP 7: Progress Analytics & Visualization
**File**: `fitness-analytics-system.md`
**Focus**: Charts, personal records, progress tracking, calendar views
**Dependencies**: PRP 1-6

### Phase 4: Integration & Testing (PRPs 8-9)
**Priority**: Medium
**Dependencies**: All previous phases
**Estimated Effort**: Medium

#### PRP 8: Gamification & Achievement Integration
**File**: `fitness-gamification-integration.md`
**Focus**: XP rewards, achievements, streak tracking, level progression
**Dependencies**: PRP 1-7

#### PRP 9: Comprehensive Testing Suite
**File**: `fitness-testing-comprehensive.md`
**Focus**: Unit, integration, E2E tests for all functionality
**Dependencies**: PRP 1-8

## Risk Assessment & Mitigation

### High Risk Items
1. **Database Performance**: Complex workout queries may impact performance
   - **Mitigation**: Proper indexing, query optimization, pagination
2. **Real-time Workout Tracking**: State management during active workouts
   - **Mitigation**: Local storage backup, offline capability consideration
3. **Data Migration**: Converting existing user data to new schema
   - **Mitigation**: Careful migration scripts, data validation

### Medium Risk Items
1. **User Experience Complexity**: Many features could overwhelm users
   - **Mitigation**: Progressive disclosure, guided onboarding
2. **Mobile Performance**: Rich workout interfaces on mobile devices
   - **Mitigation**: Code splitting, lazy loading, mobile-first design

## Success Metrics

### Technical Metrics
- All API endpoints return < 500ms response times
- 95%+ test coverage across all components and API routes
- Zero database migration failures
- Mobile page load times < 3 seconds

### User Experience Metrics
- Users can create and execute workouts without mock data
- Copy operations work seamlessly for days, weeks, and exercises
- Real-time workout logging functions without data loss
- Progress tracking displays accurate historical data

### Business Metrics
- Complete feature parity with requirements specification
- No 404 errors on fitness module sub-routes
- Full integration with existing gamification system
- Successful deployment without breaking existing functionality

## Quality Assurance Requirements

### Testing Standards
- **Unit Tests**: 90%+ coverage for all components and utilities
- **Integration Tests**: All API endpoints with database operations
- **E2E Tests**: Complete user workflows from planning to execution
- **Performance Tests**: Load testing for concurrent workout tracking
- **Accessibility Tests**: WCAG 2.1 AA compliance verification

### Code Quality Standards
- TypeScript strict mode compliance
- ESLint/Prettier formatting consistency
- Comprehensive error handling and user feedback
- Mobile-responsive design validation
- Cross-browser compatibility testing

This PRD provides a comprehensive roadmap for implementing a complete fitness workout system that addresses all requirements while maintaining the existing application's architecture patterns and quality standards.

## Context for AI Implementation

### Key References
- **Database Patterns**: https://stackoverflow.com/questions/65974181/database-design-for-workout-tracking-app
- **Fitness Schema Design**: https://www.geeksforgeeks.org/how-to-design-a-database-for-health-and-fitness-tracking-applications/
- **React Fitness UI**: https://medium.com/building-a-workout-app-with-react-47e4af7074a6
- **TypeScript Best Practices**: https://www.telerik.com/blogs/react-design-patterns-best-practices

### Existing Patterns to Follow
- **API Structure**: `/src/app/api/v1/modules/work/route.ts`
- **Module Interface**: `/src/types/module.ts`
- **Component Base**: `/src/components/base/` README patterns
- **Testing Patterns**: `/src/test/` directory structure
- **Database Repositories**: Work module repository patterns

### Architecture Constraints  
- Must integrate with existing module system
- Follow TypeScript strict mode requirements
- Maintain mobile-first design principles
- Integrate with existing gamification system
- Support offline-first capabilities where possible

### Critical Success Factors
- Zero mock data - all functionality must be database-backed
- Complete copy operations for workout planning efficiency
- Real-time workout tracking without data loss
- Seamless integration with existing authentication and authorization
- Full test coverage to prevent regressions