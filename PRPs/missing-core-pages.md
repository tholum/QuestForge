# PRP: Missing Core Pages Implementation

## Overview

This PRP details the implementation of 7 missing core pages essential for the Goal Assistant application's complete functionality. Based on the navigation structure already defined in the codebase, these pages provide comprehensive user management, analytics, achievements, and module configuration capabilities.

## Context and Research Findings

### Current Architecture Analysis

The application follows a modular architecture with:
- **Frontend**: Next.js 15 App Router, React 19, TypeScript (strict mode)
- **UI**: shadcn/ui components with Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Testing**: Vitest, React Testing Library, MSW for API mocking
- **Development**: Storybook for component development

### Navigation Structure Evidence
From `/src/components/layout/DesktopSidebar.tsx` and `/src/components/layout/MobileNavigation.tsx`:
- Main navigation defines: dashboard, goals, **progress**, **analytics**, **calendar**
- Bottom navigation includes: **achievements**, **settings**
- Module context navigation expects **modules** overview page
- User profile areas expect **profile** page

### Existing Patterns to Follow
- Page components in `/src/app/[page]/page.tsx` pattern
- Component logic in `/src/components/pages/[Page].tsx`
- API routes in `/src/app/api/v1/[resource]/route.ts`
- Database operations via Prisma client
- Hook patterns in `/src/hooks/use[Resource].ts`
- Testing with `[Component].test.tsx` and Storybook stories

## Technical Requirements

### Database Schema Extensions

The existing schema in `/prisma/schema.prisma` needs extensions:

```sql
-- User settings and preferences
CREATE TABLE UserSetting (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  category TEXT NOT NULL, -- 'notification', 'privacy', 'display', 'account'
  settingKey TEXT NOT NULL,
  settingValue TEXT NOT NULL,
  dataType TEXT DEFAULT 'string', -- 'string', 'boolean', 'number', 'json'
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, category, settingKey)
);

-- Module configurations per user
CREATE TABLE UserModuleConfig (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  moduleId TEXT NOT NULL,
  isEnabled BOOLEAN DEFAULT true,
  configuration TEXT, -- JSON config specific to module
  lastUsedAt DATETIME,
  usageCount INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, moduleId)
);

-- Analytics cache for performance
CREATE TABLE AnalyticsCache (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  cacheKey TEXT NOT NULL, -- 'weekly_summary', 'monthly_trends', etc.
  data TEXT NOT NULL, -- JSON cached data
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, cacheKey)
);

-- Calendar events (for goals and deadlines)
CREATE TABLE CalendarEvent (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT,
  title TEXT NOT NULL,
  description TEXT,
  eventType TEXT NOT NULL, -- 'goal_deadline', 'milestone', 'reminder', 'custom'
  startDate DATETIME NOT NULL,
  endDate DATETIME,
  isAllDay BOOLEAN DEFAULT false,
  color TEXT, -- Hex color for display
  isCompleted BOOLEAN DEFAULT false,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (goalId) REFERENCES Goal(id)
);

-- User profile enhancements
ALTER TABLE User ADD COLUMN profilePicture TEXT;
ALTER TABLE User ADD COLUMN bio TEXT;
ALTER TABLE User ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE User ADD COLUMN locale TEXT DEFAULT 'en-US';
ALTER TABLE User ADD COLUMN onboardingCompleted BOOLEAN DEFAULT false;
ALTER TABLE User ADD COLUMN lastActiveAt DATETIME;
```

### Required API Endpoints

Following the `/api/v1/` pattern established in the codebase:

1. **Settings API** (`/api/v1/settings`)
   - GET: Retrieve user settings by category
   - PUT: Update user settings with validation

2. **Analytics API** (`/api/v1/analytics`)
   - GET: Generate analytics with caching
   - Supports query params: period, module

3. **User Profile API** (`/api/v1/users/profile`)
   - GET: User profile with stats
   - PATCH: Update profile information

4. **Achievements API** (`/api/v1/achievements`)
   - GET: User achievements and progress
   - POST: Check/unlock achievements

5. **Calendar API** (`/api/v1/calendar`)
   - GET: Calendar events for date range
   - POST: Create calendar events
   - PATCH: Update/complete events

6. **Modules Management API** (`/api/v1/modules/config`)
   - GET: User module configurations
   - PUT: Enable/disable modules

## Implementation Plan

### Task 1: Database Schema Extensions
**Files to modify:**
- `/prisma/schema.prisma` - Add new models and User table extensions
- Create migration with `npm run db:migrate`

**Validation:**
```bash
npm run db:generate && npm run db:migrate
```

### Task 2: API Routes Implementation
**Files to create:**
- `/src/app/api/v1/settings/route.ts`
- `/src/app/api/v1/analytics/route.ts`
- `/src/app/api/v1/users/profile/route.ts`
- `/src/app/api/v1/achievements/route.ts`
- `/src/app/api/v1/calendar/route.ts`
- `/src/app/api/v1/modules/config/route.ts`

**Pattern reference:** `/src/app/api/v1/goals/route.ts` for API structure

### Task 3: Custom Hooks for Data Management
**Files to create:**
- `/src/hooks/useSettings.ts`
- `/src/hooks/useAnalytics.ts`
- `/src/hooks/useProfile.ts`
- `/src/hooks/useAchievements.ts`
- `/src/hooks/useCalendar.ts`
- `/src/hooks/useModules.ts`

**Pattern reference:** `/src/hooks/useGoals.ts` for hook patterns

### Task 4: Page Components Implementation
**Files to create:**
- `/src/components/pages/SettingsPage.tsx`
- `/src/components/pages/ProfilePage.tsx`
- `/src/components/pages/AnalyticsPage.tsx`
- `/src/components/pages/AchievementsPage.tsx`
- `/src/components/pages/CalendarPage.tsx`
- `/src/components/pages/ModulesPage.tsx`
- `/src/components/pages/ProgressPage.tsx`

**Pattern reference:** `/src/components/pages/GoalsPage.tsx` for structure

### Task 5: Next.js App Router Pages
**Files to create:**
- `/src/app/settings/page.tsx`
- `/src/app/profile/page.tsx`
- `/src/app/analytics/page.tsx`
- `/src/app/achievements/page.tsx`
- `/src/app/calendar/page.tsx`
- `/src/app/modules/page.tsx`
- `/src/app/progress/page.tsx`

**Pattern reference:** `/src/app/goals/page.tsx` for wrapper pattern

### Task 6: Supporting Components
**Files to create (following base component patterns):**
- `/src/components/settings/SettingsForm.tsx`
- `/src/components/analytics/AnalyticsChart.tsx`
- `/src/components/analytics/MetricsCard.tsx`
- `/src/components/achievements/AchievementCard.tsx`
- `/src/components/calendar/CalendarView.tsx`
- `/src/components/modules/ModuleCard.tsx`
- `/src/components/profile/ProfileStats.tsx`

### Task 7: Testing Implementation
**Test files to create:**
- API tests: `route.test.ts` files for each API endpoint
- Component tests: `.test.tsx` files for all components
- Hook tests: `.test.ts` files for all hooks
- Integration tests for complete page workflows

**Pattern reference:** Existing test files in `/src/components/goals/` and `/src/test/`

### Task 8: Storybook Stories
**Story files to create:**
- `.stories.tsx` files for all new base components
- Following pattern from `/src/components/base/DataCard.stories.tsx`

## Key Components Detail

### Settings Page Architecture
```typescript
// Tabbed interface with categories:
// - Profile (name, email, bio, timezone, locale)
// - Notifications (email, push, weekly summary)
// - Privacy (profile visibility, analytics sharing)
// - Display (theme, density, animations)
```

### Analytics Dashboard Features
```typescript
// Chart library: Recharts (already compatible with React 19)
// Metrics: Goal completion, time investment, streaks, achievements
// Filtering: By module, time period (week/month/quarter/year)
// Export: CSV/JSON data export functionality
```

### Calendar View Implementation
```typescript
// Views: Monthly, weekly, daily
// Integration: Goal deadlines, milestones, custom events
// Interactions: Drag-and-drop rescheduling, quick add
// Mobile: Touch-friendly, responsive design
```

## External Dependencies

### Chart Library Integration
**Recharts** (React 19 compatible):
```bash
npm install recharts date-fns
```

**Documentation:** https://recharts.org/en-US/
**Pattern:** Use ResponsiveContainer with "use client" directive for Next.js 15

### Calendar Library
**React Big Calendar** or build custom with date-fns:
```bash
npm install react-big-calendar date-fns
```

## Mobile-First Considerations

### Touch Interactions
- Large touch targets (minimum 44px)
- Swipe gestures for navigation
- Pull-to-refresh where appropriate
- Touch-friendly form controls

### Responsive Design
- Settings: Stacked tabs on mobile, horizontal on desktop
- Analytics: Simplified charts on mobile, detailed on desktop
- Calendar: Month view optimized for small screens
- Navigation: Follows existing mobile navigation patterns

## Error Handling and Loading States

### API Error Handling
```typescript
// Follow pattern from existing API routes
// Use standard HTTP status codes
// Consistent error response format
// Client-side error boundaries
```

### Loading States
```typescript
// Skeleton components for data loading
// Progressive enhancement
// Optimistic updates where appropriate
// Spinner components for actions
```

## Performance Optimizations

### Analytics Caching
- Database-level caching with expiration
- Client-side query caching via React Query patterns
- Lazy loading of heavy chart components

### Calendar Optimization
- Virtual scrolling for large date ranges
- Event data pagination
- Efficient date calculations

## Implementation Priority Order

1. **Database Schema Extensions** (Prerequisite for all others)
2. **Settings Page** (Foundational user preferences)
3. **Profile Page** (User information display)
4. **Modules Page** (Module management functionality)
5. **Analytics Page** (Data visualization, complex)
6. **Progress Page** (Goal progress tracking)
7. **Achievements Page** (Gamification display)
8. **Calendar Page** (Most complex, scheduling integration)

## Validation Gates

### Functional Testing
```bash
# Run all tests including new ones
npm run test:ci

# Check TypeScript compilation
npm run build

# Database operations
npm run db:generate && npm run db:push
```

### Code Quality
```bash
# Linting and formatting
npm run lint

# Type checking
npx tsc --noEmit
```

### Visual Testing
```bash
# Storybook build and test
npm run build-storybook
npm run test-storybook
```

## Success Metrics

### Functional Requirements
- [ ] All 7 pages accessible via navigation
- [ ] Settings save and persist correctly
- [ ] Analytics display accurate data
- [ ] Calendar integrates with goals
- [ ] Profile shows user statistics
- [ ] Modules can be enabled/disabled
- [ ] Progress tracking functions properly
- [ ] Achievements display correctly

### Performance Requirements
- [ ] Page load times < 2 seconds
- [ ] Analytics charts render < 1 second
- [ ] Settings save response < 500ms
- [ ] Mobile scroll performance 60fps
- [ ] Calendar navigation smooth on mobile

### Accessibility Requirements
- [ ] All pages pass WCAG 2.1 AA standards
- [ ] Keyboard navigation fully functional
- [ ] Screen reader compatibility
- [ ] Focus management between pages
- [ ] High contrast mode support

## Dependencies and Prerequisites

### Required for Implementation
- ✅ Authentication system (implemented)
- ✅ Database integration (implemented)
- ✅ Goal management system (implemented)
- ✅ Component library (shadcn/ui)
- ✅ Testing framework (Vitest)

### Optional Enhancements
- Gamification integration (P2-201) - enhances achievements page
- Calendar sync with external services - enhances calendar page
- Real-time notifications - enhances settings effectiveness

## Risk Assessment

### Technical Risks
- **Medium Risk:** Analytics performance with large datasets
  - **Mitigation:** Implement caching and pagination
- **Low Risk:** Calendar complexity on mobile
  - **Mitigation:** Start with basic monthly view, iterate

### Development Risks  
- **Low Risk:** Component library compatibility
  - **Mitigation:** All components use established shadcn/ui patterns
- **Medium Risk:** Database migration in production
  - **Mitigation:** Careful migration planning and testing

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Justification:**
- All architectural patterns already established in codebase
- Database schema well-defined with clear extension points
- Component patterns consistent and documented
- Testing framework in place with clear patterns
- Navigation structure already anticipates these pages
- Modern tech stack (Next.js 15, React 19) with stable patterns
- Comprehensive documentation and validation gates provided

The only uncertainty is the analytics chart performance optimization, but this is addressable with the provided caching strategy and library recommendations.

---

**Created:** 2025-08-29  
**Technology Stack:** Next.js 15, React 19, TypeScript, shadcn/ui, Tailwind v4, Prisma, SQLite  
**Estimated Effort:** 8-10 development days  
**Prerequisites:** Database migration capability, Recharts installation