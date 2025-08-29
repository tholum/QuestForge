# API-G: Goals API Implementation

## Task Overview

**Priority**: API Task  
**Status**: Partially Complete  
**Effort**: 5 Story Points  
**Sprint**: API Development  

## Description

Complete the implementation of RESTful API endpoints for goal management, including advanced features like filtering, sorting, bulk operations, and comprehensive error handling. While basic CRUD structure exists, many advanced features and proper error handling are missing.

## Dependencies

- ✅ P0-002: Database Integration (Goal model exists)
- ✅ Basic API route structure
- ❌ P0-001: Authentication System (for user-specific operations)
- ❌ Comprehensive error handling
- ❌ Input validation schemas

## Definition of Done

### Core API Endpoints
- [ ] `GET /api/v1/goals` - List goals with filtering/sorting
- [ ] `POST /api/v1/goals` - Create new goal
- [ ] `GET /api/v1/goals/[id]` - Get specific goal
- [ ] `PUT /api/v1/goals/[id]` - Update goal
- [ ] `DELETE /api/v1/goals/[id]` - Delete goal
- [ ] `PATCH /api/v1/goals/[id]/status` - Update goal status

### Advanced Features
- [ ] Bulk operations endpoint (`POST /api/v1/goals/bulk`)
- [ ] Goal search endpoint (`GET /api/v1/goals/search`)
- [ ] Goal templates endpoint (`GET /api/v1/goals/templates`)
- [ ] Goal export endpoint (`GET /api/v1/goals/export`)
- [ ] Goal statistics endpoint (`GET /api/v1/goals/stats`)

### Quality Features
- [ ] Comprehensive input validation
- [ ] Proper HTTP status codes
- [ ] Consistent error response format
- [ ] Rate limiting implementation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Request/response logging
- [ ] Performance optimization

## API Specifications

### Goal List Endpoint

#### GET /api/v1/goals

**Query Parameters:**
```typescript
interface GoalListParams {
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
  filter?: 'all' | 'active' | 'completed' | 'paused';
  moduleId?: string;       // Filter by specific module
  search?: string;         // Search in title and description
  sort?: 'createdAt' | 'updatedAt' | 'targetDate' | 'priority';
  order?: 'asc' | 'desc';  // Default: desc
  include?: string[];      // Related data to include (progress, module, subgoals)
}
```

**Response:**
```typescript
interface GoalListResponse {
  success: boolean;
  data: Goal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    applied: Record<string, any>;
    available: {
      modules: Array<{ id: string; name: string; count: number }>;
      statuses: Array<{ status: string; count: number }>;
    };
  };
}
```

**Implementation:**
```typescript
// src/app/api/v1/goals/route.ts
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = parseGoalListParams(searchParams);
    const validatedParams = validateInput(goalListParamsSchema)(params);
    
    // Build database query
    const query = await goalRepository.buildListQuery(userId, validatedParams);
    
    // Execute query with performance optimization
    const [goals, total] = await Promise.all([
      goalRepository.findMany(query),
      goalRepository.count(query.where),
    ]);
    
    // Build response with pagination
    const pagination = buildPaginationMeta(
      validatedParams.page,
      validatedParams.limit,
      total
    );
    
    // Get available filters
    const filters = await goalRepository.getAvailableFilters(userId);
    
    return NextResponse.json({
      success: true,
      data: goals,
      pagination,
      filters: {
        applied: validatedParams,
        available: filters,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Goal Creation Endpoint

#### POST /api/v1/goals

**Request Body:**
```typescript
interface CreateGoalRequest {
  title: string;
  description?: string;
  moduleId: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetDate?: string; // ISO date string
  parentGoalId?: string;
  moduleData?: Record<string, any>;
  tags?: string[];
}
```

**Response:**
```typescript
interface CreateGoalResponse {
  success: boolean;
  data: Goal;
  gamification?: {
    xpEarned: number;
    newAchievements: Achievement[];
    levelUp?: LevelUp;
  };
}
```

**Implementation:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    // Validate input
    const validatedData = validateInput(goalCreateSchema)(body);
    
    // Check module permissions and constraints
    await moduleService.validateModuleAccess(userId, validatedData.moduleId);
    await goalService.validateGoalLimits(userId, validatedData.moduleId);
    
    // Create goal with transaction
    const result = await prisma.$transaction(async (tx) => {
      const goal = await goalRepository.create(
        { ...validatedData, userId },
        { tx }
      );
      
      // Initialize progress tracking if needed
      if (shouldInitializeProgress(validatedData.moduleId)) {
        await progressRepository.initializeForGoal(goal.id, { tx });
      }
      
      // Process gamification
      const gamificationResult = await gamificationService.processGoalCreation(
        userId,
        goal,
        { tx }
      );
      
      return { goal, gamificationResult };
    });
    
    // Send notifications if configured
    await notificationService.sendGoalCreated(userId, result.goal);
    
    return NextResponse.json({
      success: true,
      data: result.goal,
      gamification: result.gamificationResult,
    }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Bulk Operations Endpoint

#### POST /api/v1/goals/bulk

**Request Body:**
```typescript
interface BulkGoalRequest {
  action: 'delete' | 'complete' | 'pause' | 'activate' | 'update';
  goalIds: string[];
  data?: Partial<Goal>; // For update operations
  options?: {
    sendNotifications?: boolean;
    skipValidation?: boolean;
  };
}
```

**Implementation:**
```typescript
// src/app/api/v1/goals/bulk/route.ts
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(bulkGoalSchema)(body);
    
    // Verify ownership of all goals
    const ownedGoals = await goalRepository.verifyOwnership(
      userId,
      validatedData.goalIds
    );
    
    if (ownedGoals.length !== validatedData.goalIds.length) {
      return NextResponse.json({
        success: false,
        error: 'Some goals not found or not owned by user',
      }, { status: 403 });
    }
    
    // Execute bulk operation
    const results = await bulkGoalService.executeBulkOperation(
      userId,
      validatedData
    );
    
    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        results,
        errors: results.filter(r => !r.success),
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Goal Statistics Endpoint

#### GET /api/v1/goals/stats

**Response:**
```typescript
interface GoalStatsResponse {
  success: boolean;
  data: {
    total: number;
    byStatus: {
      active: number;
      completed: number;
      paused: number;
    };
    byModule: Array<{
      moduleId: string;
      moduleName: string;
      count: number;
      completionRate: number;
    }>;
    byDifficulty: {
      easy: number;
      medium: number;
      hard: number;
      expert: number;
    };
    byPriority: {
      low: number;
      medium: number;
      high: number;
      urgent: number;
    };
    trends: {
      thisWeek: number;
      lastWeek: number;
      thisMonth: number;
      lastMonth: number;
      completionRate: number;
      averageTimeToComplete: number; // in days
    };
    streaks: {
      current: number;
      longest: number;
      lastActivity: string;
    };
  };
}
```

## Error Handling

### Comprehensive Error Handler
```typescript
// src/lib/api/error-handler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    }, { status: error.statusCode });
  }
  
  if (error instanceof DatabaseError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
    }, { status: error.statusCode });
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors,
    }, { status: 400 });
  }
  
  // Generic error
  return NextResponse.json({
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  }, { status: 500 });
}
```

### Input Validation Schemas
```typescript
// src/lib/validation/goal-schemas.ts
import { z } from 'zod';

export const goalCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  moduleId: z.string()
    .min(1, 'Module ID is required'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  targetDate: z.string()
    .datetime()
    .optional()
    .transform((date) => date ? new Date(date) : undefined),
  parentGoalId: z.string().optional(),
  moduleData: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const goalUpdateSchema = goalCreateSchema.partial();

export const goalListParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  filter: z.enum(['all', 'active', 'completed', 'paused']).default('all'),
  moduleId: z.string().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'targetDate', 'priority']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  include: z.array(z.enum(['progress', 'module', 'subgoals'])).default([]),
});

export const bulkGoalSchema = z.object({
  action: z.enum(['delete', 'complete', 'pause', 'activate', 'update']),
  goalIds: z.array(z.string()).min(1).max(50),
  data: goalUpdateSchema.optional(),
  options: z.object({
    sendNotifications: z.boolean().default(true),
    skipValidation: z.boolean().default(false),
  }).optional(),
});
```

## Rate Limiting

### Implementation
```typescript
// src/middleware/rate-limit.ts
import { NextRequest } from 'next/server';

const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimits.get(key);
  
  if (!current || current.resetTime < now) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

export async function applyRateLimit(
  request: NextRequest,
  limit: number = 100
): Promise<boolean> {
  const ip = request.ip || 'unknown';
  const userId = await getCurrentUserId(request).catch(() => null);
  const identifier = userId || ip;
  
  return rateLimit(identifier, limit);
}
```

## API Documentation

### OpenAPI Schema Generation
```typescript
// src/lib/api/openapi.ts
export const goalAPISchema = {
  paths: {
    '/api/v1/goals': {
      get: {
        summary: 'List user goals',
        tags: ['Goals'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          // ... other parameters
        ],
        responses: {
          200: {
            description: 'Goals retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GoalListResponse' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create new goal',
        tags: ['Goals'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateGoalRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Goal created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateGoalResponse' },
              },
            },
          },
        },
      },
    },
  },
};
```

## Performance Optimization

### Database Query Optimization
```typescript
// Efficient goal listing with proper indexing
const optimizedGoalQuery = {
  where: {
    userId,
    ...(filter !== 'all' && { 
      isCompleted: filter === 'completed' 
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  },
  select: {
    id: true,
    title: true,
    description: true,
    isCompleted: true,
    priority: true,
    difficulty: true,
    targetDate: true,
    createdAt: true,
    updatedAt: true,
    module: {
      select: { id: true, name: true },
    },
    progress: {
      take: 1,
      orderBy: { recordedAt: 'desc' },
      select: { value: true, maxValue: true },
    },
    _count: {
      select: { subGoals: true },
    },
  },
  orderBy: { [sort]: order },
  skip: (page - 1) * limit,
  take: limit,
};
```

## Testing Strategy

### API Integration Tests
```typescript
// src/app/api/v1/goals/route.test.ts
describe('Goals API', () => {
  describe('GET /api/v1/goals', () => {
    it('should return user goals with pagination', async () => {
      const response = await testApiCall('GET', '/api/v1/goals?page=1&limit=10');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      });
    });

    it('should filter goals by module', async () => {
      const response = await testApiCall('GET', '/api/v1/goals?moduleId=fitness');
      
      expect(response.status).toBe(200);
      expect(response.body.data.every(goal => goal.moduleId === 'fitness')).toBe(true);
    });

    it('should handle search queries', async () => {
      const response = await testApiCall('GET', '/api/v1/goals?search=workout');
      
      expect(response.status).toBe(200);
      expect(response.body.data.some(goal => 
        goal.title.toLowerCase().includes('workout') ||
        goal.description?.toLowerCase().includes('workout')
      )).toBe(true);
    });
  });

  describe('POST /api/v1/goals', () => {
    it('should create goal with valid data', async () => {
      const goalData = {
        title: 'Test Goal',
        moduleId: 'fitness',
        difficulty: 'medium',
        priority: 'high',
      };

      const response = await testApiCall('POST', '/api/v1/goals', goalData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(goalData);
    });

    it('should validate required fields', async () => {
      const response = await testApiCall('POST', '/api/v1/goals', {});
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## Success Metrics

### Performance Metrics
- Goal list endpoint response time < 200ms
- Goal creation endpoint response time < 300ms
- Database query execution time < 50ms
- API uptime > 99.9%

### Quality Metrics
- API error rate < 1%
- Input validation coverage 100%
- API documentation coverage 100%
- Response time consistency (95th percentile < 500ms)

### Usage Metrics
- API adoption rate among frontend features
- Most used endpoint parameters
- Error distribution by endpoint
- Rate limit hit frequency

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: API Development