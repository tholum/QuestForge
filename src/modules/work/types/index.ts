/**
 * Work Module Types
 */

export interface WorkDashboardData {
  activeProjects: WorkProjectWithProgress[]
  todayTasks: {
    total: number
    completed: number
    remaining: number
  }
  weekTimeTracked: number
  upcomingDeadlines: TaskWithProject[]
  careerGoals: CareerGoalData[]
  recentMetrics: PerformanceMetricData[]
  overdueTasks: TaskWithProject[]
  stats: {
    totalActiveProjects: number
    weekHours: number
    overdueTaskCount: number
    completedCareerGoals: number
  }
}

export interface WorkProjectWithProgress {
  id: string
  name: string
  description?: string
  projectType: string
  status: string
  priority: string
  startDate?: Date
  endDate?: Date
  estimatedHours?: number
  actualHours: number
  budget?: number
  clientName?: string
  progress: number
  completedTasks: number
  totalTasks: number
  totalTimeMinutes: number
  completedMilestones: number
  totalMilestones: number
  daysRemaining?: number
  isOverdue: boolean
  tasks?: TaskData[]
  timeEntries?: TimeEntryData[]
  milestones?: MilestoneData[]
}

export interface TaskWithProject {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: Date
  projectName: string
  daysUntilDue: number
  isOverdue: boolean
}

export interface TaskData {
  id: string
  projectId: string
  parentTaskId?: string
  title: string
  description?: string
  status: string
  priority: string
  estimatedHours?: number
  actualHours: number
  assignedTo?: string
  dueDate?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntryData {
  id: string
  projectId: string
  taskId?: string
  description?: string
  startTime: Date
  endTime?: Date
  durationMinutes?: number
  hourlyRate?: number
  isBillable: boolean
  entryDate: Date
  project?: {
    id: string
    name: string
  }
  task?: {
    id: string
    title: string
  }
}

export interface CareerGoalData {
  id: string
  category: string
  title: string
  description?: string
  currentLevel?: string
  targetLevel?: string
  targetDate?: Date
  isCompleted: boolean
  completedAt?: Date
  evidence?: any
  goal?: {
    id: string
    title: string
  }
}

export interface PerformanceMetricData {
  id: string
  metricType: string
  metricName: string
  value: number
  targetValue?: number
  unit?: string
  period: string
  recordDate: Date
  notes?: string
}

export interface MilestoneData {
  id: string
  projectId: string
  title: string
  description?: string
  dueDate: Date
  completedAt?: Date
  isCompleted: boolean
  priority: string
}

export interface WorkModuleConfig {
  defaultProjectType: 'client' | 'internal' | 'personal' | 'team'
  enableTimeTracking: boolean
  enableCareerGoals: boolean
  enablePerformanceMetrics: boolean
  defaultHourlyRate?: number
  enableBillableTracking: boolean
  autoCreateGoalsForProjects: boolean
  enableProjectTemplates: boolean
  enableTeamCollaboration: boolean
  workingHoursStart: string // e.g., "09:00"
  workingHoursEnd: string // e.g., "17:00"
  reminderSettings: {
    enableDailyTimeLog: boolean
    enableProjectDeadlines: boolean
    enableCareerGoalReminders: boolean
    reminderTime: string
  }
  analyticsSettings: {
    enableProductivityTracking: boolean
    enableTimeAnalytics: boolean
    enablePerformanceReports: boolean
    reportFrequency: 'weekly' | 'monthly' | 'quarterly'
  }
}

export interface ProjectTemplate {
  id: string
  name: string
  description?: string
  projectType: string
  estimatedHours?: number
  tasks: {
    title: string
    description?: string
    estimatedHours?: number
    priority: string
  }[]
  milestones: {
    title: string
    description?: string
    offsetDays: number // Days from project start
    priority: string
  }[]
}

export interface WorkAnalytics {
  totalProjects: number
  completedProjects: number
  activeProjects: number
  completionRate: number
  totalTimeMinutes: number
  totalTimeHours: number
  averageCompletionDays: number
  productivityTrends: {
    period: string
    hoursTracked: number
    tasksCompleted: number
    projectsCompleted: number
  }[]
  performanceMetrics: {
    type: string
    average: number
    trend: 'up' | 'down' | 'stable'
    periods: {
      period: string
      value: number
    }[]
  }[]
}

export interface TimeTrackingSession {
  id: string
  projectId: string
  taskId?: string
  description?: string
  startTime: Date
  isRunning: boolean
  elapsedMinutes: number
}