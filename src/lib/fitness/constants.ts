/**
 * Fitness Module Constants
 * 
 * Defines all constant values used throughout the fitness module including
 * exercise categories, muscle groups, equipment types, and other fitness-related constants.
 */

export type ExerciseCategory = 
  | 'chest' 
  | 'back' 
  | 'legs' 
  | 'shoulders' 
  | 'arms' 
  | 'core' 
  | 'cardio'
  | 'flexibility'
  | 'full-body'

export const EXERCISE_CATEGORIES = [
  { id: 'chest', label: 'Chest', icon: '💪' },
  { id: 'back', label: 'Back', icon: '🦵' },
  { id: 'legs', label: 'Legs', icon: '🦵' },
  { id: 'shoulders', label: 'Shoulders', icon: '💪' },
  { id: 'arms', label: 'Arms', icon: '💪' },
  { id: 'core', label: 'Core', icon: '🔥' },
  { id: 'cardio', label: 'Cardio', icon: '❤️' },
  { id: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { id: 'full-body', label: 'Full Body', icon: '🏃' }
] as const

export const MUSCLE_GROUPS = [
  'pectorals',
  'deltoids',
  'biceps',
  'triceps',
  'forearms',
  'latissimus-dorsi',
  'rhomboids',
  'trapezius',
  'erector-spinae',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'tibialis-anterior',
  'abdominals',
  'obliques',
  'lower-back',
  'hip-flexors'
] as const

export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'resistance-bands',
  'cable-machine',
  'bodyweight',
  'bench',
  'pull-up-bar',
  'squat-rack',
  'smith-machine',
  'leg-press',
  'lat-pulldown',
  'rowing-machine',
  'treadmill',
  'stationary-bike',
  'elliptical',
  'medicine-ball',
  'foam-roller',
  'yoga-mat',
  'suspension-trainer'
] as const

export const WORKOUT_TYPES = [
  { id: 'strength', label: 'Strength Training', icon: '🏋️' },
  { id: 'cardio', label: 'Cardiovascular', icon: '🏃' },
  { id: 'flexibility', label: 'Flexibility & Mobility', icon: '🧘' },
  { id: 'mixed', label: 'Mixed Training', icon: '🏃‍♀️' }
] as const

export const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: 'green' },
  { id: 'intermediate', label: 'Intermediate', color: 'yellow' },
  { id: 'advanced', label: 'Advanced', color: 'red' }
] as const

export const EXERCISE_METRICS = {
  strength: ['sets', 'reps', 'weight', 'rest'],
  cardio: ['duration', 'distance', 'intensity', 'heartRate'],
  flexibility: ['duration', 'holds', 'sets']
} as const

export const REST_PERIODS = [
  { seconds: 30, label: '30 seconds' },
  { seconds: 60, label: '1 minute' },
  { seconds: 90, label: '1.5 minutes' },
  { seconds: 120, label: '2 minutes' },
  { seconds: 180, label: '3 minutes' },
  { seconds: 300, label: '5 minutes' }
] as const

export const RPE_SCALE = [
  { value: 1, label: 'Very Light', description: 'Could do many more reps' },
  { value: 2, label: 'Light', description: 'Could do many more reps' },
  { value: 3, label: 'Light+', description: 'Could do several more reps' },
  { value: 4, label: 'Moderate-', description: 'Could do several more reps' },
  { value: 5, label: 'Moderate', description: 'Could do a few more reps' },
  { value: 6, label: 'Moderate+', description: 'Could do a few more reps' },
  { value: 7, label: 'Hard-', description: 'Could do 2-3 more reps' },
  { value: 8, label: 'Hard', description: 'Could do 1-2 more reps' },
  { value: 9, label: 'Very Hard', description: 'Could do 1 more rep' },
  { value: 10, label: 'Maximum', description: 'Could not do any more reps' }
] as const

// Common exercise templates that can be pre-populated
export const DEFAULT_EXERCISE_TEMPLATES = [
  // Chest
  {
    name: 'Bench Press',
    description: 'Classic chest exercise using barbell',
    category: 'chest' as const,
    muscleGroups: ['pectorals', 'deltoids', 'triceps'],
    equipmentNeeded: 'barbell, bench',
    instructions: [
      'Lie flat on bench with feet firmly on ground',
      'Grip barbell slightly wider than shoulder width',
      'Lower bar to chest in controlled motion',
      'Press bar back to starting position'
    ],
    difficulty: 'intermediate' as const
  },
  {
    name: 'Push-ups',
    description: 'Bodyweight chest exercise',
    category: 'chest' as const,
    muscleGroups: ['pectorals', 'deltoids', 'triceps', 'abdominals'],
    equipmentNeeded: 'bodyweight',
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Lower body until chest nearly touches ground',
      'Push back up to starting position',
      'Keep core engaged throughout movement'
    ],
    difficulty: 'beginner' as const
  },
  
  // Back
  {
    name: 'Pull-ups',
    description: 'Bodyweight back exercise',
    category: 'back' as const,
    muscleGroups: ['latissimus-dorsi', 'rhomboids', 'biceps'],
    equipmentNeeded: 'pull-up-bar',
    instructions: [
      'Hang from bar with hands slightly wider than shoulders',
      'Pull body up until chin clears bar',
      'Lower with control to starting position',
      'Avoid swinging or using momentum'
    ],
    difficulty: 'intermediate' as const
  },
  {
    name: 'Bent-over Rows',
    description: 'Barbell back exercise',
    category: 'back' as const,
    muscleGroups: ['latissimus-dorsi', 'rhomboids', 'trapezius', 'biceps'],
    equipmentNeeded: 'barbell',
    instructions: [
      'Stand with feet hip-width apart, holding barbell',
      'Hinge at hips, keeping back straight',
      'Pull barbell to lower chest/upper abdomen',
      'Lower with control to starting position'
    ],
    difficulty: 'intermediate' as const
  },
  
  // Legs
  {
    name: 'Squats',
    description: 'Fundamental leg exercise',
    category: 'legs' as const,
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'abdominals'],
    equipmentNeeded: 'bodyweight',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower hips back and down as if sitting in chair',
      'Keep chest up and knees tracking over toes',
      'Drive through heels to return to standing'
    ],
    difficulty: 'beginner' as const
  },
  {
    name: 'Deadlifts',
    description: 'Compound movement for posterior chain',
    category: 'legs' as const,
    muscleGroups: ['hamstrings', 'glutes', 'erector-spinae', 'trapezius'],
    equipmentNeeded: 'barbell',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Hinge at hips and grip bar with hands outside legs',
      'Drive through heels and extend hips to lift bar',
      'Keep bar close to body throughout movement'
    ],
    difficulty: 'advanced' as const
  },
  
  // Cardio
  {
    name: 'Running',
    description: 'Cardiovascular endurance exercise',
    category: 'cardio' as const,
    muscleGroups: ['quadriceps', 'hamstrings', 'calves', 'glutes'],
    equipmentNeeded: 'running shoes',
    instructions: [
      'Start with light warm-up jog',
      'Maintain steady breathing rhythm',
      'Keep upright posture with slight forward lean',
      'Land midfoot with quick cadence'
    ],
    difficulty: 'beginner' as const
  },
  
  // Core
  {
    name: 'Plank',
    description: 'Isometric core strengthening exercise',
    category: 'core' as const,
    muscleGroups: ['abdominals', 'obliques', 'erector-spinae', 'deltoids'],
    equipmentNeeded: 'bodyweight',
    instructions: [
      'Start in push-up position',
      'Lower to forearms, keeping body straight',
      'Hold position while breathing normally',
      'Keep core engaged and avoid sagging hips'
    ],
    difficulty: 'beginner' as const
  }
] as const