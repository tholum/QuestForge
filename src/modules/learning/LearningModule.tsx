import React from 'react';
import { IModule, Achievement, PointsConfiguration, ModuleCapability } from '../../types/module';

// Learning module components
const LearningDashboard = ({ moduleId, userId, config }: any) => (
  <div className="p-4 bg-green-50 rounded-lg">
    <h3 className="text-lg font-semibold text-green-800">Learning Progress</h3>
    <p className="text-green-600">Track your learning goals, courses, and skill development.</p>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="bg-white p-3 rounded shadow">
        <h4 className="font-medium">Active Courses</h4>
        <p className="text-2xl font-bold text-green-600">3</p>
      </div>
      <div className="bg-white p-3 rounded shadow">
        <h4 className="font-medium">Hours This Week</h4>
        <p className="text-2xl font-bold text-green-600">12.5</p>
      </div>
    </div>
  </div>
);

const LearningMobileQuickAdd = ({ moduleId, userId, onSuccess, onCancel }: any) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-4">Log Learning Session</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <input 
          type="text" 
          className="w-full p-2 border rounded" 
          placeholder="e.g., JavaScript, Spanish, Guitar"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
        <input type="number" className="w-full p-2 border rounded" placeholder="30" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea 
          className="w-full p-2 border rounded h-20" 
          placeholder="What did you learn today?"
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onSuccess}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Log Session
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

const LearningDesktopDetail = ({ moduleId, userId, config }: any) => (
  <div className="p-6" data-testid="module-content">
    <h2 className="text-2xl font-bold mb-6" data-testid="module-title">Learning Tracker</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Active Courses</h3>
          <div className="space-y-4">
            {[
              { name: 'Advanced React Development', progress: 75, nextDeadline: '3 days' },
              { name: 'Spanish Conversation', progress: 45, nextDeadline: '1 week' },
              { name: 'Data Science Fundamentals', progress: 30, nextDeadline: '2 weeks' }
            ].map((course, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{course.name}</h4>
                  <span className="text-sm text-gray-500">Next: {course.nextDeadline}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{course.progress}% complete</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <h4 className="font-medium">React Hooks Deep Dive</h4>
                  <p className="text-sm text-gray-600">45 minutes • Advanced React Development</p>
                </div>
                <span className="text-sm text-gray-500">{i} days ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">This Week</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Study Time</span>
              <span className="font-medium">12.5h</span>
            </div>
            <div className="flex justify-between">
              <span>Sessions</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between">
              <span>Subjects</span>
              <span className="font-medium">3</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Skills</h3>
          <div className="space-y-3">
            {[
              { skill: 'JavaScript', level: 85 },
              { skill: 'React', level: 70 },
              { skill: 'Spanish', level: 45 }
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{item.skill}</span>
                  <span className="text-sm text-gray-600">{item.level}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${item.level}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LearningSettings = ({ moduleId, config, onConfigChange }: any) => (
  <div className="p-4 space-y-4">
    <h3 className="text-lg font-semibold">Learning Module Settings</h3>
    
    <div>
      <label className="block text-sm font-medium mb-1">Daily Study Goal (minutes)</label>
      <input 
        type="number" 
        className="w-full p-2 border rounded" 
        defaultValue={config.dailyGoal || 60}
        onChange={(e) => onConfigChange({ 
          ...config, 
          dailyGoal: parseInt(e.target.value) 
        })}
      />
    </div>
    
    <div>
      <label className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-2"
          defaultChecked={config.trackCertificates}
          onChange={(e) => onConfigChange({ 
            ...config, 
            trackCertificates: e.target.checked 
          })}
        />
        Track certificates and achievements
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
        Enable study reminders
      </label>
    </div>
    
    <div>
      <label className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-2"
          defaultChecked={config.showPublicProgress}
          onChange={(e) => onConfigChange({ 
            ...config, 
            showPublicProgress: e.target.checked 
          })}
        />
        Show learning progress publicly
      </label>
    </div>
  </div>
);

// Learning achievements
const learningAchievements: Achievement[] = [
  {
    id: 'first_lesson',
    name: 'First Lesson',
    description: 'Complete your first learning session',
    icon: 'book',
    tier: 'bronze',
    conditions: {
      type: 'count',
      target: 1,
      field: 'sessionsCompleted'
    },
    xpReward: 25
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Study for 7 consecutive days',
    icon: 'calendar-check',
    tier: 'silver',
    conditions: {
      type: 'streak',
      target: 7,
      field: 'studyStreak'
    },
    xpReward: 100
  },
  {
    id: 'course_completion',
    name: 'Course Finisher',
    description: 'Complete your first course',
    icon: 'graduation-cap',
    tier: 'gold',
    conditions: {
      type: 'count',
      target: 1,
      field: 'coursesCompleted'
    },
    xpReward: 200
  },
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Study for 100 hours total',
    icon: 'brain',
    tier: 'platinum',
    conditions: {
      type: 'count',
      target: 6000, // 100 hours in minutes
      field: 'totalStudyMinutes'
    },
    xpReward: 500
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Study 5 different subjects',
    icon: 'globe',
    tier: 'gold',
    conditions: {
      type: 'count',
      target: 5,
      field: 'uniqueSubjects'
    },
    xpReward: 300
  }
];

// Learning points configuration
const learningPointsConfig: PointsConfiguration = {
  actions: {
    log_study_session: {
      basePoints: 5,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Log a study session'
    },
    complete_lesson: {
      basePoints: 15,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a lesson or module'
    },
    finish_course: {
      basePoints: 100,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Complete an entire course'
    },
    earn_certificate: {
      basePoints: 50,
      difficultyMultiplier: false,
      streakBonus: false,
      description: 'Earn a course certificate'
    },
    take_quiz: {
      basePoints: 10,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Complete a quiz or assessment'
    }
  },
  difficultyMultipliers: {
    easy: 1,
    medium: 1.3,
    hard: 1.8,
    expert: 2.5
  },
  streakBonusPercentage: 12
};

// Learning capabilities
const learningCapabilities: ModuleCapability[] = [
  {
    id: 'session_tracking',
    name: 'Session Tracking',
    description: 'Track learning sessions and study time',
    required: true
  },
  {
    id: 'course_management',
    name: 'Course Management',
    description: 'Manage enrolled courses and progress',
    required: true
  },
  {
    id: 'skill_assessment',
    name: 'Skill Assessment',
    description: 'Track skill levels and improvements',
    required: false
  },
  {
    id: 'certificate_tracking',
    name: 'Certificate Tracking',
    description: 'Track earned certificates and credentials',
    required: false
  },
  {
    id: 'study_reminders',
    name: 'Study Reminders',
    description: 'Send reminders for scheduled study sessions',
    required: false
  },
  {
    id: 'progress_analytics',
    name: 'Progress Analytics',
    description: 'Detailed analytics on learning progress',
    required: false
  }
];

// Main learning module implementation
export const LearningModule: IModule = {
  id: 'learning',
  name: 'Learning Tracker',
  version: '1.0.0',
  icon: 'book',
  color: '#10B981',

  metadata: {
    id: 'learning',
    name: 'Learning Tracker',
    version: '1.0.0',
    author: 'Goal Assistant Team',
    description: 'Comprehensive learning management system for tracking courses, skills, and educational progress',
    keywords: ['learning', 'education', 'courses', 'skills', 'study', 'knowledge'],
    homepage: 'https://goalassistant.app/modules/learning',
    repository: 'https://github.com/goalassistant/modules/learning',
    license: 'MIT',
    minSystemVersion: '1.0.0',
    dependencies: {},
    peerDependencies: {}
  },

  components: {
    dashboard: LearningDashboard,
    mobileQuickAdd: LearningMobileQuickAdd,
    desktopDetail: LearningDesktopDetail,
    settings: LearningSettings
  },

  achievements: learningAchievements,
  pointsConfig: learningPointsConfig,
  capabilities: learningCapabilities,

  permissions: [
    'read:learning_data',
    'write:learning_data',
    'read:course_progress',
    'write:course_progress',
    'read:skill_data',
    'write:skill_data'
  ],

  dataSchema: undefined,

  apiRoutes: {
    baseRoute: '/api/v1/learning',
    routes: [
      {
        path: '/sessions',
        method: 'GET',
        handler: 'getSessions',
        permissions: ['read:learning_data']
      },
      {
        path: '/sessions',
        method: 'POST',
        handler: 'createSession',
        permissions: ['write:learning_data']
      },
      {
        path: '/courses',
        method: 'GET',
        handler: 'getCourses',
        permissions: ['read:course_progress']
      },
      {
        path: '/courses/:id/progress',
        method: 'PUT',
        handler: 'updateCourseProgress',
        permissions: ['write:course_progress']
      },
      {
        path: '/skills',
        method: 'GET',
        handler: 'getSkills',
        permissions: ['read:skill_data']
      },
      {
        path: '/analytics',
        method: 'GET',
        handler: 'getLearningAnalytics',
        permissions: ['read:learning_data']
      }
    ]
  },

  // Lifecycle methods
  async onInstall(): Promise<void> {
    console.log('Installing Learning module...');
    // Initialize learning-specific database tables, default courses, etc.
  },

  async onUninstall(): Promise<void> {
    console.log('Uninstalling Learning module...');
    // Clean up learning data, remove tables, etc.
  },

  async onEnable(): Promise<void> {
    console.log('Enabling Learning module...');
    // Set up study reminders, sync with external platforms, etc.
  },

  async onDisable(): Promise<void> {
    console.log('Disabling Learning module...');
    // Disable reminders, pause syncing, etc.
  },

  async onUpgrade(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Upgrading Learning module from ${fromVersion} to ${toVersion}...`);
    // Handle data migration for learning records
  },

  async onConfigChange(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): Promise<void> {
    console.log('Learning module configuration changed:', { oldConfig, newConfig });
    // Update study reminders, sync settings, etc.
  }
};

// Export UI components for page access - Fix for module loading issues
(LearningModule as any).ui = {
  Dashboard: LearningDashboard,
  MobileQuickAdd: LearningMobileQuickAdd, 
  DesktopDetail: LearningDesktopDetail,
  Settings: LearningSettings
};