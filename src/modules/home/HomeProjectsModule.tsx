import React from 'react';
import { IModule, Achievement, PointsConfiguration, ModuleCapability } from '../../types/module';

// Home projects module components
const HomeProjectsDashboard = ({ moduleId, userId, config }: any) => (
  <div className="p-4 bg-blue-50 rounded-lg">
    <h3 className="text-lg font-semibold text-blue-800">Home Projects</h3>
    <p className="text-blue-600">Manage your home improvement and organization projects.</p>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="bg-white p-3 rounded shadow">
        <h4 className="font-medium">Active Projects</h4>
        <p className="text-2xl font-bold text-blue-600">4</p>
      </div>
      <div className="bg-white p-3 rounded shadow">
        <h4 className="font-medium">Completed Tasks</h4>
        <p className="text-2xl font-bold text-blue-600">23</p>
      </div>
    </div>
  </div>
);

const HomeProjectsMobileQuickAdd = ({ moduleId, userId, onSuccess, onCancel }: any) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-4">New Project Task</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Project</label>
        <select className="w-full p-2 border rounded">
          <option value="">Select Project</option>
          <option value="kitchen_renovation">Kitchen Renovation</option>
          <option value="garden_landscaping">Garden Landscaping</option>
          <option value="garage_organization">Garage Organization</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Task Description</label>
        <input 
          type="text" 
          className="w-full p-2 border rounded" 
          placeholder="e.g., Install new cabinet handles"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <select className="w-full p-2 border rounded">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onSuccess}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Add Task
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

const HomeProjectsDesktopDetail = ({ moduleId, userId, config }: any) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">Home Projects</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Active Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                name: 'Kitchen Renovation', 
                progress: 65, 
                tasks: 12, 
                completed: 8, 
                priority: 'high',
                deadline: '2 weeks'
              },
              { 
                name: 'Garden Landscaping', 
                progress: 30, 
                tasks: 8, 
                completed: 2, 
                priority: 'medium',
                deadline: '1 month'
              },
              { 
                name: 'Garage Organization', 
                progress: 80, 
                tasks: 6, 
                completed: 5, 
                priority: 'low',
                deadline: '3 days'
              },
              { 
                name: 'Basement Cleanup', 
                progress: 15, 
                tasks: 10, 
                completed: 1, 
                priority: 'medium',
                deadline: '6 weeks'
              }
            ].map((project, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{project.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.priority === 'high' ? 'bg-red-100 text-red-800' :
                    project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {project.priority}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{project.completed}/{project.tasks} tasks</span>
                  <span>Due: {project.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
          <div className="space-y-3">
            {[
              { task: 'Install cabinet handles', project: 'Kitchen Renovation', completed: true, date: 'Today' },
              { task: 'Paint living room walls', project: 'Interior Updates', completed: true, date: 'Yesterday' },
              { task: 'Plant new flowers', project: 'Garden Landscaping', completed: false, date: 'Tomorrow' },
              { task: 'Organize tool shed', project: 'Garage Organization', completed: true, date: '2 days ago' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={item.completed}
                    className="h-4 w-4 text-blue-600"
                    readOnly
                  />
                  <div>
                    <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.task}
                    </h4>
                    <p className="text-sm text-gray-600">{item.project}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">This Month</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Projects</span>
              <span className="font-medium">4</span>
            </div>
            <div className="flex justify-between">
              <span>Completed Tasks</span>
              <span className="font-medium">23</span>
            </div>
            <div className="flex justify-between">
              <span>Hours Logged</span>
              <span className="font-medium">42</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-2 rounded hover:bg-gray-50">
              📝 Add New Project
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-50">
              ✅ Complete Task
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-50">
              ⏰ Set Reminder
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-50">
              📊 View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HomeProjectsSettings = ({ moduleId, config, onConfigChange }: any) => (
  <div className="p-4 space-y-4">
    <h3 className="text-lg font-semibold">Home Projects Settings</h3>
    
    <div>
      <label className="block text-sm font-medium mb-1">Default Project Category</label>
      <select 
        className="w-full p-2 border rounded" 
        defaultValue={config.defaultCategory || 'renovation'}
        onChange={(e) => onConfigChange({ 
          ...config, 
          defaultCategory: e.target.value 
        })}
      >
        <option value="renovation">Renovation</option>
        <option value="maintenance">Maintenance</option>
        <option value="organization">Organization</option>
        <option value="landscaping">Landscaping</option>
        <option value="cleaning">Cleaning</option>
      </select>
    </div>
    
    <div>
      <label className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-2"
          defaultChecked={config.trackBudget}
          onChange={(e) => onConfigChange({ 
            ...config, 
            trackBudget: e.target.checked 
          })}
        />
        Track project budgets
      </label>
    </div>
    
    <div>
      <label className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-2"
          defaultChecked={config.enableDeadlines}
          onChange={(e) => onConfigChange({ 
            ...config, 
            enableDeadlines: e.target.checked 
          })}
        />
        Enable project deadlines
      </label>
    </div>
    
    <div>
      <label className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-2"
          defaultChecked={config.photoDocumentation}
          onChange={(e) => onConfigChange({ 
            ...config, 
            photoDocumentation: e.target.checked 
          })}
        />
        Enable photo documentation
      </label>
    </div>
  </div>
);

// Home projects achievements
const homeProjectsAchievements: Achievement[] = [
  {
    id: 'first_project',
    name: 'First Project',
    description: 'Start your first home project',
    icon: 'house',
    tier: 'bronze',
    conditions: {
      type: 'count',
      target: 1,
      field: 'projectsStarted'
    },
    xpReward: 25
  },
  {
    id: 'task_master',
    name: 'Task Master',
    description: 'Complete 50 project tasks',
    icon: 'check-circle',
    tier: 'silver',
    conditions: {
      type: 'count',
      target: 50,
      field: 'tasksCompleted'
    },
    xpReward: 150
  },
  {
    id: 'project_finisher',
    name: 'Project Finisher',
    description: 'Complete your first project',
    icon: 'trophy',
    tier: 'gold',
    conditions: {
      type: 'count',
      target: 1,
      field: 'projectsCompleted'
    },
    xpReward: 200
  },
  {
    id: 'home_improvement_hero',
    name: 'Home Improvement Hero',
    description: 'Complete 10 home projects',
    icon: 'hammer',
    tier: 'platinum',
    conditions: {
      type: 'count',
      target: 10,
      field: 'projectsCompleted'
    },
    xpReward: 500
  }
];

// Home projects points configuration
const homeProjectsPointsConfig: PointsConfiguration = {
  actions: {
    start_project: {
      basePoints: 10,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Start a new home project'
    },
    complete_task: {
      basePoints: 8,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a project task'
    },
    finish_project: {
      basePoints: 50,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Complete an entire project'
    },
    log_time: {
      basePoints: 2,
      difficultyMultiplier: false,
      streakBonus: true,
      description: 'Log time spent on projects'
    }
  },
  difficultyMultipliers: {
    easy: 1,
    medium: 1.4,
    hard: 2,
    expert: 3
  },
  streakBonusPercentage: 8
};

// Home projects capabilities
const homeProjectsCapabilities: ModuleCapability[] = [
  {
    id: 'project_management',
    name: 'Project Management',
    description: 'Create and manage home improvement projects',
    required: true
  },
  {
    id: 'task_tracking',
    name: 'Task Tracking',
    description: 'Break projects into manageable tasks',
    required: true
  },
  {
    id: 'budget_tracking',
    name: 'Budget Tracking',
    description: 'Track project costs and budgets',
    required: false
  },
  {
    id: 'photo_documentation',
    name: 'Photo Documentation',
    description: 'Document project progress with photos',
    required: false
  },
  {
    id: 'time_tracking',
    name: 'Time Tracking',
    description: 'Track time spent on projects',
    required: false
  }
];

// Main home projects module implementation
export const HomeProjectsModule: IModule = {
  id: 'home_projects',
  name: 'Home Projects',
  version: '1.0.0',
  icon: 'house',
  color: '#3B82F6',

  metadata: {
    id: 'home_projects',
    name: 'Home Projects',
    version: '1.0.0',
    author: 'Goal Assistant Team',
    description: 'Manage home improvement, renovation, and organization projects with task tracking and progress monitoring',
    keywords: ['home', 'projects', 'renovation', 'improvement', 'tasks', 'organization'],
    homepage: 'https://goalassistant.app/modules/home-projects',
    repository: 'https://github.com/goalassistant/modules/home-projects',
    license: 'MIT',
    minSystemVersion: '1.0.0',
    dependencies: {},
    peerDependencies: {}
  },

  components: {
    dashboard: HomeProjectsDashboard,
    mobileQuickAdd: HomeProjectsMobileQuickAdd,
    desktopDetail: HomeProjectsDesktopDetail,
    settings: HomeProjectsSettings
  },

  achievements: homeProjectsAchievements,
  pointsConfig: homeProjectsPointsConfig,
  capabilities: homeProjectsCapabilities,

  permissions: [
    'read:project_data',
    'write:project_data',
    'read:task_data',
    'write:task_data'
  ],

  dataSchema: undefined,

  apiRoutes: {
    baseRoute: '/api/v1/home-projects',
    routes: [
      {
        path: '/projects',
        method: 'GET',
        handler: 'getProjects',
        permissions: ['read:project_data']
      },
      {
        path: '/projects',
        method: 'POST',
        handler: 'createProject',
        permissions: ['write:project_data']
      },
      {
        path: '/projects/:id/tasks',
        method: 'GET',
        handler: 'getProjectTasks',
        permissions: ['read:task_data']
      },
      {
        path: '/tasks',
        method: 'POST',
        handler: 'createTask',
        permissions: ['write:task_data']
      },
      {
        path: '/tasks/:id/complete',
        method: 'PUT',
        handler: 'completeTask',
        permissions: ['write:task_data']
      }
    ]
  },

  // Lifecycle methods
  async onInstall(): Promise<void> {
    console.log('Installing Home Projects module...');
    // Initialize project and task tables
  },

  async onUninstall(): Promise<void> {
    console.log('Uninstalling Home Projects module...');
    // Clean up project data
  },

  async onEnable(): Promise<void> {
    console.log('Enabling Home Projects module...');
    // Set up project reminders
  },

  async onDisable(): Promise<void> {
    console.log('Disabling Home Projects module...');
    // Disable reminders
  },

  async onUpgrade(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Upgrading Home Projects module from ${fromVersion} to ${toVersion}...`);
    // Handle project data migration
  },

  async onConfigChange(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): Promise<void> {
    console.log('Home Projects module configuration changed:', { oldConfig, newConfig });
    // Update tracking settings
  }
};