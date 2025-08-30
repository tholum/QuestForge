'use client';

import React, { useState, useEffect } from 'react';
import { IModule, Achievement, PointsConfiguration, ModuleCapability } from '../../types/module';
import { 
  WorkDashboardData, 
  WorkModuleConfig, 
  WorkProjectWithProgress,
  TaskWithProject,
  TimeEntryData,
  TimeTrackingSession 
} from './types';

// UI Component imports 
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

// Icons
import { 
  Briefcase, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  PlayCircle,
  PauseCircle,
  Square,
  Timer,
  CheckCircle2,
  User,
  AlertCircle,
  FileText,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';

/**
 * Work Dashboard Component
 */
const WorkDashboard = ({ userId }: { moduleId: string; userId: string; config: Record<string, unknown> }) => {
  const [dashboardData, setDashboardData] = useState<WorkDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<TimeTrackingSession | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetch('/api/v1/modules/work?type=dashboard', {
          headers: {
            'Authorization': 'Bearer placeholder-token' // Replace with actual auth
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setDashboardData(result.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userId]);

  const startTimer = async (projectId: string, taskId?: string) => {
    try {
      const response = await fetch('/api/v1/modules/work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer placeholder-token'
        },
        body: JSON.stringify({
          type: 'time-start',
          projectId,
          taskId,
          description: 'Work session'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setActiveTimer({
          id: result.data.id,
          projectId,
          taskId,
          description: result.data.description,
          startTime: new Date(result.data.startTime),
          isRunning: true,
          elapsedMinutes: 0
        });
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await fetch('/api/v1/modules/work', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer placeholder-token'
        },
        body: JSON.stringify({
          type: 'time-stop',
          id: activeTimer.id
        })
      });

      if (response.ok) {
        setActiveTimer(null);
        // Reload dashboard data to reflect the new time entry
        // loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  // Update timer display every minute
  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          elapsedMinutes: Math.floor((Date.now() - prev.startTime.getTime()) / (1000 * 60))
        };
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-800">Work Dashboard</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          {dashboardData?.stats.weekHours || 0}h this week
        </Badge>
      </div>

      {/* Active Timer */}
      {activeTimer && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-green-600" />
              <span className="font-medium">Timer Running</span>
              <span className="text-sm text-gray-600">
                {Math.floor(activeTimer.elapsedMinutes / 60)}h {activeTimer.elapsedMinutes % 60}m
              </span>
            </div>
            <Button onClick={stopTimer} size="sm" variant="outline">
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData?.stats.totalActiveProjects || 0}
            </div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData?.todayTasks.completed || 0}/{dashboardData?.todayTasks.total || 0}
            </div>
            <div className="text-sm text-gray-600">Today's Tasks</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData?.stats.overdueTaskCount || 0}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData?.stats.completedCareerGoals || 0}
            </div>
            <div className="text-sm text-gray-600">Career Goals</div>
          </div>
        </Card>
      </div>

      {/* Active Projects */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 flex items-center">
          <Briefcase className="w-4 h-4 mr-2" />
          Active Projects
        </h4>
        {dashboardData?.activeProjects.length === 0 ? (
          <p className="text-sm text-gray-500">No active projects. Create your first project!</p>
        ) : (
          <div className="space-y-3">
            {dashboardData?.activeProjects.slice(0, 3).map((project) => (
              <div key={project.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{project.name}</h5>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={
                      project.isOverdue ? 'border-red-200 text-red-600' : 
                      project.daysRemaining && project.daysRemaining < 7 ? 'border-orange-200 text-orange-600' :
                      'border-gray-200'
                    }>
                      {project.isOverdue ? 'Overdue' : 
                       project.daysRemaining ? `${project.daysRemaining}d left` : 'No deadline'}
                    </Badge>
                    <Button 
                      onClick={() => startTimer(project.id)} 
                      size="sm" 
                      variant="outline"
                      disabled={!!activeTimer}
                    >
                      <PlayCircle className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  </div>
                </div>
                <Progress value={project.progress} className="mb-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                  <span>{Math.round(project.totalTimeMinutes / 60)}h logged</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Deadlines */}
      {dashboardData?.upcomingDeadlines.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Upcoming Deadlines
          </h4>
          <div className="space-y-2">
            {dashboardData.upcomingDeadlines.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{task.title}</div>
                  <div className="text-xs text-gray-500">
                    {task.projectName} • 
                    {task.isOverdue ? (
                      <span className="text-red-600">Overdue</span>
                    ) : (
                      <span>{task.daysUntilDue} days left</span>
                    )}
                  </div>
                </div>
                <Badge variant={task.isOverdue ? 'destructive' : 'outline'}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="sm">
          <Plus className="w-3 h-3 mr-1" />
          New Project
        </Button>
        <Button variant="outline" size="sm">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Log Task
        </Button>
        <Button variant="outline" size="sm">
          <Target className="w-3 h-3 mr-1" />
          Career Goal
        </Button>
        <Button variant="outline" size="sm">
          <BarChart3 className="w-3 h-3 mr-1" />
          Analytics
        </Button>
      </div>
    </div>
  );
};

/**
 * Work Mobile Quick Add Component
 */
const WorkMobileQuickAdd = ({ onSuccess, onCancel }: { moduleId: string; userId: string; onSuccess?: () => void; onCancel?: () => void }) => {
  const [activeTab, setActiveTab] = useState('project');
  const [formData, setFormData] = useState({
    // Project
    projectName: '',
    projectType: 'personal' as const,
    projectDescription: '',
    projectPriority: 'medium' as const,
    // Task
    taskTitle: '',
    taskProjectId: '',
    taskDescription: '',
    taskPriority: 'medium' as const,
    taskDueDate: '',
    // Time entry
    timeProjectId: '',
    timeDescription: '',
    timeHours: '',
    // Career goal
    careerCategory: 'skill' as const,
    careerTitle: '',
    careerDescription: '',
    careerLevel: 'beginner' as const
  });

  const [projects, setProjects] = useState<WorkProjectWithProgress[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/v1/modules/work?type=projects&status=active&limit=10', {
          headers: {
            'Authorization': 'Bearer placeholder-token'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setProjects(result.data);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    if (activeTab === 'task' || activeTab === 'time') {
      loadProjects();
    }
  }, [activeTab]);

  const handleSubmit = async (type: string) => {
    try {
      let endpoint = '/api/v1/modules/work';
      let data: Record<string, unknown> = { type };

      switch (type) {
        case 'project':
          data = {
            ...data,
            name: formData.projectName,
            projectType: formData.projectType,
            description: formData.projectDescription || undefined,
            priority: formData.projectPriority,
            createGoal: true
          };
          break;
        case 'task':
          data = {
            ...data,
            projectId: formData.taskProjectId,
            title: formData.taskTitle,
            description: formData.taskDescription || undefined,
            priority: formData.taskPriority,
            dueDate: formData.taskDueDate || undefined
          };
          break;
        case 'time-entry':
          const hours = parseFloat(formData.timeHours);
          const now = new Date();
          const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
          
          data = {
            ...data,
            projectId: formData.timeProjectId,
            description: formData.timeDescription || undefined,
            startTime: startTime.toISOString(),
            endTime: now.toISOString(),
            durationMinutes: Math.round(hours * 60)
          };
          break;
        case 'career-goal':
          data = {
            ...data,
            category: formData.careerCategory,
            title: formData.careerTitle,
            description: formData.careerDescription || undefined,
            currentLevel: formData.careerLevel,
            createGoal: true
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer placeholder-token'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        onSuccess?.();
      } else {
        console.error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Quick Work Actions</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="project" className="text-xs">Project</TabsTrigger>
          <TabsTrigger value="task" className="text-xs">Task</TabsTrigger>
          <TabsTrigger value="time" className="text-xs">Time</TabsTrigger>
          <TabsTrigger value="career" className="text-xs">Career</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <Input
              value={formData.projectName}
              onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              placeholder="Client Website Redesign"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Project Type</label>
            <Select
              value={formData.projectType}
              onValueChange={(value) => setFormData({...formData, projectType: value as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client Project</SelectItem>
                <SelectItem value="internal">Internal Project</SelectItem>
                <SelectItem value="personal">Personal Project</SelectItem>
                <SelectItem value="team">Team Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.projectDescription}
              onChange={(e) => setFormData({...formData, projectDescription: e.target.value})}
              placeholder="Brief project description..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <Select
              value={formData.projectPriority}
              onValueChange={(value) => setFormData({...formData, projectPriority: value as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => handleSubmit('project')} className="w-full">
            Create Project
          </Button>
        </TabsContent>

        <TabsContent value="task" className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            <Select
              value={formData.taskProjectId}
              onValueChange={(value) => setFormData({...formData, taskProjectId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Task Title</label>
            <Input
              value={formData.taskTitle}
              onChange={(e) => setFormData({...formData, taskTitle: e.target.value})}
              placeholder="Design homepage mockup"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <Input
              type="date"
              value={formData.taskDueDate}
              onChange={(e) => setFormData({...formData, taskDueDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <Select
              value={formData.taskPriority}
              onValueChange={(value) => setFormData({...formData, taskPriority: value as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => handleSubmit('task')} className="w-full">
            Create Task
          </Button>
        </TabsContent>

        <TabsContent value="time" className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            <Select
              value={formData.timeProjectId}
              onValueChange={(value) => setFormData({...formData, timeProjectId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hours Worked</label>
            <Input
              type="number"
              step="0.5"
              value={formData.timeHours}
              onChange={(e) => setFormData({...formData, timeHours: e.target.value})}
              placeholder="2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.timeDescription}
              onChange={(e) => setFormData({...formData, timeDescription: e.target.value})}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>
          <Button onClick={() => handleSubmit('time-entry')} className="w-full">
            Log Time
          </Button>
        </TabsContent>

        <TabsContent value="career" className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              value={formData.careerCategory}
              onValueChange={(value) => setFormData({...formData, careerCategory: value as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skill">Skill Development</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Goal Title</label>
            <Input
              value={formData.careerTitle}
              onChange={(e) => setFormData({...formData, careerTitle: e.target.value})}
              placeholder="Learn React Native"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Level</label>
            <Select
              value={formData.careerLevel}
              onValueChange={(value) => setFormData({...formData, careerLevel: value as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.careerDescription}
              onChange={(e) => setFormData({...formData, careerDescription: e.target.value})}
              placeholder="Why is this goal important to you?"
              rows={3}
            />
          </div>
          <Button onClick={() => handleSubmit('career-goal')} className="w-full">
            Create Career Goal
          </Button>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 mt-6">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

/**
 * Work Desktop Detail Component
 */
const WorkDesktopDetail = ({ moduleId, userId, config }: { moduleId: string; userId: string; config: Record<string, unknown> }) => {
  return (
    <div className="p-6" data-testid="module-content">
      <h2 className="text-2xl font-bold mb-6 text-blue-800" data-testid="module-title">Work Management Center</h2>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="career">Career Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <WorkDashboard moduleId={moduleId} userId={userId} config={config} />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Projects</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Project cards would be rendered here */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Sample Project</h4>
                  <Badge>Active</Badge>
                </div>
                <Progress value={75} className="mb-4" />
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tasks</span>
                    <span>15/20 completed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time logged</span>
                    <span>48h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due date</span>
                    <span>Dec 15, 2024</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="w-3 h-3 mr-1" />
                    Tasks
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tasks</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Task list would be rendered here */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <h4 className="font-medium">Design homepage mockup</h4>
                      <p className="text-sm text-gray-600">Client Website Project</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">High</Badge>
                    <span className="text-sm text-gray-500">Due tomorrow</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Time Tracking</h3>
              <div className="flex gap-2">
                <Button variant="outline">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Timer
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Time
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-medium mb-4">Today's Time</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Project Alpha</span>
                    <span className="font-medium">2h 30m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Project Beta</span>
                    <span className="font-medium">1h 15m</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-medium">
                    <span>Total</span>
                    <span>3h 45m</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-medium mb-4">This Week</h4>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  24h 30m
                </div>
                <p className="text-sm text-gray-600">
                  8% more than last week
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="career" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Career Goals</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Learn React Native</h4>
                  <Badge variant="outline">Skill</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Expand mobile development capabilities
                </p>
                <Progress value={40} className="mb-2" />
                <p className="text-xs text-gray-500">40% complete</p>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Work Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Projects Completed</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-green-600">+20% from last month</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Avg. Completion Time</span>
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">14.2</div>
                <p className="text-xs text-blue-600">days per project</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Productivity Score</span>
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">8.7</div>
                <p className="text-xs text-purple-600">out of 10</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Hours This Month</span>
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-orange-600">+8% from target</p>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Work Settings Component
 */
const WorkSettings = ({ config, onConfigChange }: { moduleId: string; config: Record<string, unknown>; onConfigChange: (config: Record<string, unknown>) => void }) => {
  const [settings, setSettings] = useState<WorkModuleConfig>({
    defaultProjectType: 'personal',
    enableTimeTracking: true,
    enableCareerGoals: true,
    enablePerformanceMetrics: true,
    enableBillableTracking: false,
    autoCreateGoalsForProjects: true,
    enableProjectTemplates: false,
    enableTeamCollaboration: false,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    reminderSettings: {
      enableDailyTimeLog: true,
      enableProjectDeadlines: true,
      enableCareerGoalReminders: true,
      reminderTime: '18:00'
    },
    analyticsSettings: {
      enableProductivityTracking: true,
      enableTimeAnalytics: true,
      enablePerformanceReports: false,
      reportFrequency: 'weekly'
    },
    ...config
  });

  const handleSettingChange = (key: keyof WorkModuleConfig, value: unknown) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onConfigChange(newSettings);
  };

  const handleNestedSettingChange = (
    parent: keyof WorkModuleConfig,
    key: string,
    value: unknown
  ) => {
    const newSettings = {
      ...settings,
      [parent]: {
        ...settings[parent],
        [key]: value
      }
    };
    setSettings(newSettings);
    onConfigChange(newSettings);
  };

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold">Work Module Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Default Project Type</label>
          <Select
            value={settings.defaultProjectType}
            onValueChange={(value) => handleSettingChange('defaultProjectType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client Project</SelectItem>
              <SelectItem value="internal">Internal Project</SelectItem>
              <SelectItem value="personal">Personal Project</SelectItem>
              <SelectItem value="team">Team Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enableTimeTracking}
              onChange={(e) => handleSettingChange('enableTimeTracking', e.target.checked)}
            />
            <span className="text-sm font-medium">Enable time tracking</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enableCareerGoals}
              onChange={(e) => handleSettingChange('enableCareerGoals', e.target.checked)}
            />
            <span className="text-sm font-medium">Enable career goal management</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.autoCreateGoalsForProjects}
              onChange={(e) => handleSettingChange('autoCreateGoalsForProjects', e.target.checked)}
            />
            <span className="text-sm font-medium">Auto-create goals for new projects</span>
          </label>
        </div>

        {settings.enableTimeTracking && (
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.enableBillableTracking}
                onChange={(e) => handleSettingChange('enableBillableTracking', e.target.checked)}
              />
              <span className="text-sm font-medium">Enable billable time tracking</span>
            </label>
          </div>
        )}

        {settings.enableBillableTracking && (
          <div>
            <label className="block text-sm font-medium mb-2">Default Hourly Rate</label>
            <Input
              type="number"
              value={settings.defaultHourlyRate || ''}
              onChange={(e) => handleSettingChange('defaultHourlyRate', parseFloat(e.target.value) || undefined)}
              placeholder="50.00"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Work Start Time</label>
            <Input
              type="time"
              value={settings.workingHoursStart}
              onChange={(e) => handleSettingChange('workingHoursStart', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Work End Time</label>
            <Input
              type="time"
              value={settings.workingHoursEnd}
              onChange={(e) => handleSettingChange('workingHoursEnd', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium mb-4">Reminder Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.reminderSettings.enableDailyTimeLog}
              onChange={(e) => handleNestedSettingChange('reminderSettings', 'enableDailyTimeLog', e.target.checked)}
            />
            <span className="text-sm">Daily time logging reminders</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.reminderSettings.enableProjectDeadlines}
              onChange={(e) => handleNestedSettingChange('reminderSettings', 'enableProjectDeadlines', e.target.checked)}
            />
            <span className="text-sm">Project deadline notifications</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.reminderSettings.enableCareerGoalReminders}
              onChange={(e) => handleNestedSettingChange('reminderSettings', 'enableCareerGoalReminders', e.target.checked)}
            />
            <span className="text-sm">Career goal progress reminders</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium mb-2">Reminder Time</label>
            <Input
              type="time"
              value={settings.reminderSettings.reminderTime}
              onChange={(e) => handleNestedSettingChange('reminderSettings', 'reminderTime', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium mb-4">Analytics Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.analyticsSettings.enableProductivityTracking}
              onChange={(e) => handleNestedSettingChange('analyticsSettings', 'enableProductivityTracking', e.target.checked)}
            />
            <span className="text-sm">Enable productivity tracking</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.analyticsSettings.enableTimeAnalytics}
              onChange={(e) => handleNestedSettingChange('analyticsSettings', 'enableTimeAnalytics', e.target.checked)}
            />
            <span className="text-sm">Enable time analytics</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.analyticsSettings.enablePerformanceReports}
              onChange={(e) => handleNestedSettingChange('analyticsSettings', 'enablePerformanceReports', e.target.checked)}
            />
            <span className="text-sm">Enable performance reports</span>
          </label>
          
          {settings.analyticsSettings.enablePerformanceReports && (
            <div>
              <label className="block text-sm font-medium mb-2">Report Frequency</label>
              <Select
                value={settings.analyticsSettings.reportFrequency}
                onValueChange={(value) => handleNestedSettingChange('analyticsSettings', 'reportFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium mb-2">Data Management</h4>
        <div className="space-y-2">
          <Button variant="outline" size="sm">
            Export Work Data
          </Button>
          <Button variant="outline" size="sm">
            Import Project Template
          </Button>
          <Button variant="outline" size="sm" className="text-red-600">
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All Time Entries
          </Button>
        </div>
      </div>
    </div>
  );
};

// Define achievements for the Work module
const workAchievements: Achievement[] = [
  {
    id: 'first_project',
    name: 'Project Pioneer',
    description: 'Create your first work project',
    icon: 'briefcase',
    tier: 'bronze',
    conditions: { type: 'count', target: 1, field: 'projectsCreated' },
    xpReward: 50
  },
  {
    id: 'time_tracker',
    name: 'Time Master',
    description: 'Track 40 hours of work time',
    icon: 'clock',
    tier: 'silver',
    conditions: { type: 'count', target: 2400, field: 'minutesTracked' },
    xpReward: 150
  },
  {
    id: 'project_completer',
    name: 'Delivery Expert',
    description: 'Complete 10 work projects',
    icon: 'check-circle',
    tier: 'gold',
    conditions: { type: 'count', target: 10, field: 'projectsCompleted' },
    xpReward: 500
  },
  {
    id: 'career_focused',
    name: 'Career Strategist',
    description: 'Set and achieve 5 career development goals',
    icon: 'target',
    tier: 'gold',
    conditions: { type: 'count', target: 5, field: 'careerGoalsCompleted' },
    xpReward: 400
  },
  {
    id: 'productivity_master',
    name: 'Productivity Guru',
    description: 'Maintain a 30-day work streak',
    icon: 'trending-up',
    tier: 'platinum',
    conditions: { type: 'streak', target: 30, field: 'workStreak' },
    xpReward: 1000
  }
];

const workPointsConfig: PointsConfiguration = {
  actions: {
    create_work_project: {
      basePoints: 25,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Create a new work project'
    },
    complete_project: {
      basePoints: 100,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a work project'
    },
    create_task: {
      basePoints: 5,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Create a project task'
    },
    complete_task: {
      basePoints: 15,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a project task'
    },
    track_time: {
      basePoints: 2,
      difficultyMultiplier: false,
      streakBonus: true,
      description: 'Log work time'
    },
    create_career_goal: {
      basePoints: 30,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Create a career development goal'
    },
    complete_milestone: {
      basePoints: 50,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a project milestone'
    }
  },
  difficultyMultipliers: {
    easy: 1,
    medium: 1.3,
    hard: 1.7,
    expert: 2.5
  },
  streakBonusPercentage: 15 // Encourages consistent work habits
};

// Module capabilities
const workCapabilities: ModuleCapability[] = [
  {
    id: 'project_management',
    name: 'Project Management',
    description: 'Create and manage work projects with tasks and milestones',
    required: true
  },
  {
    id: 'time_tracking',
    name: 'Time Tracking',
    description: 'Track time spent on projects and tasks',
    required: true
  },
  {
    id: 'career_development',
    name: 'Career Development',
    description: 'Set and track professional development goals',
    required: false
  },
  {
    id: 'performance_analytics',
    name: 'Performance Analytics',
    description: 'Analyze work productivity and performance metrics',
    required: false
  },
  {
    id: 'team_collaboration',
    name: 'Team Collaboration',
    description: 'Assign tasks and collaborate with team members',
    required: false
  }
];

// Export UI components separately for direct imports
export const WorkDashboardComponent = WorkDashboard;
export const WorkMobileQuickAddComponent = WorkMobileQuickAdd;
export const WorkDesktopDetailComponent = WorkDesktopDetail;
export const WorkSettingsComponent = WorkSettings;

// Main Work Module implementation
export const WorkModule: IModule = {
  id: 'work',
  name: 'Work Projects',
  version: '1.0.0',
  icon: 'briefcase',
  color: '#3B82F6',

  metadata: {
    id: 'work',
    name: 'Work Projects',
    version: '1.0.0',
    author: 'Goal Assistant Team',
    description: 'Comprehensive work project management with time tracking, career development, and performance analytics',
    keywords: ['work', 'projects', 'time-tracking', 'career', 'productivity', 'professional', 'tasks'],
    homepage: 'https://goalassistant.app/modules/work',
    repository: 'https://github.com/goalassistant/modules/work',
    license: 'MIT',
    minSystemVersion: '1.0.0',
    dependencies: {},
    peerDependencies: {}
  },

  components: {
    dashboard: WorkDashboard,
    mobileQuickAdd: WorkMobileQuickAdd,
    desktopDetail: WorkDesktopDetail,
    settings: WorkSettings
  },

  achievements: workAchievements,
  pointsConfig: workPointsConfig,
  capabilities: workCapabilities,

  permissions: [
    'read:work_data',
    'write:work_data',
    'read:time_data',
    'write:time_data',
    'read:career_data',
    'write:career_data',
    'read:performance_data',
    'write:performance_data'
  ],

  // API routes definition
  apiRoutes: {
    baseRoute: '/api/v1/modules/work',
    routes: [
      {
        path: '/',
        method: 'GET',
        handler: 'getWorkDashboard',
        permissions: ['read:work_data']
      },
      {
        path: '/',
        method: 'POST',
        handler: 'createWorkResource',
        permissions: ['write:work_data']
      },
      {
        path: '/',
        method: 'PUT',
        handler: 'updateWorkResource',
        permissions: ['write:work_data']
      },
      {
        path: '/',
        method: 'DELETE',
        handler: 'deleteWorkResource',
        permissions: ['write:work_data']
      }
    ]
  },

  // Lifecycle methods
  async onInstall(): Promise<void> {
    console.log('Installing Work Projects module...');
  },

  async onUninstall(): Promise<void> {
    console.log('Uninstalling Work Projects module...');
  },

  async onEnable(): Promise<void> {
    console.log('Enabling Work Projects module...');
  },

  async onDisable(): Promise<void> {
    console.log('Disabling Work Projects module...');
  },

  async onUpgrade(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Upgrading Work Projects module from ${fromVersion} to ${toVersion}...`);
  },

  async onConfigChange(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): Promise<void> {
    console.log('Work Projects module configuration changed:', { oldConfig, newConfig });
  }
};

// Export UI components for page access - Fix for module loading issues
(WorkModule as any).ui = {
  Dashboard: WorkDashboard,
  MobileQuickAdd: WorkMobileQuickAdd, 
  DesktopDetail: WorkDesktopDetail,
  Settings: WorkSettings
};