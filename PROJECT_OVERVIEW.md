# Goal & Life Assistant - Project Overview

## Vision
A comprehensive, modular, and gamified life management application designed for individuals with ADHD. The system helps track various life areas including fitness, home projects, learning goals, Bible study, and work projects with a mobile-first design approach.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS v4
- **Database**: SQLite (default), Prisma ORM (PostgreSQL/MySQL support planned)
- **Testing**: Vitest, Storybook
- **Development**: Test-driven development approach

## Core Principles
1. **Mobile-First Design**: Primary interaction through mobile devices
2. **Modular Architecture**: Extensible plugin system for different life areas
3. **Gamification**: Points, achievements, streaks to maintain engagement
4. **ADHD-Friendly**: Visual progress, quick entry, dopamine optimization
5. **Test-Driven**: Comprehensive testing for all components
6. **Accessibility**: Full WCAG compliance

## Architecture Overview

### Module System Architecture

Each module implements the `IModule` interface:

```typescript
interface IModule {
  id: string;                    // Unique identifier (e.g., 'fitness', 'home_projects')
  name: string;                   // Display name
  version: string;                // Semantic versioning
  icon: string;                   // Icon component name
  color: string;                  // Theme color for module
  
  // Lifecycle hooks
  onInstall(): Promise<void>;
  onUninstall(): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
  
  // UI Components
  components: {
    dashboard: React.Component;   // Main dashboard widget
    mobileQuickAdd: React.Component; // Mobile quick-add form
    desktopDetail: React.Component;  // Desktop detailed view
    settings: React.Component;     // Module settings panel
  };
  
  // Data hooks
  dataSchema: ModuleSchema;       // Prisma schema extension
  apiRoutes: ModuleAPIRoutes;     // API route definitions
  
  // Gamification hooks
  achievements: Achievement[];
  pointsConfig: PointsConfiguration;
  
  // Permissions & capabilities
  permissions: string[];
  capabilities: ModuleCapability[];
}
```

### Database Schema & Naming Conventions

#### Naming Standards
- **Tables**: PascalCase singular (e.g., `User`, `Goal`, `Achievement`)
- **Fields**: camelCase (e.g., `createdAt`, `isCompleted`, `targetDate`)
- **Relations**: camelCase with descriptive names (e.g., `parentGoal`, `assignedUser`)
- **Indexes**: idx_tablename_field(s) (e.g., `idx_goal_userid_status`)
- **Constraints**: fk_childtable_parenttable (e.g., `fk_goal_user`)

#### Core Models
- **User**: Authentication, gamification data, preferences
- **Module**: Module registry and configuration
- **Goal**: Core goal entity with polymorphic module data
- **Progress**: Progress tracking with XP calculation
- **Achievement**: Gamification achievements
- **UserAchievement**: User-specific achievement tracking

### UI Component Architecture

#### Component Naming Conventions
- **Components**: PascalCase (e.g., `GoalCard`, `ProgressChart`)
- **Props interfaces**: I{ComponentName}Props (e.g., `IGoalCardProps`)
- **Hooks**: use{HookName} (e.g., `useGoalProgress`, `useModuleData`)
- **Utilities**: camelCase (e.g., `formatDate`, `calculateXp`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_GOALS_PER_PAGE`)

#### Base Components
All base components include:
- Comprehensive Storybook stories with all knobs
- Full test coverage (unit, integration, accessibility)
- Mobile-responsive design
- TypeScript interfaces
- Accessibility compliance

### API Structure

#### Route Patterns
- **Pattern**: `/api/[version]/[resource]/[action]`
- **Examples**:
  - `/api/v1/goals` - List/create goals
  - `/api/v1/goals/[id]` - Get/update/delete specific goal
  - `/api/v1/modules/fitness/workouts` - Module-specific endpoints
  - `/api/v1/user/achievements` - User-specific resources

#### Response Format
Consistent API response structure with success/error states and metadata.

### Gamification System

#### Points & XP System
- Action-based point earning (create goal: 5xp, complete task: 10xp, etc.)
- Difficulty multipliers (easy: 1x, medium: 1.5x, hard: 2x, expert: 3x)
- Streak bonuses (10% per consecutive day)
- Progressive level system with rewards

#### Achievement System
- Module-specific achievements
- Tiered achievements (bronze, silver, gold, platinum)
- Unlock-based progression system

## File Structure

```
src/
├── components/
│   ├── ui/                 # shadcn components
│   ├── base/              # Atomic components (BaseTable, Button, etc.)
│   ├── mobile/            # Mobile-specific components
│   ├── desktop/           # Desktop-specific components
│   └── layout/            # Layout components
├── modules/
│   ├── core/              # Base module interface and registry
│   ├── fitness/           # Fitness tracking module
│   ├── home/              # Home project management module
│   ├── learning/          # Learning goals module
│   ├── bible/             # Bible study module
│   └── work/              # Work project management module
├── lib/
│   ├── prisma/            # Database schema and client
│   ├── gamification/      # Points, achievements, level system
│   ├── api/               # API utilities and middleware
│   └── utils/             # Helper functions
├── app/
│   ├── api/               # API routes
│   │   └── v1/            # Version 1 API endpoints
│   ├── mobile/            # Mobile-optimized pages
│   ├── desktop/           # Desktop-optimized pages
│   └── globals.css        # Global styles
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts for state management
├── types/                 # TypeScript type definitions
├── stories/               # Storybook stories
└── tests/
    ├── __mocks__/         # Test mocks
    ├── fixtures/          # Test data fixtures
    └── utils/             # Test utilities
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. Database setup with Prisma and SQLite
2. shadcn/ui installation and configuration
3. Testing infrastructure with Vitest
4. Base component library with Storybook

### Phase 2: Module System
1. Module interface and registry implementation
2. API route structure
3. State management setup
4. Core gamification system

### Phase 3: Base Modules
1. Fitness module (reference implementation)
2. Home projects module
3. Learning goals module
4. Bible study module
5. Work projects module

### Phase 4: Mobile & Desktop UI
1. Mobile-first responsive design
2. Touch gestures and interactions
3. Desktop enhanced features
4. Progressive Web App setup

### Phase 5: Advanced Features
1. Offline support
2. Data export/import
3. Advanced analytics
4. Social features (optional)

## Quality Standards

### Testing Requirements
- **Unit Tests**: All utilities, hooks, and pure functions
- **Component Tests**: All React components with Storybook interactions
- **Integration Tests**: API routes and database operations
- **E2E Tests**: Critical user flows
- **Accessibility Tests**: WCAG compliance verification

### Performance Standards
- **Mobile**: < 3s initial load, < 1s navigation
- **Desktop**: < 2s initial load, < 500ms navigation
- **Bundle Size**: < 500kb initial, progressive loading
- **Accessibility**: WCAG 2.1 AA compliance

### Code Quality Standards
- **TypeScript**: Strict mode, no any types
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Test Coverage**: > 80% for all modules
- **Storybook**: All components documented with examples

## Development Workflow

1. **Feature Planning**: Create detailed specifications
2. **Test Writing**: Write tests before implementation (TDD)
3. **Component Development**: Implement with Storybook stories
4. **Integration**: Connect components with data layer
5. **Testing**: Verify functionality and accessibility
6. **Documentation**: Update stories and documentation
7. **Code Review**: Peer review before merge

## Security Considerations

- Input validation on all user inputs
- SQL injection prevention with Prisma
- Authentication and authorization
- Rate limiting on API endpoints
- Data privacy compliance
- Secure handling of sensitive data

## Deployment & DevOps

- **Environment**: Vercel for hosting
- **Database**: Railway/PlanetScale for production database
- **CI/CD**: GitHub Actions for testing and deployment
- **Monitoring**: Error tracking and performance monitoring
- **Backup**: Automated database backups

## Future Enhancements

- **AI Integration**: Smart goal suggestions and insights
- **Social Features**: Goal sharing and accountability partners
- **Advanced Analytics**: Detailed progress analytics
- **Third-party Integrations**: Calendar, fitness trackers, etc.
- **Multi-language Support**: Internationalization
- **Team Features**: Shared goals and team challenges

---

*This document serves as the master reference for the Goal & Life Assistant project. All implementation decisions should align with the principles and standards outlined here.*