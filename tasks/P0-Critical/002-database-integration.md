# P0-002: Database Integration

## Task Overview

**Priority**: P0 (Critical)  
**Status**: Partially Complete  
**Effort**: 3 Story Points  
**Sprint**: MVP Foundation  

## Description

Complete the database integration setup including Prisma configuration, connection pooling, error handling, and data validation. While the schema exists and basic Prisma setup is in place, several critical integration pieces are missing for production readiness.

## Dependencies

- ✅ Prisma schema defined
- ✅ Basic Prisma client setup
- ✅ SQLite database for development
- ❌ Production database configuration
- ❌ Connection pooling
- ❌ Error handling utilities
- ❌ Data validation layers

## Definition of Done

### Core Requirements
- [ ] Production-ready database configuration
- [ ] Connection pooling and optimization
- [ ] Comprehensive error handling
- [ ] Data validation and sanitization
- [ ] Database migration scripts
- [ ] Backup and recovery procedures
- [ ] Performance monitoring setup
- [ ] Transaction management utilities

### Technical Requirements
- [ ] Environment-specific database configs
- [ ] Connection retry logic
- [ ] Query optimization utilities
- [ ] Database seeding for development
- [ ] Schema validation in CI/CD
- [ ] Database logging and monitoring
- [ ] Connection leak prevention

### Testing Requirements
- [ ] Database integration tests
- [ ] Migration testing
- [ ] Performance benchmarking
- [ ] Error scenario testing
- [ ] Data integrity testing

### Documentation Requirements
- [ ] Database setup documentation
- [ ] Schema documentation
- [ ] Migration guide
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

## User Stories

### US-002.1: Reliable Database Connections
```
As a developer
I want reliable database connections with proper error handling
So that the application remains stable under load
```

**Acceptance Criteria:**
- Database connections are pooled and reused efficiently
- Automatic reconnection on connection failures
- Graceful degradation when database is unavailable
- Connection timeouts are properly configured
- Memory leaks from unclosed connections are prevented

### US-002.2: Data Integrity
```
As a system administrator
I want comprehensive data validation and constraints
So that invalid data never enters the database
```

**Acceptance Criteria:**
- All user inputs are validated before database operations
- Foreign key constraints are properly enforced
- Data type validation prevents corruption
- Unique constraints prevent duplicate data
- Cascading deletes work correctly for related data

### US-002.3: Development Experience
```
As a developer
I want easy database setup and seeding for development
So that I can quickly get the project running locally
```

**Acceptance Criteria:**
- Single command database setup for new developers
- Consistent seed data across development environments
- Easy migration between database versions
- Clear error messages for database issues
- Hot reloading works with database changes

## Current Implementation Status

### ✅ Completed Components
- Basic Prisma schema with all core models
- SQLite database setup for development
- Basic Prisma client configuration
- Initial migration files
- Core model relationships

### ❌ Missing Components
- Production database configuration (PostgreSQL/MySQL)
- Connection pooling setup
- Comprehensive error handling
- Data validation utilities
- Performance optimization
- Backup strategies

## Technical Implementation

### Database Configuration

#### Development vs Production
```typescript
// lib/prisma/config.ts
export const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return {
        provider: 'sqlite',
        url: 'file:./dev.db',
        pool: { max: 10, min: 2 }
      };
    case 'production':
      return {
        provider: 'postgresql',
        url: process.env.DATABASE_URL,
        pool: { max: 20, min: 5 },
        ssl: { rejectUnauthorized: false }
      };
    case 'test':
      return {
        provider: 'sqlite',
        url: 'file:./test.db',
        pool: { max: 5, min: 1 }
      };
  }
};
```

#### Connection Pooling
```typescript
// lib/prisma/client.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
```

### Error Handling Utilities

#### Database Error Handler
```typescript
// lib/prisma/error-handler.ts
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from '@prisma/client/runtime/library';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handlePrismaError = (error: unknown): DatabaseError => {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new DatabaseError('Unique constraint violation', 'DUPLICATE_ENTRY', 409);
      case 'P2025':
        return new DatabaseError('Record not found', 'NOT_FOUND', 404);
      case 'P2003':
        return new DatabaseError('Foreign key constraint violation', 'FOREIGN_KEY_ERROR', 400);
      default:
        return new DatabaseError(`Database error: ${error.message}`, error.code, 500);
    }
  }
  
  if (error instanceof PrismaClientUnknownRequestError) {
    return new DatabaseError('Unknown database error', 'UNKNOWN_ERROR', 500);
  }
  
  return new DatabaseError('Unexpected error', 'UNEXPECTED_ERROR', 500);
};
```

### Data Validation Layer

#### Validation Utilities
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const userCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  preferences: z.record(z.any()).optional(),
});

export const goalCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  targetDate: z.date().min(new Date(), 'Target date must be in the future').optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  moduleId: z.string().min(1, 'Module ID is required'),
});

// Validation middleware
export const validateInput = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new DatabaseError(
          `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
          'VALIDATION_ERROR',
          400
        );
      }
      throw error;
    }
  };
};
```

### Repository Pattern Implementation

#### Base Repository
```typescript
// lib/prisma/base-repository.ts
import { prisma } from './client';
import { handlePrismaError } from './error-handler';

export abstract class BaseRepository<T> {
  abstract model: any;

  async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findUnique({ where: { id } });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  async findMany(where?: any, orderBy?: any, take?: number, skip?: number): Promise<T[]> {
    try {
      return await this.model.findMany({ where, orderBy, take, skip });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  async create(data: any): Promise<T> {
    try {
      return await this.model.create({ data });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  async update(id: string, data: any): Promise<T> {
    try {
      return await this.model.update({ where: { id }, data });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<T> {
    try {
      return await this.model.delete({ where: { id } });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }
}
```

### Migration and Seeding

#### Enhanced Seed Script
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const hashedPassword = await hash('password123', 12);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      totalXp: 150,
      currentLevel: 2,
      streakCount: 5,
      preferences: {
        theme: 'light',
        notifications: true,
      },
    },
  });

  // Create modules
  const modules = await Promise.all([
    prisma.module.create({
      data: {
        id: 'fitness',
        name: 'Fitness Tracking',
        version: '1.0.0',
        isEnabled: true,
        isInstalled: true,
      },
    }),
    prisma.module.create({
      data: {
        id: 'learning',
        name: 'Learning Goals',
        version: '1.0.0',
        isEnabled: true,
        isInstalled: true,
      },
    }),
  ]);

  // Create sample goals
  const goals = await Promise.all([
    prisma.goal.create({
      data: {
        title: 'Run 5K daily',
        description: 'Build running endurance',
        difficulty: 'medium',
        priority: 'high',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: user.id,
        moduleId: modules[0].id,
      },
    }),
    prisma.goal.create({
      data: {
        title: 'Learn TypeScript',
        description: 'Complete TypeScript fundamentals course',
        difficulty: 'hard',
        priority: 'medium',
        userId: user.id,
        moduleId: modules[1].id,
      },
    }),
  ]);

  // Create sample progress
  await Promise.all(
    goals.map((goal) =>
      prisma.progress.create({
        data: {
          value: 25,
          maxValue: 100,
          xpEarned: 10,
          notes: 'Initial progress',
          userId: user.id,
          goalId: goal.id,
        },
      })
    )
  );

  console.log('✅ Database seeded successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

## Performance Optimization

### Query Optimization
- Use `select` to fetch only needed fields
- Implement pagination for large datasets
- Use database indexes for common queries
- Batch operations where possible

### Connection Management
- Configure connection pooling based on expected load
- Implement connection health checks
- Monitor connection usage metrics
- Set appropriate timeouts

### Caching Strategy
- Implement query result caching for static data
- Use database-level caching for frequently accessed data
- Cache expensive aggregation queries
- Implement cache invalidation strategies

## Testing Strategy

### Unit Tests
```typescript
// Example database test
describe('User Repository', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
    };
    
    const user = await userRepository.create(userData);
    
    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.createdAt).toBeInstanceOf(Date);
  });
});
```

### Integration Tests
- Test complete data flows
- Verify foreign key constraints
- Test transaction rollbacks
- Verify migration scripts

## Implementation Timeline

### Day 1-2: Core Setup (1 SP)
- [ ] Environment-specific database configuration
- [ ] Enhanced error handling utilities
- [ ] Basic repository pattern implementation

### Day 3-4: Validation & Utilities (1 SP)
- [ ] Data validation layer with Zod
- [ ] Transaction utilities
- [ ] Performance monitoring setup

### Day 5: Testing & Documentation (1 SP)
- [ ] Comprehensive database tests
- [ ] Performance benchmarking
- [ ] Documentation and examples

## Success Metrics

### Performance Metrics
- Database query response time < 100ms for simple queries
- Connection pool utilization < 80% under normal load
- Zero connection leaks in production
- Migration execution time < 30 seconds

### Reliability Metrics
- 99.9% database uptime
- Zero data corruption incidents
- 100% successful migration rate
- Error recovery within 30 seconds

## Risk Mitigation

### High Risk Items
- **Connection pool exhaustion** under high load
- **Data migration failures** during deployments
- **Performance degradation** with large datasets

### Mitigation Strategies
- Implement comprehensive connection monitoring
- Test migrations on production-like data volumes
- Set up database performance alerts
- Implement circuit breaker patterns for database access

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: MVP Foundation