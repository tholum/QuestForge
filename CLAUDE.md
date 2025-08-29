# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development & Build
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes Prisma generation)
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database (Prisma + SQLite)
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations in development
- `npm run db:push` - Push schema changes directly to database
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio for database management

### Testing (Vitest)
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage (requires 80% threshold)
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:unit` - Run unit tests only
- `npm run test:api` - Run API tests only
- `npm run test:db` - Run database tests only
- `npm run test:ci` - CI optimized test run with coverage

### Storybook
- `npm run storybook` - Start Storybook dev server on port 6006
- `npm run build-storybook` - Build Storybook for production

## Architecture Overview

This is a modular, gamified life management application built with Next.js 15, React 19, and TypeScript. The architecture follows a plugin-based system where different life areas (fitness, home projects, learning, etc.) are implemented as modules.

### Key Technologies
- **Frontend**: Next.js 15 App Router, React 19, TypeScript (strict mode)
- **UI**: shadcn/ui components with Tailwind CSS v4
- **Database**: SQLite with Prisma ORM (PostgreSQL/MySQL support planned)
- **Testing**: Vitest, React Testing Library, MSW for API mocking
- **Development**: Storybook for component development

### Module System Architecture

The core of the application is a module system where each module implements the `IModule` interface (`src/types/module.ts`). Modules are managed by `ModuleRegistry` (`src/modules/core/ModuleRegistry.ts`) and handle:

- **Lifecycle**: Installation, enabling/disabling, configuration
- **UI Components**: Dashboard widgets, mobile quick-add forms, desktop detail views, settings panels
- **Data Schema**: Prisma extensions for module-specific data
- **Gamification**: Achievements, points configuration, XP rewards
- **API Routes**: Module-specific API endpoints under `/api/v1/modules/`

### Database Schema

Uses PascalCase for table names and camelCase for fields:
- **Core Models**: `User`, `Goal`, `Progress`, `Achievement`, `UserAchievement`, `Module`
- **Gamification**: Built-in XP system, streak tracking, difficulty multipliers
- **Relations**: Goals belong to users and modules, with support for hierarchical sub-goals

### File Structure Patterns

- `src/components/base/` - Atomic components with full Storybook coverage
- `src/components/ui/` - shadcn/ui components
- `src/modules/` - Module implementations with core registry
- `src/lib/gamification/` - Points, achievements, XP management
- `src/app/api/v1/` - API routes following RESTful patterns
- `src/test/` - Test utilities, mocks, and setup files

## Development Standards

### Code Quality
- **TypeScript**: Strict mode enabled, avoid `any` types
- **Testing**: TDD approach with 80% coverage requirement across all metrics
- **Components**: Every base component requires Storybook stories and tests
- **API**: All routes need corresponding test files (`route.test.ts`)

### Testing Patterns
- Unit tests: `ComponentName.test.tsx` 
- Integration tests: `ComponentName.integration.test.tsx`
- API tests: `route.test.ts` in same directory as `route.ts`
- Use MSW for API mocking in tests
- Database tests use separate test database setup

### Naming Conventions
- **Components**: PascalCase (`GoalCard`, `ProgressChart`)
- **Hooks**: `use` prefix (`useGoalProgress`, `useModuleData`)
- **Types**: Interface prefix `I` for props (`IGoalCardProps`)
- **Database**: PascalCase tables, camelCase fields
- **API Routes**: `/api/v1/[resource]/[action]` pattern

### Mobile-First Design
- Primary interaction is mobile-focused
- Components in `src/components/mobile/` for mobile-specific features
- Desktop enhancements in `src/components/desktop/`
- Touch-friendly interactions and responsive design

## Key Implementation Notes

### Module Development
When creating new modules, follow the existing patterns in `src/modules/fitness/` or `src/modules/home/`. Each module must:
- Implement the full `IModule` interface
- Provide all required UI components (dashboard, mobile quick-add, desktop detail, settings)
- Define achievements and points configuration
- Include comprehensive tests and Storybook stories

### API Development
- All API routes follow `/api/v1/[resource]` pattern
- Use Prisma for database operations
- Include proper error handling and response formatting
- Write corresponding test files with MSW mocks

### Database Changes
- Always generate Prisma client after schema changes: `npm run db:generate`
- Use migrations for production: `npm run db:migrate`
- Test database operations in dedicated test files

### Gamification Integration
- XP system managed by `src/lib/gamification/XPManager.ts`
- Achievements handled by `src/lib/gamification/AchievementManager.ts`
- Each user action should award appropriate XP based on difficulty and streaks