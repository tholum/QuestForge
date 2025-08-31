'use client'

import React, { lazy, Suspense } from 'react';
import { IModule, Achievement, PointsConfiguration, ModuleCapability } from '../../types/module';

// Import HMR recovery utilities for development error handling
import { useHMRErrorBoundary } from '../../lib/dev/hmr-recovery';

// Use lazy loading for heavy components to avoid HMR module factory issues
const ExerciseLibraryView = lazy(() => 
  import('../../components/fitness/ExerciseLibrary').then(mod => ({
    default: mod.ExerciseLibraryView
  })).catch(error => {
    console.error('Failed to load ExerciseLibraryView:', error);
    // Return a fallback component
    return { default: () => <div className="p-4 text-red-600">Failed to load Exercise Library</div> };
  })
);

const WorkoutPlanningView = lazy(() => 
  import('../../components/fitness/WorkoutPlanner/WorkoutPlanningView').then(mod => ({
    default: mod.WorkoutPlanningView
  })).catch(error => {
    console.error('Failed to load WorkoutPlanningView:', error);
    // Return a fallback component
    return { default: () => <div className="p-4 text-red-600">Failed to load Workout Planner</div> };
  })
);

// Component wrapper with error boundary for HMR issues
const ComponentWrapper: React.FC<{ children: React.ReactNode; fallbackMessage?: string }> = ({ 
  children, 
  fallbackMessage = "Component loading failed"
}) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }>
    <ErrorBoundary fallbackMessage={fallbackMessage}>
      {children}
    </ErrorBoundary>
  </Suspense>
);

// Error boundary specifically for HMR module factory issues
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackMessage?: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallbackMessage?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Fitness Module HMR/Component Error:', error, errorInfo);
    
    // Check if this is an HMR-related error
    if (error.message?.includes('module factory') || 
        error.message?.includes('deleted in an HMR update')) {
      console.warn('🔥 HMR module factory error detected in fitness component');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Module Loading Error</h3>
          <p className="text-red-600 text-sm mt-1">
            {this.props.fallbackMessage || "Development error - component failed to load"}
          </p>
          <div className="mt-3 space-x-2">
            <button 
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </button>
            <button 
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer">Error Details</summary>
              <pre className="text-xs text-gray-500 mt-1 p-2 bg-gray-100 rounded overflow-auto">
                {this.state.error?.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Component imports (these would be actual components in a real implementation)
const FitnessDashboard = ({ moduleId, userId, config }: any) => (
  <div className="p-4 bg-red-50 rounded-lg">
    <h3 className="text-lg font-semibold text-red-800">Fitness Dashboard</h3>
    <p className="text-red-600">Track your workouts, nutrition, and fitness goals.</p>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="bg-white p-3 rounded shadow">
        <h4 className="font-medium">Workouts This Week</h4>
        <p className="text-2xl font-bold text-red-600">5</p>
      </div>
      <div className="bg-white p-3 rounded shadow">
        <h4 className="font-medium">Calories Burned</h4>
        <p className="text-2xl font-bold text-red-600">1,250</p>
      </div>
    </div>
  </div>
);

const FitnessMobileQuickAdd = ({ moduleId, userId, onSuccess, onCancel }: any) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-4">Quick Add Workout</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Exercise Type</label>
        <select className="w-full p-2 border rounded">
          <option value="cardio">Cardio</option>
          <option value="strength">Strength Training</option>
          <option value="flexibility">Flexibility</option>
          <option value="sports">Sports</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
        <input type="number" className="w-full p-2 border rounded" placeholder="30" />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onSuccess}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
        >
          Log Workout
        </button>
        <button 
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

const FitnessDesktopDetail = ({ moduleId, userId, config }: any) => {
  const [activeTab, setActiveTab] = React.useState('dashboard')

  return (
    <div className="p-6" data-testid="module-content">
      <h2 className="text-2xl font-bold mb-6" data-testid="module-title">Fitness Tracker</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'exercises'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Exercise Library
        </button>
        <button
          onClick={() => setActiveTab('workouts')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'workouts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Workouts
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'progress'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Progress
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Workout History</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <h4 className="font-medium">Morning Run</h4>
                      <p className="text-sm text-gray-600">45 minutes • 400 calories</p>
                    </div>
                    <span className="text-sm text-gray-500">{i} days ago</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Workouts</span>
                  <span className="font-medium">5/7</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Time</span>
                  <span className="font-medium">3h 20m</span>
                </div>
                <div className="flex justify-between">
                  <span>Calories</span>
                  <span className="font-medium">1,250</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Achievements</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">🏆</span>
                  <span className="text-sm">First Workout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">🏃</span>
                  <span className="text-sm text-gray-600">5K Runner (Locked)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="bg-white rounded-lg shadow p-6">
          <ComponentWrapper fallbackMessage="Failed to load Exercise Library">
            <ExerciseLibraryView 
              showHeader={false}
              onExerciseSelect={(exercise) => {
                console.log('Selected exercise:', exercise)
                // Handle exercise selection
              }}
            />
          </ComponentWrapper>
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="bg-white rounded-lg shadow p-0 h-[600px]">
          <ComponentWrapper fallbackMessage="Failed to load Workout Planner">
            <WorkoutPlanningView 
              userId={userId}
              onWorkoutComplete={(workout) => {
                console.log('Workout completed:', workout)
                // Could trigger XP awards or achievement checks
              }}
            />
          </ComponentWrapper>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Progress Tracking</h3>
          <p className="text-gray-600">Progress analytics and personal records coming soon...</p>
        </div>
      )}
    </div>
  )
};

const FitnessSettings = ({ moduleId, config, onConfigChange }: any) => (
  <div className="p-4 space-y-4">
    <h3 className="text-lg font-semibold">Fitness Module Settings</h3>
    
    <div>
      <label className="block text-sm font-medium mb-1">Default Workout Duration</label>
      <input 
        type="number" 
        className="w-full p-2 border rounded" 
        defaultValue={config.defaultDuration || 30}
        onChange={(e) => onConfigChange({ 
          ...config, 
          defaultDuration: parseInt(e.target.value) 
        })}
      />
    </div>
    
    <div>
      <label className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-2"
          defaultChecked={config.trackCalories}
          onChange={(e) => onConfigChange({ 
            ...config, 
            trackCalories: e.target.checked 
          })}
        />
        Track calories burned
      </label>
    </div>
    
    <div>
      <label className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-2"
          defaultChecked={config.enableReminders}
          onChange={(e) => onConfigChange({ 
            ...config, 
            enableReminders: e.target.checked 
          })}
        />
        Enable workout reminders
      </label>
    </div>
  </div>
);

// Define achievements for the fitness module
const fitnessAchievements: Achievement[] = [
  {
    id: 'first_workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    icon: 'trophy',
    tier: 'bronze',
    conditions: {
      type: 'count',
      target: 1,
      field: 'workoutsCompleted'
    },
    xpReward: 50
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete 7 workouts in a week',
    icon: 'fire',
    tier: 'silver',
    conditions: {
      type: 'count',
      target: 7,
      field: 'weeklyWorkouts'
    },
    xpReward: 100
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Maintain a 30-day workout streak',
    icon: 'calendar',
    tier: 'gold',
    conditions: {
      type: 'streak',
      target: 30,
      field: 'workoutStreak'
    },
    xpReward: 250
  },
  {
    id: 'marathon_master',
    name: 'Marathon Master',
    description: 'Complete 100 total workouts',
    icon: 'running',
    tier: 'platinum',
    conditions: {
      type: 'count',
      target: 100,
      field: 'totalWorkouts'
    },
    xpReward: 500
  }
];

// Define points configuration
const fitnessPointsConfig: PointsConfiguration = {
  actions: {
    log_workout: {
      basePoints: 10,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Log a workout session'
    },
    complete_fitness_goal: {
      basePoints: 25,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a fitness goal'
    },
    hit_calorie_target: {
      basePoints: 5,
      difficultyMultiplier: false,
      streakBonus: true,
      description: 'Reach daily calorie burn target'
    },
    track_nutrition: {
      basePoints: 3,
      difficultyMultiplier: false,
      streakBonus: true,
      description: 'Log nutritional information'
    }
  },
  difficultyMultipliers: {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 3
  },
  streakBonusPercentage: 15 // Higher bonus for fitness to encourage consistency
};

// Define module capabilities
const fitnessCapabilities: ModuleCapability[] = [
  {
    id: 'workout_tracking',
    name: 'Workout Tracking',
    description: 'Track various types of workouts and exercises',
    required: true
  },
  {
    id: 'calorie_tracking',
    name: 'Calorie Tracking',
    description: 'Monitor calories burned during activities',
    required: false
  },
  {
    id: 'nutrition_logging',
    name: 'Nutrition Logging',
    description: 'Log food intake and nutritional information',
    required: false
  },
  {
    id: 'progress_photos',
    name: 'Progress Photos',
    description: 'Take and store progress photos',
    required: false
  },
  {
    id: 'workout_reminders',
    name: 'Workout Reminders',
    description: 'Send reminders for scheduled workouts',
    required: false
  }
];

// Main fitness module implementation
export const FitnessModule: IModule = {
  id: 'fitness',
  name: 'Fitness Tracker',
  version: '1.0.0',
  icon: 'dumbbell',
  color: '#EF4444',

  metadata: {
    id: 'fitness',
    name: 'Fitness Tracker',
    version: '1.0.0',
    author: 'Goal Assistant Team',
    description: 'Comprehensive fitness tracking module for workouts, nutrition, and health goals',
    keywords: ['fitness', 'workout', 'health', 'nutrition', 'exercise', 'calories'],
    homepage: 'https://goalassistant.app/modules/fitness',
    repository: 'https://github.com/goalassistant/modules/fitness',
    license: 'MIT',
    minSystemVersion: '1.0.0',
    dependencies: {},
    peerDependencies: {}
  },

  components: {
    dashboard: FitnessDashboard,
    mobileQuickAdd: FitnessMobileQuickAdd,
    desktopDetail: FitnessDesktopDetail,
    settings: FitnessSettings
  },

  achievements: fitnessAchievements,
  pointsConfig: fitnessPointsConfig,
  capabilities: fitnessCapabilities,

  permissions: [
    'read:fitness_data',
    'write:fitness_data',
    'read:health_metrics',
    'write:health_metrics'
  ],

  // Data schema would be defined here in a real implementation
  dataSchema: undefined,

  // API routes would be defined here
  apiRoutes: {
    baseRoute: '/api/v1/fitness',
    routes: [
      {
        path: '/workouts',
        method: 'GET',
        handler: 'getWorkouts',
        permissions: ['read:fitness_data']
      },
      {
        path: '/workouts',
        method: 'POST',
        handler: 'createWorkout',
        permissions: ['write:fitness_data']
      },
      {
        path: '/workouts/:id',
        method: 'PUT',
        handler: 'updateWorkout',
        permissions: ['write:fitness_data']
      },
      {
        path: '/workouts/:id',
        method: 'DELETE',
        handler: 'deleteWorkout',
        permissions: ['write:fitness_data']
      },
      {
        path: '/stats',
        method: 'GET',
        handler: 'getFitnessStats',
        permissions: ['read:fitness_data']
      }
    ]
  },

  // Lifecycle methods
  async onInstall(): Promise<void> {
    console.log('Installing Fitness module...');
    // Initialize fitness-specific database tables, default settings, etc.
  },

  async onUninstall(): Promise<void> {
    console.log('Uninstalling Fitness module...');
    // Clean up fitness data, remove tables, etc.
  },

  async onEnable(): Promise<void> {
    console.log('Enabling Fitness module...');
    // Set up background tasks, notifications, etc.
  },

  async onDisable(): Promise<void> {
    console.log('Disabling Fitness module...');
    // Clean up background tasks, disable notifications, etc.
  },

  async onUpgrade(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Upgrading Fitness module from ${fromVersion} to ${toVersion}...`);
    // Handle data migration, update schema, etc.
  },

  async onConfigChange(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): Promise<void> {
    console.log('Fitness module configuration changed:', { oldConfig, newConfig });
    // React to configuration changes
  }
};

// Export UI components for page access - Fix for module loading issues
(FitnessModule as any).ui = {
  Dashboard: FitnessDashboard,
  MobileQuickAdd: FitnessMobileQuickAdd, 
  DesktopDetail: FitnessDesktopDetail,
  Settings: FitnessSettings
};