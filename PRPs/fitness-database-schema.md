# PRP 1: Fitness Database Schema & Migration Implementation

## Overview
Implement comprehensive database schema for fitness workout tracking system, replacing mock data with real database operations. This includes all necessary tables, relationships, indexes, and migration scripts.

## Research Context

### Database Design Best Practices
Based on research from StackOverflow fitness database design discussions and GeeksforGeeks fitness application database guides:

- **Keep tables narrow**: Don't add fields like `set1Reps`, `set2Reps` - use proper relational design
- **Performance optimization**: Cluster workouts by user, sort by date for better query performance  
- **Flexible schema**: Support variable sets, reps, weights, duration, and distance tracking
- **Exercise variety**: Support both strength training and cardio with different metrics

### Reference Implementation Patterns
- **Existing Schema**: `/home/tholum/projects/goalassistant/prisma/schema.prisma`
- **Naming Convention**: PascalCase for tables, camelCase for fields (follows existing User, Goal patterns)
- **Relations**: Proper foreign key constraints with cascade deletions
- **Indexing**: Strategic indexes for query performance

## Database Schema Implementation

### Core Tables

```prisma
// Add to existing schema.prisma

// Workout Plans - organize workouts into weekly/monthly programs
model WorkoutPlan {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  isTemplate  Boolean  @default(false)
  isActive    Boolean  @default(true)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workouts Workout[]

  @@index([userId, isActive])
  @@index([userId, startDate])
  @@map("WorkoutPlan")
}

// Individual Workouts - daily workout sessions
model Workout {
  id                String    @id @default(cuid())
  planId            String?   // Optional - can be standalone workouts
  userId            String
  name              String
  description       String?
  scheduledDate     DateTime?
  completedAt       DateTime?
  isTemplate        Boolean   @default(false)
  workoutType       String    // 'cardio', 'strength', 'flexibility', 'mixed'
  estimatedDuration Int?      // minutes
  actualDuration    Int?      // minutes
  notes             String?
  xpAwarded         Int       @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  plan         WorkoutPlan?     @relation(fields: [planId], references: [id], onDelete: SetNull)
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercises    WorkoutExercise[]
  personalRecords PersonalRecord[]

  @@index([userId, scheduledDate])
  @@index([userId, completedAt])
  @@index([planId])
  @@map("Workout")
}

// Exercise Templates - master list of exercises
model ExerciseTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String?
  category        String   // 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
  muscleGroups    Json     // Array of targeted muscle groups
  equipmentNeeded String?
  instructions    Json?    // Array of instruction steps
  videoUrl        String?
  imageUrl        String?
  isCustom        Boolean  @default(false)
  userId          String?  // null for system exercises, set for custom user exercises
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user             User?           @relation(fields: [userId], references: [id], onDelete: Cascade)
  workoutExercises WorkoutExercise[]
  personalRecords  PersonalRecord[]

  @@index([category, name])
  @@index([userId, isActive])
  @@index([name]) // For search functionality
  @@map("ExerciseTemplate")
}

// Junction table - exercises within workouts with specific targets
model WorkoutExercise {
  id               String   @id @default(cuid())
  workoutId        String
  exerciseId       String
  orderIndex       Int      // Order within workout (0, 1, 2, ...)
  targetSets       Int?
  targetReps       Int?
  targetWeight     Float?   // lbs or kg
  targetDuration   Int?     // seconds for time-based exercises
  targetDistance   Float?   // miles, km for cardio
  restBetweenSets  Int?     // seconds
  notes            String?
  completedAt      DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  workout   Workout          @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercise  ExerciseTemplate @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  sets      WorkoutSet[]

  @@unique([workoutId, orderIndex]) // Ensure proper ordering
  @@index([workoutId, orderIndex])
  @@map("WorkoutExercise")
}

// Individual sets within exercise - actual performance data
model WorkoutSet {
  id                String    @id @default(cuid())
  workoutExerciseId String
  setNumber         Int       // 1, 2, 3, etc.
  reps              Int?
  weight            Float?    // actual weight used
  duration          Int?      // actual seconds
  distance          Float?    // actual distance
  restAfter         Int?      // seconds of rest after this set
  rpe               Int?      // Rate of Perceived Exertion (1-10)
  notes             String?
  completedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  workoutExercise WorkoutExercise @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)

  @@unique([workoutExerciseId, setNumber])
  @@index([workoutExerciseId, setNumber])
  @@map("WorkoutSet")
}

// Track personal records and achievements
model PersonalRecord {
  id           String   @id @default(cuid())
  userId       String
  exerciseId   String
  recordType   String   // '1rm', '5rm', 'volume', 'duration', 'distance'
  value        Float
  unit         String   // 'lbs', 'kg', 'seconds', 'miles', 'km'
  previousValue Float?  // Previous record for comparison
  achievedAt   DateTime
  workoutId    String?  // Reference to workout where PR was achieved
  notes        String?
  createdAt    DateTime @default(now())

  // Relations
  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise ExerciseTemplate @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  workout  Workout?         @relation(fields: [workoutId], references: [id], onDelete: SetNull)

  @@unique([userId, exerciseId, recordType]) // One record per type per exercise per user
  @@index([userId, achievedAt])
  @@index([exerciseId, recordType])
  @@map("PersonalRecord")
}
```

### User Model Extensions

```prisma
// Add to existing User model:
model User {
  // ... existing fields ...
  
  // Fitness-specific relations
  workoutPlans     WorkoutPlan[]
  workouts         Workout[]
  exerciseTemplates ExerciseTemplate[]
  personalRecords  PersonalRecord[]
  
  // ... existing relations ...
}
```

## Migration Strategy

### Step 1: Schema Migration

```typescript
// Create migration file: prisma/migrations/xxx_add_fitness_schema.sql

-- Create WorkoutPlan table
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for WorkoutPlan
CREATE INDEX "WorkoutPlan_userId_isActive_idx" ON "WorkoutPlan"("userId", "isActive");
CREATE INDEX "WorkoutPlan_userId_startDate_idx" ON "WorkoutPlan"("userId", "startDate");

-- Continue for all tables...
```

### Step 2: Seed Data

```typescript
// Create seed file: prisma/seed-fitness.ts

const fitnessExercises = [
  // Chest exercises
  {
    name: "Bench Press",
    description: "Barbell bench press for chest development",
    category: "chest",
    muscleGroups: ["pectorals", "triceps", "anterior deltoids"],
    equipmentNeeded: "Barbell, bench",
    instructions: [
      "Lie on bench with feet flat on floor",
      "Grip barbell with hands wider than shoulders",
      "Lower bar to chest with control",
      "Press bar up to full arm extension"
    ]
  },
  {
    name: "Push-ups",
    description: "Bodyweight chest exercise",
    category: "chest", 
    muscleGroups: ["pectorals", "triceps", "core"],
    equipmentNeeded: "None",
    instructions: [
      "Start in plank position",
      "Lower body until chest nearly touches floor",
      "Push up to starting position"
    ]
  },
  // Back exercises
  {
    name: "Pull-ups",
    description: "Bodyweight back exercise",
    category: "back",
    muscleGroups: ["latissimus dorsi", "rhomboids", "biceps"],
    equipmentNeeded: "Pull-up bar",
    instructions: [
      "Hang from bar with overhand grip",
      "Pull body up until chin clears bar", 
      "Lower with control to full extension"
    ]
  },
  {
    name: "Deadlift",
    description: "Compound posterior chain exercise",
    category: "back",
    muscleGroups: ["erector spinae", "glutes", "hamstrings", "traps"],
    equipmentNeeded: "Barbell, plates",
    instructions: [
      "Stand with feet hip-width apart",
      "Hinge at hips and knees to grip bar",
      "Lift bar by extending hips and knees",
      "Stand tall then lower with control"
    ]
  },
  // Leg exercises
  {
    name: "Squats",
    description: "Compound leg exercise",
    category: "legs",
    muscleGroups: ["quadriceps", "glutes", "hamstrings"],
    equipmentNeeded: "Barbell (optional)",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Lower by bending knees and hips",
      "Go down until thighs parallel to floor",
      "Drive through heels to return to start"
    ]
  },
  // Cardio exercises
  {
    name: "Running",
    description: "Cardiovascular endurance exercise",
    category: "cardio",
    muscleGroups: ["legs", "cardiovascular system"],
    equipmentNeeded: "Running shoes",
    instructions: [
      "Start with 5-minute warm-up walk",
      "Maintain steady pace",
      "Focus on breathing rhythm",
      "Cool down with walking"
    ]
  }
  // ... more exercises for shoulders, arms, core
]

export async function seedFitnessData() {
  console.log('Seeding fitness exercise templates...')
  
  for (const exercise of fitnessExercises) {
    await prisma.exerciseTemplate.create({
      data: {
        ...exercise,
        isCustom: false,
        userId: null // System exercises
      }
    })
  }
  
  console.log(`Created ${fitnessExercises.length} exercise templates`)
}
```

## Implementation Tasks

### Task 1: Schema Definition
- [ ] Add fitness tables to `prisma/schema.prisma`
- [ ] Add relations to existing User model  
- [ ] Validate schema with `npx prisma validate`

### Task 2: Migration Creation
- [ ] Generate migration: `npx prisma migrate dev --name add-fitness-schema`
- [ ] Test migration on development database
- [ ] Verify all indexes are created properly

### Task 3: Seed Data Implementation  
- [ ] Create comprehensive exercise template seed data
- [ ] Include exercises for all major muscle groups
- [ ] Add cardio and flexibility exercises
- [ ] Test seed script: `npx prisma db seed`

### Task 4: Type Generation
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Verify TypeScript types are available
- [ ] Update any existing type imports if needed

### Task 5: Repository Pattern Setup
- [ ] Create fitness repository following work module pattern
- [ ] Implement basic CRUD operations for all entities
- [ ] Add proper error handling and transactions

## Validation Gates

### Database Validation
```bash
# Schema validation
npx prisma validate

# Migration status
npx prisma migrate status  

# Generate and verify types
npx prisma generate

# Test database connection
npx prisma db pull --print
```

### Data Integrity Tests
```typescript
// Test exercise template creation
const template = await prisma.exerciseTemplate.create({
  data: {
    name: "Test Exercise",
    category: "test",
    muscleGroups: ["test"],
    isCustom: false
  }
})

// Test workout creation with exercises
const workout = await prisma.workout.create({
  data: {
    name: "Test Workout",
    userId: "test-user-id",
    workoutType: "strength",
    exercises: {
      create: [{
        exerciseId: template.id,
        orderIndex: 0,
        targetSets: 3,
        targetReps: 10
      }]
    }
  },
  include: { exercises: true }
})

// Verify relationships work correctly
expect(workout.exercises).toHaveLength(1)
expect(workout.exercises[0].targetSets).toBe(3)
```

## Performance Considerations

### Index Strategy
- **User-based queries**: Most queries filter by userId first
- **Date-based queries**: Workouts often queried by date ranges  
- **Exercise searches**: Name and category indexes for exercise library
- **Ordering**: WorkoutExercise ordering within workouts is critical

### Query Optimization
- Use compound indexes for common query patterns
- Implement proper pagination for large datasets
- Consider read replicas for analytics queries
- Cache frequently accessed exercise templates

## Error Handling

### Migration Rollback Strategy
```typescript
// If migration fails, provide rollback script
-- Rollback fitness schema migration
DROP TABLE IF EXISTS "WorkoutSet";
DROP TABLE IF EXISTS "WorkoutExercise"; 
DROP TABLE IF EXISTS "PersonalRecord";
DROP TABLE IF EXISTS "Workout";
DROP TABLE IF EXISTS "ExerciseTemplate";
DROP TABLE IF EXISTS "WorkoutPlan";
```

### Data Validation
- All foreign keys must exist before creation
- OrderIndex must be sequential within workouts
- Personal records must have valid units
- Dates must be logical (completedAt after scheduledDate)

## Success Criteria

### Technical Requirements
- [ ] All tables created successfully with proper constraints
- [ ] Foreign key relationships enforce data integrity  
- [ ] Indexes improve query performance by >50%
- [ ] Seed data creates 50+ exercise templates
- [ ] Migration completes without errors

### Integration Requirements  
- [ ] Prisma client generates correct TypeScript types
- [ ] Repository pattern works with new schema
- [ ] Existing application continues to function
- [ ] Database queries complete in <100ms for single records

## Documentation Links

### Reference Materials
- **Database Design**: https://stackoverflow.com/questions/65974181/database-design-for-workout-tracking-app
- **Fitness Schema**: https://www.geeksforgeeks.org/how-to-design-a-database-for-health-and-fitness-tracking-applications/
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **SQLite Performance**: https://www.sqlite.org/queryplanner.html

### Existing Patterns
- **Schema Location**: `/home/tholum/projects/goalassistant/prisma/schema.prisma`
- **Migration Commands**: Available in package.json scripts
- **Repository Pattern**: `/home/tholum/projects/goalassistant/src/lib/prisma/repositories/`

This PRP provides a complete foundation for fitness data storage with proper relationships, performance optimization, and data integrity. The schema supports all required functionality while following established patterns in the codebase.