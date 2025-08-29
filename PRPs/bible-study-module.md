# Project Requirements Plan (PRP): Bible Study Module

## Executive Summary

**Project**: Bible Study Module Implementation  
**Task Reference**: P1-103 (Bible Study Module)  
**Priority**: P1 (Core Feature)  
**Effort**: 5 Story Points  
**Confidence Score**: 8/10  

This PRP outlines the implementation of a comprehensive Bible study module that integrates seamlessly with the Goal Assistant's existing module architecture. The module will provide Bible reading plans, study session tracking, prayer journaling, and scripture bookmarking capabilities while leveraging the established goal management and gamification systems.

## Context Analysis

### Current Architecture Assessment

The Goal Assistant project employs a sophisticated module-based architecture where:

1. **Module System**: Each module implements the `IModule` interface (`src/types/module.ts`) providing standardized lifecycle management, UI components, data schema, API routes, gamification integration, and permissions
2. **Database Layer**: Uses Prisma ORM with SQLite (PascalCase tables, camelCase fields) with established patterns for User, Goal, Progress, Achievement models
3. **API Structure**: RESTful endpoints following `/api/v1/[resource]` pattern with comprehensive authentication, validation, and error handling
4. **Component Architecture**: Base components with Storybook integration, mobile-first design with desktop enhancements
5. **Gamification**: XP system, achievements, streak tracking integrated across all modules
6. **Testing Strategy**: TDD approach with 80% coverage requirement using Vitest, React Testing Library, and MSW

### External Integration Requirements

**Bible API Selection**: Based on research, the module will integrate with multiple Bible APIs:
- **Primary**: ESV API (https://api.esv.org/) - Free for non-commercial use, 5,000 queries/day, 500 verses per query
- **Secondary**: API.Bible (https://scripture.api.bible/) - Multiple versions, good for public domain texts
- **Fallback**: Free Use Bible API (https://github.com/wldeh/bible-api) - 300+ languages, no authentication required

## Technical Requirements

### Database Schema Extensions

The module requires extending the Prisma schema with Bible-specific models while maintaining the existing naming conventions:

```prisma
// Bible reading plans
model BibleReadingPlan {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  planType    String   // 'preset', 'custom'  
  presetId    String?  // Reference to preset plans
  startDate   DateTime
  endDate     DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  readings BibleReading[]

  @@index([userId, isActive])
  @@map("BibleReadingPlan")
}

// Daily reading assignments
model BibleReading {
  id                  String    @id @default(cuid())
  planId              String
  userId              String
  assignedDate        DateTime  @db.Date
  passages            Json      // Array of scripture references
  isCompleted         Boolean   @default(false)
  completedAt         DateTime?
  readingTimeMinutes  Int?
  notes               String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  plan BibleReadingPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  user User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([planId, assignedDate])
  @@index([userId, assignedDate])
  @@map("BibleReading")
}

// Study sessions
model StudySession {
  id               String    @id @default(cuid())
  userId           String
  goalId           String?   // Optional link to related goal
  title            String
  description      String?
  passages         Json?     // Array of scripture references
  durationMinutes  Int?
  studyDate        DateTime  @db.Date
  notes            String?   // Rich text content
  tags             Json?     // Array of tags
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal Goal? @relation(fields: [goalId], references: [id], onDelete: SetNull)

  @@index([userId, studyDate])
  @@index([goalId])
  @@map("StudySession")
}

// Prayer requests
model PrayerRequest {
  id                String    @id @default(cuid())
  userId            String
  title             String
  description       String?
  category          String    @default("personal") // 'personal', 'family', 'ministry', 'world'
  priority          String    @default("medium")   // 'low', 'medium', 'high', 'urgent'
  isPrivate         Boolean   @default(true)
  isAnswered        Boolean   @default(false)
  answeredAt        DateTime?
  answerDescription String?
  requestDate       DateTime  @db.Date
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isAnswered])
  @@index([userId, category])
  @@map("PrayerRequest")
}

// Scripture bookmarks
model ScriptureBookmark {
  id         String    @id @default(cuid())
  userId     String
  reference  String    // "Genesis 1:1", "John 3:16"
  version    String    @default("ESV") // Bible translation
  text       String?   // Cached verse text
  notes      String?
  highlights Json?     // Array of highlight objects
  tags       Json?     // Array of tags
  isPrivate  Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, reference])
  @@index([userId, version])
  @@map("ScriptureBookmark")
}

// Preset reading plans
model BibleReadingPlanPreset {
  id           String   @id @default(cuid())
  name         String
  description  String?
  durationDays Int
  planData     Json     // JSON with daily assignments
  category     String?  // 'chronological', 'canonical', 'topical'
  difficulty   String   @default("medium")
  isPopular    Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@index([isPopular, category])
  @@map("BibleReadingPlanPreset")
}
```

### Module Implementation

Following the established `IModule` interface pattern, the Bible module (`src/modules/bible/BibleModule.tsx`) will implement:

**Core Properties:**
- `id`: 'bible'
- `name`: 'Bible Study'  
- `version`: '1.0.0'
- `icon`: 'book-open'
- `color`: '#3B82F6' (blue theme)

**UI Components:**
- `BibleStudyDashboard`: Overview of reading plans, progress, recent studies, prayer requests
- `BibleMobileQuickAdd`: Quick forms for logging study sessions, prayer requests, bookmarks
- `BibleDesktopDetail`: Detailed Bible study interface with reading plan management
- `BibleSettings`: Module configuration (API preferences, reading plan defaults)

**Gamification Integration:**

```typescript
const bibleAchievements: Achievement[] = [
  {
    id: 'first_reading',
    name: 'First Steps in Faith',
    description: 'Complete your first Bible reading',
    icon: 'book-open',
    tier: 'bronze',
    conditions: { type: 'count', target: 1, field: 'readingsCompleted' },
    xpReward: 25
  },
  {
    id: 'week_consistent',
    name: 'Faithful Reader',
    description: 'Read for 7 consecutive days',
    icon: 'calendar',
    tier: 'silver',
    conditions: { type: 'streak', target: 7, field: 'readingStreak' },
    xpReward: 100
  },
  {
    id: 'chapter_master',
    name: 'Chapter Master',
    description: 'Complete 100 Bible readings',
    icon: 'trophy',
    tier: 'gold',
    conditions: { type: 'count', target: 100, field: 'totalReadings' },
    xpReward: 300
  },
  {
    id: 'prayer_warrior',
    name: 'Prayer Warrior',
    description: 'Log 50 prayer requests',
    icon: 'heart',
    tier: 'gold',
    conditions: { type: 'count', target: 50, field: 'prayerRequests' },
    xpReward: 250
  },
  {
    id: 'year_reader',
    name: 'Annual Scholar',
    description: 'Complete a one-year reading plan',
    icon: 'crown',
    tier: 'platinum',
    conditions: { type: 'completion', field: 'yearPlanCompleted' },
    xpReward: 1000
  }
];

const biblePointsConfig: PointsConfiguration = {
  actions: {
    complete_reading: {
      basePoints: 15,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a daily Bible reading'
    },
    log_study_session: {
      basePoints: 20,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Log a Bible study session'
    },
    add_prayer_request: {
      basePoints: 5,
      difficultyMultiplier: false,
      streakBonus: true,
      description: 'Add a prayer request'
    },
    bookmark_verse: {
      basePoints: 3,
      difficultyMultiplier: false,
      streakBonus: false,
      description: 'Bookmark a scripture verse'
    },
    answer_prayer: {
      basePoints: 10,
      difficultyMultiplier: false,
      streakBonus: false,
      description: 'Mark a prayer as answered'
    }
  },
  difficultyMultipliers: {
    easy: 1,
    medium: 1.25,
    hard: 1.5,
    expert: 2
  },
  streakBonusPercentage: 20 // Higher bonus to encourage daily reading
};
```

### API Implementation

**Base Route**: `/api/v1/modules/bible/route.ts`

Following the established API patterns with comprehensive CRUD operations:

```typescript
// GET /api/v1/modules/bible?type=dashboard
// Returns: reading plans, today's reading, progress stats, recent studies

// GET /api/v1/modules/bible?type=plans
// Returns: user's active reading plans with progress

// GET /api/v1/modules/bible?type=readings&date=2024-01-01
// Returns: reading assignments for specific date

// POST /api/v1/modules/bible
// Body: { type: 'reading-plan', name: 'My Plan', presetId?: 'one-year' }
// Creates: new reading plan for user

// POST /api/v1/modules/bible  
// Body: { type: 'study-session', title: 'Romans Study', passages: ['Romans 1:1-17'] }
// Creates: study session and updates related goal progress
```

**Bible API Service** (`src/modules/bible/services/BibleAPIService.ts`):

```typescript
interface BibleAPIService {
  getVerse(reference: string, version?: string): Promise<BibleVerse>
  getPassage(reference: string, version?: string): Promise<BiblePassage>
  searchVerses(query: string, version?: string): Promise<BibleVerse[]>
  getAvailableVersions(): Promise<BibleVersion[]}
}

// Implements fallback pattern: ESV API -> API.Bible -> Free Use Bible API
```

**Repository Layer** (`src/lib/prisma/repositories/bible-repository.ts`):
Extends `BaseRepository` pattern with Bible-specific operations:
- `getUserReadingPlans(userId: string)`
- `getDailyReadings(userId: string, date: string)`  
- `createStudySession(userId: string, data: StudySessionInput)`
- `getDashboardData(userId: string)`
- `getReadingProgress(userId: string, planId: string)`

### Component Implementation

**Key Components** (following existing patterns in `src/components/`):

1. **BibleStudyDashboard** (`src/modules/bible/components/BibleStudyDashboard.tsx`)
   - Today's reading card with progress indicator
   - Reading streak visualization  
   - Recent study sessions list
   - Active prayer requests summary
   - Quick action buttons

2. **ReadingPlanCreator** (`src/modules/bible/components/ReadingPlanCreator.tsx`)
   - Preset plan selection (One Year Bible, Chronological, etc.)
   - Custom plan creation with schedule builder
   - Start date selection and duration settings
   - Preview of generated reading schedule

3. **DailyReadingInterface** (`src/modules/bible/components/DailyReadingInterface.tsx`)
   - Scripture text display with formatting
   - Reading progress tracking
   - Note-taking capability with verse references
   - Reading completion workflow

4. **StudySessionLogger** (`src/modules/bible/components/StudySessionLogger.tsx`)
   - Study session form with duration tracking
   - Passage selection and notes
   - Tag management for organizing studies
   - Integration with related goals

5. **PrayerJournal** (`src/modules/bible/components/PrayerJournal.tsx`)
   - Prayer request management with categories
   - Answer tracking with dates
   - Privacy controls (private/shared)
   - Progress visualization

**Mobile Optimizations:**
- Touch-friendly reading interface with adjustable text size
- Swipe gestures for navigation between readings  
- Offline reading capability with cached content
- Quick-add buttons for common actions
- Pull-to-refresh for sync updates

### Integration Patterns

**Goal Management Integration:**
- Bible study goals automatically created when starting reading plans
- Progress updates trigger XP awards through existing `XPManager`
- Study sessions can be linked to specific spiritual growth goals
- Reading streak data integrates with overall user streak tracking

**Existing Component Reuse:**
- `Progress` component for reading plan completion
- `StatusBadge` for prayer request states (active/answered)
- `DataCard` for displaying study statistics
- `BaseTable` for study session history
- `NotificationToast` for reading reminders

## Implementation Plan

### Phase 1: Foundation Setup (Day 1-2)
1. **Database Migration**
   - Add Bible-specific models to Prisma schema
   - Create and run migration files
   - Seed database with popular reading plan presets

2. **Module Structure**
   - Create `/src/modules/bible/` directory structure
   - Implement base `BibleModule.tsx` with IModule interface
   - Set up Bible API service with fallback pattern

3. **Repository Layer**
   - Implement `BibleRepository` extending `BaseRepository`
   - Add validation schemas for Bible-specific operations
   - Create comprehensive database operation methods

### Phase 2: Core API Implementation (Day 3-4)
1. **API Routes**
   - Implement `/api/v1/modules/bible/route.ts` with full CRUD
   - Add Bible-specific endpoints following established patterns
   - Integrate authentication and error handling middleware

2. **External API Integration**
   - Implement ESV API client with rate limiting
   - Add API.Bible fallback integration
   - Create verse caching mechanism for performance

3. **Testing Foundation**
   - Set up MSW mocks for Bible API endpoints
   - Create comprehensive API route tests
   - Implement repository integration tests

### Phase 3: UI Components (Day 5-7)
1. **Core Dashboard Components**
   - `BibleStudyDashboard` with reading progress overview
   - `ReadingPlanCreator` with preset and custom options
   - `DailyReadingInterface` with scripture display

2. **Study Management**
   - `StudySessionLogger` with goal integration
   - `PrayerJournal` with request/answer tracking
   - `ScriptureBookmarks` with highlighting system

3. **Mobile Optimization**
   - Touch-friendly interfaces for all components
   - Swipe gestures and pull-to-refresh
   - Offline reading capability

### Phase 4: Integration & Testing (Day 8-9)
1. **Gamification Integration**
   - Achievement system implementation
   - XP rewards for Bible study activities
   - Streak tracking and bonus calculations

2. **Component Testing**
   - Storybook stories for all components
   - Unit tests with React Testing Library
   - Integration tests for complete workflows

3. **Goal System Integration**
   - Bible study goal creation workflows
   - Progress tracking with existing systems
   - Dashboard integration with main goals

### Phase 5: Polish & Documentation (Day 10)
1. **Performance Optimization**
   - API response caching
   - Component lazy loading
   - Database query optimization

2. **Error Handling**
   - Bible API failure graceful degradation
   - User feedback for sync issues
   - Comprehensive error boundary implementation

3. **Documentation**
   - Component documentation for Storybook
   - API endpoint documentation
   - User guide for Bible study features

## Validation Gates

All validation gates must pass before considering implementation complete:

### Code Quality Gates
```bash
# TypeScript compilation and linting
npm run lint
npx tsc --noEmit

# Code formatting
npm run format:check
```

### Testing Gates
```bash
# Unit tests with coverage requirement (80% minimum)
npm run test:coverage

# API integration tests  
npm run test:api

# Database operation tests
npm run test:db

# Component integration tests
npm run test:unit
```

### Build Validation
```bash
# Production build verification
npm run build
npm run start

# Storybook build verification
npm run build-storybook
```

### Database Integrity
```bash
# Migration verification
npm run db:migrate

# Schema validation
npm run db:generate

# Seed data verification
npm run db:seed
```

## Dependencies & Prerequisites

### Technical Dependencies
- **Completed**: P1-101 (Goal Management CRUD) - ✅
- **Completed**: P0-002 (Database Integration) - ✅
- **Pending**: P0-001 (Authentication System) - Required for user-specific data
- **Pending**: P2-201 (Gamification Integration) - Enhances but not blocks core functionality

### External Service Dependencies
- ESV API access (free tier: 5,000 queries/day)
- API.Bible registration for multi-version support
- Free Use Bible API as no-auth fallback

### Development Environment
- Node.js 18+ with npm/yarn
- SQLite for local development
- Prisma CLI for database operations
- Storybook for component development

## Risk Assessment & Mitigation

### High Risk Items
1. **Bible API Rate Limits**
   - *Risk*: Exceeding daily quotas during development/testing
   - *Mitigation*: Implement caching, use multiple API fallbacks, mock APIs for testing

2. **Copyright Compliance**
   - *Risk*: Unauthorized use of copyrighted Bible translations
   - *Mitigation*: Focus on public domain versions, implement proper attribution, document usage rights

### Medium Risk Items
1. **Database Migration Complexity**
   - *Risk*: Schema changes affecting existing functionality
   - *Mitigation*: Comprehensive testing, backup procedures, rollback plans

2. **Component Integration**
   - *Risk*: UI inconsistencies with existing design system
   - *Mitigation*: Follow established component patterns, thorough Storybook documentation

### Low Risk Items
1. **Performance Impact**
   - *Risk*: Bible text data causing slow load times
   - *Mitigation*: Pagination, lazy loading, text caching strategies

## Success Metrics

### Functional Requirements
- ✅ Bible reading plan creation with 100% success rate
- ✅ Daily reading assignment generation without errors
- ✅ Study session logging with goal integration
- ✅ Prayer request management with answer tracking
- ✅ Scripture bookmarking with search capability

### Performance Requirements  
- ✅ Bible API response time < 2 seconds
- ✅ Dashboard load time < 1 second
- ✅ Scripture search results < 3 seconds
- ✅ Component render time < 500ms

### Quality Requirements
- ✅ 80%+ test coverage across all metrics
- ✅ Zero TypeScript errors
- ✅ All Storybook stories documented
- ✅ Mobile responsiveness across all components
- ✅ Accessibility compliance (WCAG 2.1 AA)

### User Experience Requirements
- ✅ Reading plan completion rate > 60%
- ✅ Daily reading engagement > 70%
- ✅ Study session logging > 3/week average
- ✅ Mobile usability score > 90%

## Resource Allocation

### Estimated Effort Distribution
- **Phase 1 (Foundation)**: 1.5 story points
- **Phase 2 (API Implementation)**: 1.5 story points  
- **Phase 3 (UI Components)**: 1.5 story points
- **Phase 4 (Integration & Testing)**: 0.5 story points
- **Total Estimated**: 5 story points ✅

### Timeline
- **Total Duration**: 10 working days
- **Sprint Integration**: Fits within standard 2-week sprint cycle
- **Dependencies**: Can begin after P0-001 (Authentication) completion

### Technical Resources Required
- Full-stack developer with React/TypeScript experience
- Access to Bible API services (ESV, API.Bible)
- QA support for comprehensive testing
- UI/UX guidance for mobile optimization

---

## Appendix

### Referenced Documentation
- **Module System Architecture**: https://goalassistant.app/docs/modules
- **ESV API Documentation**: https://api.esv.org/docs/
- **API.Bible Documentation**: https://scripture.api.bible/
- **Prisma Schema Guide**: https://www.prisma.io/docs/concepts/components/prisma-schema
- **Next.js App Router**: https://nextjs.org/docs/app

### Code Examples Referenced
- **Fitness Module Implementation**: `/src/modules/fitness/FitnessModule.tsx`
- **Goal Repository Pattern**: `/src/lib/prisma/repositories/goal-repository.ts`  
- **API Route Structure**: `/src/app/api/v1/goals/route.ts`
- **Component Testing**: `/src/test/components/progress/`
- **Storybook Integration**: `/src/components/base/Button.stories.tsx`

### Development Commands Quick Reference
```bash
# Start development with all services
npm run dev

# Database operations
npm run db:generate && npm run db:migrate && npm run db:seed

# Run comprehensive tests
npm run test:coverage && npm run test:api && npm run test:db

# Build and verify
npm run build && npm run build-storybook

# Storybook development
npm run storybook
```

---

**Created**: 2024-08-29  
**Last Updated**: 2024-08-29  
**Version**: 1.0.0  
**Confidence Score**: 8/10

This PRP provides comprehensive guidance for implementing the Bible Study Module with high confidence in successful one-pass implementation using established patterns and thorough context documentation.