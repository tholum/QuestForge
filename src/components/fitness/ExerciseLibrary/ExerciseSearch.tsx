/**
 * ExerciseSearch Component
 * 
 * Advanced search and filtering interface for exercise library
 * with category selection, muscle group filters, and equipment filters.
 */
'use client'

import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/base/Button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EXERCISE_CATEGORIES, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/fitness/constants'
import type { ExerciseSearchProps } from '@/lib/fitness/types'

export function ExerciseSearch({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  exerciseCount,
  filters = {},
  onFiltersChange
}: ExerciseSearchProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    const current = filters.muscleGroups || []
    const updated = current.includes(muscleGroup)
      ? current.filter(mg => mg !== muscleGroup)
      : [...current, muscleGroup]
    
    onFiltersChange?.({ ...filters, muscleGroups: updated })
  }

  const handleEquipmentChange = (equipment: string) => {
    const current = filters.equipment || []
    const updated = current.includes(equipment)
      ? current.filter(eq => eq !== equipment)
      : [...current, equipment]
    
    onFiltersChange?.({ ...filters, equipment: updated })
  }

  const clearFilters = () => {
    onSearchChange('')
    onCategoryChange('all')
    onFiltersChange?.({})
    setShowAdvancedFilters(false)
  }

  const hasActiveFilters = searchTerm || 
    selectedCategory !== 'all' || 
    (filters.muscleGroups && filters.muscleGroups.length > 0) ||
    (filters.equipment && filters.equipment.length > 0) ||
    filters.difficulty

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EXERCISE_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          leftIcon={<Filter className="h-4 w-4" />}
        >
          Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 space-y-4">
          {/* Muscle Groups */}
          <div>
            <label className="text-sm font-medium mb-2 block">Muscle Groups</label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(muscleGroup => (
                <Badge
                  key={muscleGroup}
                  variant={filters.muscleGroups?.includes(muscleGroup) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors hover:bg-primary/10"
                  onClick={() => handleMuscleGroupToggle(muscleGroup)}
                >
                  {muscleGroup.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-sm font-medium mb-2 block">Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_TYPES.map(equipment => (
                <Badge
                  key={equipment}
                  variant={filters.equipment?.includes(equipment) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors hover:bg-primary/10"
                  onClick={() => handleEquipmentChange(equipment)}
                >
                  {equipment.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium mb-2 block">Difficulty</label>
            <Select 
              value={filters.difficulty || ''} 
              onValueChange={(value) => onFiltersChange?.({ ...filters, difficulty: value || undefined })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Any difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any difficulty</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Only Filter */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.userOnly || false}
                onChange={(e) => onFiltersChange?.({ ...filters, userOnly: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">Show only my custom exercises</span>
            </label>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <span>
          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} found
        </span>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            leftIcon={<X className="h-4 w-4" />}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchTerm}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onSearchChange('')}
              />
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {selectedCategory}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onCategoryChange('all')}
              />
            </Badge>
          )}
          {filters.difficulty && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Difficulty: {filters.difficulty}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange?.({ ...filters, difficulty: undefined })}
              />
            </Badge>
          )}
          {filters.muscleGroups && filters.muscleGroups.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.muscleGroups.length} Muscle Group{filters.muscleGroups.length !== 1 ? 's' : ''}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange?.({ ...filters, muscleGroups: [] })}
              />
            </Badge>
          )}
          {filters.equipment && filters.equipment.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.equipment.length} Equipment Type{filters.equipment.length !== 1 ? 's' : ''}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange?.({ ...filters, equipment: [] })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}