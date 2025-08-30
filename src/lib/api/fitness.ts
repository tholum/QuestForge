/**
 * Fitness API Client
 * 
 * Provides methods for interacting with the fitness module API endpoints
 * following the established pattern from the work module API client.
 */

const BASE_URL = '/api/v1/modules/fitness'

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  
  const data = await response.json()
  return data.success ? data.data : data
}

// Helper function to make API requests with auth
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // Add auth header if available
      ...(typeof window !== 'undefined' && localStorage.getItem('auth_token') 
        ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        : {}
      )
    }
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  })

  return handleResponse<T>(response)
}

export const fitnessApi = {
  // Dashboard data
  async getDashboardData(userId: string) {
    return apiRequest(`?type=dashboard&userId=${userId}`)
  },

  // Workout Plans
  async getWorkoutPlans(params: { userId: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    query.append('type', 'workout-plans')
    query.append('userId', params.userId)
    if (params.status) query.append('status', params.status)
    if (params.page) query.append('page', params.page.toString())
    if (params.limit) query.append('limit', params.limit.toString())

    return apiRequest(`?${query.toString()}`)
  },

  async getWorkoutPlan(planId: string) {
    return apiRequest(`?type=workout-plan&id=${planId}`)
  },

  async createWorkoutPlan(data: any) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({ type: 'workout-plan', ...data })
    })
  },

  async updateWorkoutPlan(planId: string, data: any) {
    return apiRequest('', {
      method: 'PUT',
      body: JSON.stringify({ type: 'workout-plan', id: planId, ...data })
    })
  },

  async deleteWorkoutPlan(planId: string) {
    return apiRequest(`?type=workout-plan&id=${planId}`, {
      method: 'DELETE'
    })
  },

  // Workouts
  async getWorkouts(params: { 
    userId: string; 
    planId?: string; 
    date?: string; 
    status?: string; 
    limit?: number 
  }) {
    const query = new URLSearchParams()
    query.append('type', 'workouts')
    query.append('userId', params.userId)
    if (params.planId) query.append('planId', params.planId)
    if (params.date) query.append('date', params.date)
    if (params.status) query.append('status', params.status)
    if (params.limit) query.append('limit', params.limit.toString())

    return apiRequest(`?${query.toString()}`)
  },

  async getWorkout(workoutId: string) {
    return apiRequest(`?type=workout&id=${workoutId}`)
  },

  async createWorkout(data: any) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({ type: 'workout', ...data })
    })
  },

  async updateWorkout(workoutId: string, data: any) {
    return apiRequest('', {
      method: 'PUT',
      body: JSON.stringify({ type: 'workout', id: workoutId, ...data })
    })
  },

  async deleteWorkout(workoutId: string) {
    return apiRequest(`?type=workout&id=${workoutId}`, {
      method: 'DELETE'
    })
  },

  async executeWorkout(workoutId: string) {
    // Get workout with all exercise details for execution
    return this.getWorkout(workoutId)
  },

  async completeWorkout(workoutId: string) {
    return apiRequest('', {
      method: 'PUT',
      body: JSON.stringify({ 
        type: 'workout-complete', 
        id: workoutId,
        completedAt: new Date().toISOString()
      })
    })
  },

  // Exercise Templates
  async getExerciseTemplates(params: {
    category?: string;
    search?: string;
    includeCustom?: boolean;
    userId?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams()
    query.append('type', 'exercise-templates')
    if (params.category) query.append('category', params.category)
    if (params.search) query.append('search', params.search)
    if (params.includeCustom) query.append('includeCustom', 'true')
    if (params.userId) query.append('userId', params.userId)
    if (params.limit) query.append('limit', params.limit.toString())

    return apiRequest(`?${query.toString()}`)
  },

  async createExerciseTemplate(data: any) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({ type: 'exercise-template', ...data })
    })
  },

  async updateExerciseTemplate(templateId: string, data: any) {
    return apiRequest('', {
      method: 'PUT',
      body: JSON.stringify({ type: 'exercise-template', id: templateId, ...data })
    })
  },

  async deleteExerciseTemplate(templateId: string) {
    return apiRequest(`?type=exercise-template&id=${templateId}`, {
      method: 'DELETE'
    })
  },

  // Workout Exercises
  async addExerciseToWorkout(data: any) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({ type: 'workout-exercise', ...data })
    })
  },

  async updateWorkoutExercise(exerciseId: string, data: any) {
    return apiRequest('', {
      method: 'PUT',
      body: JSON.stringify({ type: 'workout-exercise', id: exerciseId, ...data })
    })
  },

  async removeExerciseFromWorkout(exerciseId: string) {
    return apiRequest(`?type=workout-exercise&id=${exerciseId}`, {
      method: 'DELETE'
    })
  },

  // Workout Sets
  async saveWorkoutSet(exerciseId: string, setData: any) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'workout-set', 
        workoutExerciseId: exerciseId,
        ...setData 
      })
    })
  },

  async updateWorkoutSet(setId: string, data: any) {
    return apiRequest('', {
      method: 'PUT',
      body: JSON.stringify({ type: 'workout-set', id: setId, ...data })
    })
  },

  // Copy Operations
  async copyWorkout(sourceWorkoutId: string, targetDate: Date) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        type: 'copy-workout',
        sourceWorkoutId,
        targetDate: targetDate.toISOString()
      })
    })
  },

  async copyDay(sourceDate: Date, targetDate: Date) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        type: 'copy-day',
        sourceDate: sourceDate.toISOString(),
        targetDate: targetDate.toISOString()
      })
    })
  },

  async copyWeek(sourceWeekStart: Date, targetWeekStart: Date) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        type: 'copy-week',
        sourceWeekStart: sourceWeekStart.toISOString(),
        targetWeekStart: targetWeekStart.toISOString()
      })
    })
  },

  // Personal Records
  async getPersonalRecords(params: {
    userId: string;
    exerciseId?: string;
    recordType?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams()
    query.append('type', 'personal-records')
    query.append('userId', params.userId)
    if (params.exerciseId) query.append('exerciseId', params.exerciseId)
    if (params.recordType) query.append('recordType', params.recordType)
    if (params.limit) query.append('limit', params.limit.toString())

    return apiRequest(`?${query.toString()}`)
  },

  // Analytics
  async getAnalytics(userId: string, period: string = 'week') {
    return apiRequest(`?type=analytics&userId=${userId}&period=${period}`)
  },

  // Template Operations
  async getWorkoutTemplates(params: { userId: string }) {
    return apiRequest(`?type=workout-templates&userId=${params.userId}`)
  },

  async favoriteTemplate(templateId: string, favorite: boolean) {
    return apiRequest('', {
      method: 'PUT',
      body: JSON.stringify({
        type: 'workout-template-favorite',
        id: templateId,
        favorite
      })
    })
  },

  async deleteWorkoutTemplate(templateId: string) {
    return apiRequest(`?type=workout-template&id=${templateId}`, {
      method: 'DELETE'
    })
  },

  async duplicateWorkoutTemplate(templateId: string) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        type: 'duplicate-workout-template',
        sourceTemplateId: templateId
      })
    })
  },

  // Exercise Copy Operations
  async copyExercise(sourceExerciseId: string, targetWorkoutId: string, orderIndex?: number) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        type: 'copy-exercise',
        sourceExerciseId,
        targetWorkoutId,
        orderIndex
      })
    })
  },

  async copyExercises(sourceWorkoutId: string, targetWorkoutId: string, exerciseIds?: string[]) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        type: 'copy-exercises',
        sourceWorkoutId,
        targetWorkoutId,
        exerciseIds
      })
    })
  },

  // Recurring Pattern Operations
  async createRecurringPattern(data: {
    name: string
    description?: string
    workoutTemplateId: string
    frequency: 'daily' | 'weekly' | 'custom'
    daysOfWeek?: number[]
    timesPerWeek?: number
    duration?: number
    startDate: Date
    endDate?: Date
  }) {
    return apiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        type: 'recurring-pattern',
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString()
      })
    })
  }
}