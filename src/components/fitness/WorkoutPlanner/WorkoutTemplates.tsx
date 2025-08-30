'use client'

import React, { useState } from 'react'
import { 
  Copy, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Star, 
  StarOff,
  MoreVertical,
  Play,
  Calendar,
  Dumbbell,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/base'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  workoutType: 'cardio' | 'strength' | 'flexibility' | 'mixed'
  estimatedDuration?: number
  isTemplate: boolean
  isFavorite?: boolean
  useCount?: number
  lastUsed?: Date
  createdAt: Date
  exercises: {
    id: string
    exerciseId: string
    orderIndex: number
    targetSets?: number
    targetReps?: number
    targetWeight?: number
    targetDuration?: number
    targetDistance?: number
    restBetweenSets?: number
    exercise: {
      name: string
      category: string
    }
  }[]
}

export interface WorkoutTemplatesProps {
  templates: WorkoutTemplate[]
  onTemplateUse: (template: WorkoutTemplate, date?: Date) => void
  onTemplateEdit: (template: WorkoutTemplate) => void
  onTemplateDelete: (template: WorkoutTemplate) => void
  onTemplateDuplicate: (template: WorkoutTemplate) => void
  onTemplateFavorite: (template: WorkoutTemplate, favorite: boolean) => void
  onTemplateCreate: () => void
  isLoading?: boolean
}

export function WorkoutTemplates({
  templates,
  onTemplateUse,
  onTemplateEdit,
  onTemplateDelete,
  onTemplateDuplicate,
  onTemplateFavorite,
  onTemplateCreate,
  isLoading = false
}: WorkoutTemplatesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null)
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd\'T\'09:00'))

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesType = selectedType === 'all' || template.workoutType === selectedType
    
    return matchesSearch && matchesType
  })

  const favoriteTemplates = filteredTemplates.filter(t => t.isFavorite)
  const recentTemplates = filteredTemplates
    .filter(t => t.lastUsed)
    .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
    .slice(0, 6)

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-blue-500 text-white'
      case 'cardio': return 'bg-red-500 text-white'
      case 'flexibility': return 'bg-green-500 text-white'
      case 'mixed': return 'bg-purple-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const handleScheduleTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(template)
    setShowScheduleDialog(true)
  }

  const handleConfirmSchedule = () => {
    if (selectedTemplate) {
      onTemplateUse(selectedTemplate, new Date(scheduleDate))
      setShowScheduleDialog(false)
      setSelectedTemplate(null)
    }
  }

  const TemplateCard = ({ template }: { template: WorkoutTemplate }) => (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base truncate">{template.name}</CardTitle>
              {template.isFavorite && (
                <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={cn('text-xs', getWorkoutTypeColor(template.workoutType))}
              >
                {template.workoutType}
              </Badge>
              {template.estimatedDuration && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {template.estimatedDuration}min
                </span>
              )}
            </div>

            {template.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {template.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{template.exercises.length} exercises</span>
              {template.useCount !== undefined && (
                <span>Used {template.useCount} times</span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onTemplateUse(template)}>
                <Play className="h-4 w-4 mr-2" />
                Use Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleScheduleTemplate(template)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onTemplateFavorite(template, !template.isFavorite)}
              >
                {template.isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove from Favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add to Favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTemplateEdit(template)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTemplateDuplicate(template)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onTemplateDelete(template)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            onClick={() => onTemplateUse(template)}
            size="sm"
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            Start Workout
          </Button>
          <Button
            onClick={() => handleScheduleTemplate(template)}
            size="sm"
            variant="outline"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

        {/* Exercise Preview */}
        {template.exercises.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Exercises:</h4>
            <div className="space-y-1">
              {template.exercises.slice(0, 3).map((exercise, index) => (
                <div key={exercise.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate">
                    {index + 1}. {exercise.exercise.name}
                  </span>
                  <span className="text-gray-500 ml-2 flex-shrink-0">
                    {exercise.targetSets && exercise.targetReps 
                      ? `${exercise.targetSets}×${exercise.targetReps}`
                      : exercise.targetDuration 
                        ? `${Math.round(exercise.targetDuration / 60)}min`
                        : ''}
                  </span>
                </div>
              ))}
              {template.exercises.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{template.exercises.length - 3} more exercises
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      <Button onClick={onTemplateCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Create Template
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workout Templates</h1>
          <p className="text-gray-600">
            Create reusable workout templates and start them anytime
          </p>
        </div>
        
        <Button onClick={onTemplateCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white min-w-[150px]"
        >
          <option value="all">All Types</option>
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
          <option value="flexibility">Flexibility</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      {/* Templates Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="recent">Recently Used</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredTemplates.length === 0 ? (
            <EmptyState message="Create your first workout template to get started" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {favoriteTemplates.length === 0 ? (
            <EmptyState message="Mark your favorite templates with a star to find them here" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {recentTemplates.length === 0 ? (
            <EmptyState message="Your recently used templates will appear here" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Workout</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTemplate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedTemplate.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="secondary"
                    className={cn('text-xs', getWorkoutTypeColor(selectedTemplate.workoutType))}
                  >
                    {selectedTemplate.workoutType}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {selectedTemplate.exercises.length} exercises
                  </span>
                  {selectedTemplate.estimatedDuration && (
                    <span className="text-sm text-gray-600">
                      • {selectedTemplate.estimatedDuration} min
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">Schedule Date & Time</label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowScheduleDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSchedule}
                className="flex-1"
              >
                Schedule Workout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}