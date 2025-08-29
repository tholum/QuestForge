/**
 * GoalDetail Component
 * 
 * Comprehensive goal information view with progress history visualization,
 * sub-goal management, activity timeline, and quick edit capabilities.
 */

"use client"

import React, { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  Target, 
  Flame,
  TrendingUp,
  Edit,
  Trash2,
  CheckCircle2,
  Plus,
  BarChart3,
  History,
  Trophy,
  MessageSquare,
  Share2,
  Download,
  MoreVertical,
  ArrowLeft
} from 'lucide-react'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, isBefore } from 'date-fns'

/**
 * Module configuration
 */
const MODULE_CONFIG = {
  fitness: { icon: '💪', label: 'Fitness', color: 'text-orange-600', bg: 'bg-orange-50' },
  learning: { icon: '📚', label: 'Learning', color: 'text-blue-600', bg: 'bg-blue-50' },
  home: { icon: '🏠', label: 'Home Projects', color: 'text-green-600', bg: 'bg-green-50' },
  bible: { icon: '✝️', label: 'Bible Study', color: 'text-purple-600', bg: 'bg-purple-50' },
  work: { icon: '💼', label: 'Work', color: 'text-indigo-600', bg: 'bg-indigo-50' }
} as const

/**
 * Priority configuration
 */
const PRIORITY_CONFIG = {
  low: { color: 'bg-gray-100 text-gray-700', icon: '⬇️' },
  medium: { color: 'bg-blue-100 text-blue-700', icon: '➡️' },
  high: { color: 'bg-yellow-100 text-yellow-700', icon: '⬆️' },
  urgent: { color: 'bg-red-100 text-red-700', icon: '🚨' }
} as const

/**
 * Difficulty configuration
 */
const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', xp: 50, color: 'bg-green-100 text-green-700', multiplier: '1x' },
  medium: { label: 'Medium', xp: 100, color: 'bg-yellow-100 text-yellow-700', multiplier: '1.5x' },
  hard: { label: 'Hard', xp: 200, color: 'bg-orange-100 text-orange-700', multiplier: '2x' },
  expert: { label: 'Expert', xp: 500, color: 'bg-red-100 text-red-700', multiplier: '3x' }
} as const

/**
 * Props interface
 */
interface GoalDetailProps {
  goal: GoalWithRelations
  onEdit?: (goal: GoalWithRelations) => void
  onDelete?: (goalId: string) => void
  onComplete?: (goalId: string) => void
  onBack?: () => void
  onAddSubGoal?: (parentGoalId: string) => void
  className?: string
  showBackButton?: boolean
}

/**
 * Calculate goal status
 */
function getGoalStatus(goal: GoalWithRelations): {
  status: 'completed' | 'in_progress' | 'pending' | 'overdue'
  color: string
  label: string
} {
  if (goal.isCompleted) {
    return { status: 'completed', color: 'text-green-600', label: 'Completed' }
  }
  
  if (goal.targetDate && isBefore(new Date(goal.targetDate), new Date())) {
    return { status: 'overdue', color: 'text-red-600', label: 'Overdue' }
  }
  
  if (goal.progress && goal.progress.length > 0) {
    return { status: 'in_progress', color: 'text-blue-600', label: 'In Progress' }
  }
  
  return { status: 'pending', color: 'text-gray-600', label: 'Not Started' }
}

/**
 * Calculate progress percentage
 */
function calculateProgress(goal: GoalWithRelations): number {
  if (goal.isCompleted) return 100
  
  if (!goal.progress || goal.progress.length === 0) return 0
  
  const latest = goal.progress[0]
  return Math.min(100, Math.max(0, (latest.value / latest.maxValue) * 100))
}

/**
 * Mock activity data (would come from API)
 */
const mockActivities = [
  {
    id: '1',
    type: 'progress',
    description: 'Updated progress to 75%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    xpGained: 25
  },
  {
    id: '2',
    type: 'created',
    description: 'Goal created',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    xpGained: 0
  }
]

/**
 * GoalDetail component
 */
export function GoalDetail({
  goal,
  onEdit,
  onDelete,
  onComplete,
  onBack,
  onAddSubGoal,
  className,
  showBackButton = true
}: GoalDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  const status = getGoalStatus(goal)
  const progress = calculateProgress(goal)
  const moduleConfig = MODULE_CONFIG[goal.moduleId as keyof typeof MODULE_CONFIG]
  const priorityConfig = PRIORITY_CONFIG[goal.priority as keyof typeof PRIORITY_CONFIG]
  const difficultyConfig = DIFFICULTY_CONFIG[goal.difficulty as keyof typeof DIFFICULTY_CONFIG]
  
  // Calculate total XP earned
  const totalXP = goal.progress?.reduce((total, p) => total + p.xpEarned, 0) || 0
  
  // Calculate streak (mock data)
  const streakCount = 5

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="sr-only">Go back</span>
                </Button>
              )}
              
              {moduleConfig && (
                <div className={cn("p-3 rounded-lg", moduleConfig.bg)}>
                  <span className="text-xl" role="img" aria-label={moduleConfig.label}>
                    {moduleConfig.icon}
                  </span>
                </div>
              )}
              
              <div>
                <h1 className="text-2xl font-bold">{goal.title}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className={status.color}>
                    {status.label}
                  </Badge>
                  <Badge className={priorityConfig.color}>
                    {priorityConfig.icon} {goal.priority}
                  </Badge>
                  <Badge variant="secondary" className={difficultyConfig.color}>
                    {difficultyConfig.label} ({difficultyConfig.multiplier})
                  </Badge>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!goal.isCompleted && (
                  <DropdownMenuItem onClick={() => onComplete?.(goal.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit?.(goal)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Goal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddSubGoal?.(goal.id)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sub-Goal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(goal.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">XP Earned</p>
                <p className="text-2xl font-bold">{totalXP}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{streakCount}</p>
              </div>
              <Flame className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sub-Goals</p>
                <p className="text-2xl font-bold">{goal._count?.subGoals || 0}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="subgoals">Sub-Goals</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* Description */}
                {goal.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {goal.description}
                    </p>
                  </div>
                )}
                
                {/* Goal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Goal Details</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Category</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{moduleConfig?.icon}</span>
                          <span>{moduleConfig?.label}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Priority</span>
                        <Badge className={priorityConfig.color}>
                          {priorityConfig.icon} {goal.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Difficulty</span>
                        <Badge className={difficultyConfig.color}>
                          {difficultyConfig.label}
                        </Badge>
                      </div>
                      
                      {goal.targetDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Target Date</span>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(goal.targetDate), 'PPP')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Timestamps</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Created</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(goal.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Updated</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(goal.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress Overview */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Progress Overview</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-bold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="progress" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Progress History</h3>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Progress
                  </Button>
                </div>
                
                {goal.progress && goal.progress.length > 0 ? (
                  <div className="space-y-3">
                    {goal.progress.map((progressEntry, index) => (
                      <Card key={progressEntry.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">
                                  {Math.round((progressEntry.value / progressEntry.maxValue) * 100)}% Complete
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(progressEntry.recordedAt), 'PPp')}
                              </p>
                              {progressEntry.notes && (
                                <p className="text-sm mt-2">{progressEntry.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">+{progressEntry.xpEarned} XP</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertDescription>
                      No progress entries yet. Start tracking your progress to see your journey!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="subgoals" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Sub-Goals</h3>
                  <Button size="sm" onClick={() => onAddSubGoal?.(goal.id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sub-Goal
                  </Button>
                </div>
                
                {goal.subGoals && goal.subGoals.length > 0 ? (
                  <div className="space-y-3">
                    {goal.subGoals.map((subGoal) => (
                      <Card key={subGoal.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                subGoal.isCompleted ? "bg-green-500" : "bg-gray-300"
                              )} />
                              <div>
                                <h4 className={cn(
                                  "font-medium",
                                  subGoal.isCompleted && "line-through text-muted-foreground"
                                )}>
                                  {subGoal.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(subGoal.createdAt), 'PPp')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{subGoal.priority}</Badge>
                              <Badge variant="secondary">{subGoal.difficulty}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      No sub-goals yet. Break down this goal into smaller, manageable tasks!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Activity Timeline</h3>
                
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      {activity.xpGained > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{activity.xpGained} XP
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
}

export default GoalDetail