/**
 * ExerciseCard Component
 * 
 * Displays exercise information in both grid and list view formats
 * with actions for selection, editing, and management.
 */

import React from 'react'
import { MoreVertical, Play, Edit, Trash2, Copy, Dumbbell, Timer } from 'lucide-react'
import { DataCard, StatusBadge } from '@/components/base'
import { Button } from '@/components/base/Button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { ExerciseCardProps } from '@/lib/fitness/types'

export function ExerciseCard({ 
  exercise, 
  onSelect, 
  onEdit, 
  onDelete,
  onDuplicate,
  selectionMode = false,
  viewMode = 'grid' 
}: ExerciseCardProps) {
  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect(exercise)
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      cardio: Timer,
      chest: Dumbbell,
      back: Dumbbell,
      legs: Dumbbell,
      shoulders: Dumbbell,
      arms: Dumbbell,
      core: Dumbbell,
      flexibility: Dumbbell,
      'full-body': Dumbbell
    }
    const IconComponent = icons[category as keyof typeof icons] || Dumbbell
    return <IconComponent className="h-4 w-4" />
  }

  const getCategoryColor = (category: string): any => {
    const colors = {
      chest: 'red',
      back: 'blue', 
      legs: 'green',
      shoulders: 'orange',
      arms: 'purple',
      core: 'yellow',
      cardio: 'pink',
      flexibility: 'indigo',
      'full-body': 'gray'
    }
    return colors[category as keyof typeof colors] || 'gray'
  }

  const getDifficultyColor = (difficulty?: string): any => {
    const colors = {
      beginner: 'green',
      intermediate: 'yellow',
      advanced: 'red'
    }
    return colors[difficulty as keyof typeof colors] || 'gray'
  }

  if (viewMode === 'list') {
    return (
      <div className="flex items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
        {/* Exercise Image/Icon */}
        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
          {exercise.imageUrl ? (
            <img 
              src={exercise.imageUrl} 
              alt={exercise.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            getCategoryIcon(exercise.category)
          )}
        </div>

        {/* Exercise Info */}
        <div className="flex-1 ml-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{exercise.name}</h3>
            {exercise.isCustom && <Badge variant="outline" size="sm">Custom</Badge>}
            {exercise.difficulty && (
              <StatusBadge 
                status={exercise.difficulty as any}
                variant={getDifficultyColor(exercise.difficulty)}
                size="sm"
                customLabel={exercise.difficulty}
                showIcon={false}
              />
            )}
          </div>
          
          {exercise.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{exercise.description}</p>
          )}
          
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={exercise.category}
              variant={getCategoryColor(exercise.category)}
              size="sm"
              customLabel={exercise.category}
              customIcon={getCategoryIcon(exercise.category)}
            />
            {exercise.muscleGroups.slice(0, 2).map((muscle, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {muscle}
              </Badge>
            ))}
            {exercise.muscleGroups.length > 2 && (
              <Badge variant="secondary" size="sm">
                +{exercise.muscleGroups.length - 2} more
              </Badge>
            )}
          </div>
          
          {exercise.equipmentNeeded && (
            <div className="mt-1">
              <span className="text-xs text-gray-500">Equipment: {exercise.equipmentNeeded}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {selectionMode ? (
            <Button 
              onClick={handleCardClick}
              size="sm"
            >
              Select
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect?.(exercise)}
                leftIcon={<Play className="h-4 w-4" />}
              >
                Use
              </Button>
              
              {(onEdit || onDelete || onDuplicate) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(exercise)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(exercise)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {onDelete && exercise.isCustom && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(exercise)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Grid view (card format)
  return (
    <DataCard
      title={exercise.name}
      description={exercise.description}
      badge={exercise.isCustom ? { text: 'Custom', variant: 'secondary' } : undefined}
      metadata={[
        { 
          icon: getCategoryIcon(exercise.category), 
          label: 'Category', 
          value: exercise.category 
        },
        { 
          icon: <Dumbbell className="h-4 w-4" />, 
          label: 'Muscle Groups', 
          value: exercise.muscleGroups.length.toString()
        },
        ...(exercise.equipmentNeeded ? [{
          label: 'Equipment',
          value: exercise.equipmentNeeded
        }] : []),
        ...(exercise.difficulty ? [{
          label: 'Difficulty',
          value: exercise.difficulty
        }] : [])
      ]}
      actions={[
        {
          label: selectionMode ? 'Select' : 'Use Exercise',
          icon: selectionMode ? undefined : <Play className="h-4 w-4" />,
          onClick: () => onSelect?.(exercise),
          variant: 'default'
        },
        ...(onEdit && !selectionMode ? [{
          label: 'Edit',
          icon: <Edit className="h-4 w-4" />,
          onClick: () => onEdit(exercise),
          variant: 'ghost' as const
        }] : [])
      ]}
      interactive={true}
      onClick={handleCardClick}
      className={`transition-all ${
        selectionMode 
          ? 'cursor-pointer hover:ring-2 hover:ring-primary' 
          : ''
      }`}
      showMenu={!selectionMode && (onEdit || onDelete || onDuplicate) ? true : false}
      onMenuClick={() => {
        // Menu actions handled by dropdown in actions
      }}
    />
  )
}