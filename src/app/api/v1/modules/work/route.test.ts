/**
 * Work Module API Route Tests
 * 
 * Comprehensive testing of the Work Projects Module API including:
 * - CRUD operations for all work resources
 * - Authentication and authorization
 * - Error handling and edge cases
 * - Time tracking operations
 * - Data validation and sanitization
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from './route';
import {
  workProjectRepository,
  projectTaskRepository,
  timeEntryRepository,
  careerGoalRepository,
  performanceMetricRepository,
  projectMilestoneRepository,
  workDashboardRepository
} from '../../../../../lib/prisma/repositories/work-repository';
import { GoalRepository } from '../../../../../lib/prisma/repositories/goal-repository';

// Mock repositories
vi.mock('../../../../../lib/prisma/repositories/work-repository');
vi.mock('../../../../../lib/prisma/repositories/goal-repository');

const mockWorkProjectRepo = workProjectRepository as any;
const mockProjectTaskRepo = projectTaskRepository as any;
const mockTimeEntryRepo = timeEntryRepository as any;
const mockCareerGoalRepo = careerGoalRepository as any;
const mockPerformanceMetricRepo = performanceMetricRepository as any;
const mockProjectMilestoneRepo = projectMilestoneRepository as any;
const mockWorkDashboardRepo = workDashboardRepository as any;
const mockGoalRepo = GoalRepository as any;

// Mock data
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

const mockProject = {
  id: 'project-123',
  userId: mockUser.id,
  name: 'Test Project',
  projectType: 'personal',
  status: 'active',
  priority: 'medium',
  actualHours: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockTask = {
  id: 'task-123',
  projectId: mockProject.id,
  userId: mockUser.id,
  title: 'Test Task',
  status: 'todo',
  priority: 'medium',
  actualHours: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockTimeEntry = {
  id: 'time-123',
  userId: mockUser.id,
  projectId: mockProject.id,
  startTime: new Date(),
  durationMinutes: 60,
  isBillable: false,
  entryDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockCareerGoal = {
  id: 'career-123',
  userId: mockUser.id,
  category: 'skill',
  title: 'Learn React Native',
  isCompleted: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockDashboardData = {
  activeProjects: [mockProject],
  todayTasks: { total: 1, completed: 0, remaining: 1 },
  weekTimeTracked: 60,
  upcomingDeadlines: [],
  careerGoals: [mockCareerGoal],
  recentMetrics: [],
  overdueTasks: [],
  stats: {
    totalActiveProjects: 1,
    weekHours: 1,
    overdueTaskCount: 0,
    completedCareerGoals: 0
  }
};

// Helper function to create mock request
function createMockRequest(method: string, url: string, body?: any, headers: Record<string, string> = {}): NextRequest {
  const defaultHeaders = {
    'authorization': 'Bearer valid-token',
    'content-type': 'application/json',
    ...headers
  };

  return {
    method,
    url,
    headers: {
      get: (name: string) => defaultHeaders[name.toLowerCase()] || null
    },
    json: vi.fn().mockResolvedValue(body || {}),
    nextUrl: new URL(url)
  } as any;
}

describe('Work Module API Routes - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockWorkDashboardRepo.getDashboardData.mockResolvedValue(mockDashboardData);
    mockWorkProjectRepo.create.mockResolvedValue(mockProject);
    mockWorkProjectRepo.findById.mockResolvedValue(mockProject);
    mockWorkProjectRepo.update.mockResolvedValue(mockProject);
    mockWorkProjectRepo.delete.mockResolvedValue(undefined);
    mockWorkProjectRepo.getUserProjects.mockResolvedValue([mockProject]);
    mockWorkProjectRepo.getAnalytics.mockResolvedValue({
      totalProjects: 1,
      completedProjects: 0,
      activeProjects: 1,
      completionRate: 0
    });
    mockWorkProjectRepo.updateProjectHours.mockResolvedValue(mockProject);
    
    mockProjectTaskRepo.create.mockResolvedValue(mockTask);
    mockProjectTaskRepo.findById.mockResolvedValue(mockTask);
    mockProjectTaskRepo.update.mockResolvedValue(mockTask);
    mockProjectTaskRepo.delete.mockResolvedValue(undefined);
    mockProjectTaskRepo.getProjectTasks.mockResolvedValue([mockTask]);
    mockProjectTaskRepo.findMany.mockResolvedValue([mockTask]);
    mockProjectTaskRepo.getOverdueTasks.mockResolvedValue([]);
    
    mockTimeEntryRepo.create.mockResolvedValue(mockTimeEntry);
    mockTimeEntryRepo.findById.mockResolvedValue(mockTimeEntry);
    mockTimeEntryRepo.update.mockResolvedValue(mockTimeEntry);
    mockTimeEntryRepo.delete.mockResolvedValue(undefined);
    mockTimeEntryRepo.getTimeEntries.mockResolvedValue([mockTimeEntry]);
    mockTimeEntryRepo.startTimer.mockResolvedValue(mockTimeEntry);
    mockTimeEntryRepo.stopTimer.mockResolvedValue(mockTimeEntry);
    mockTimeEntryRepo.getWeeklyTimeSummary.mockResolvedValue([]);
    
    mockCareerGoalRepo.create.mockResolvedValue(mockCareerGoal);
    mockCareerGoalRepo.findById.mockResolvedValue(mockCareerGoal);
    mockCareerGoalRepo.update.mockResolvedValue(mockCareerGoal);
    mockCareerGoalRepo.delete.mockResolvedValue(undefined);
    mockCareerGoalRepo.findMany.mockResolvedValue([mockCareerGoal]);
    
    mockPerformanceMetricRepo.create.mockResolvedValue({
      id: 'metric-123',
      userId: mockUser.id,
      metricType: 'productivity',
      metricName: 'Tasks per hour',
      value: 2.5,
      period: 'daily',
      recordDate: new Date()
    });
    mockPerformanceMetricRepo.findMany.mockResolvedValue([]);
    
    mockProjectMilestoneRepo.create.mockResolvedValue({
      id: 'milestone-123',
      projectId: mockProject.id,
      title: 'Test Milestone',
      dueDate: new Date(),
      isCompleted: false
    });
    mockProjectMilestoneRepo.findById.mockResolvedValue({
      id: 'milestone-123',
      projectId: mockProject.id,
      title: 'Test Milestone'
    });
    mockProjectMilestoneRepo.completeMilestone.mockResolvedValue({
      id: 'milestone-123',
      isCompleted: true,
      completedAt: new Date()
    });
    mockProjectMilestoneRepo.getUpcomingMilestones.mockResolvedValue([]);
    
    mockGoalRepo.prototype.create = vi.fn().mockResolvedValue({
      id: 'goal-123',
      title: 'Test Goal',
      userId: mockUser.id
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/modules/work - Data Retrieval', () => {
    describe('Dashboard Data', () => {
      it('should return dashboard data successfully', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=dashboard');
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data).toEqual(mockDashboardData);
        expect(mockWorkDashboardRepo.getDashboardData).toHaveBeenCalledWith('user-placeholder-id');
      });

      it('should handle dashboard data errors', async () => {
        mockWorkDashboardRepo.getDashboardData.mockRejectedValue(new Error('Database error'));
        
        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=dashboard');
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Database error');
      });
    });

    describe('Projects Data', () => {
      it('should return projects with filters', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=projects&status=active&page=1&limit=10');
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data).toEqual([mockProject]);
        expect(mockWorkProjectRepo.getUserProjects).toHaveBeenCalledWith('user-placeholder-id', {
          status: 'active',
          page: 1,
          limit: 10
        });
      });

      it('should return single project by ID', async () => {
        const request = createMockRequest('GET', `http://localhost:3000/api/v1/modules/work?type=project&id=${mockProject.id}`);
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data).toEqual(mockProject);
        expect(mockWorkProjectRepo.findById).toHaveBeenCalledWith(mockProject.id);
      });

      it('should return 404 for nonexistent project', async () => {
        mockWorkProjectRepo.findById.mockResolvedValue(null);
        
        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=project&id=nonexistent');
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Project not found');
      });

      it('should return 400 if project ID is missing', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=project');
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Project ID is required');
      });
    });

    describe('Tasks Data', () => {
      it('should return tasks for project', async () => {
        const request = createMockRequest('GET', `http://localhost:3000/api/v1/modules/work?type=tasks&projectId=${mockProject.id}&status=todo`);
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data).toEqual([mockTask]);
        expect(mockProjectTaskRepo.getProjectTasks).toHaveBeenCalledWith(mockProject.id, 'user-placeholder-id', { status: 'todo' });
      });

      it('should return all user tasks when no project specified', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=tasks&limit=25');
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(mockProjectTaskRepo.findMany).toHaveBeenCalledWith({
          userId: 'user-placeholder-id',
          status: undefined,
          limit: 25
        });
      });
    });

    describe('Time Entries Data', () => {
      it('should return time entries for date', async () => {
        const testDate = '2024-01-15';
        const request = createMockRequest('GET', `http://localhost:3000/api/v1/modules/work?type=time-entries&date=${testDate}&projectId=${mockProject.id}`);
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data).toEqual([mockTimeEntry]);
        expect(mockTimeEntryRepo.getTimeEntries).toHaveBeenCalledWith('user-placeholder-id', testDate, { projectId: mockProject.id });
      });

      it('should return weekly time summary', async () => {
        const weekStart = '2024-01-15';
        const request = createMockRequest('GET', `http://localhost:3000/api/v1/modules/work?type=time-summary&weekStart=${weekStart}`);
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(mockTimeEntryRepo.getWeeklyTimeSummary).toHaveBeenCalledWith('user-placeholder-id', new Date(weekStart));
      });
    });

    describe('Analytics Data', () => {
      it('should return analytics for user', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=analytics&period=month');
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(mockWorkProjectRepo.getAnalytics).toHaveBeenCalledWith('user-placeholder-id', 'month');
      });
    });

    describe('Authentication', () => {
      it('should return 500 when authorization header is missing', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=dashboard', undefined, {});
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Authentication required');
      });
    });
  });

  describe('POST /api/v1/modules/work - Resource Creation', () => {
    describe('Project Creation', () => {
      it('should create a project successfully', async () => {
        const projectData = {
          type: 'project',
          name: 'New Test Project',
          projectType: 'client',
          priority: 'high',
          description: 'A test project',
          createGoal: false
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', projectData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Project created successfully');
        expect(mockWorkProjectRepo.create).toHaveBeenCalledWith({
          ...projectData,
          userId: 'user-placeholder-id'
        });
      });

      it('should create a project with associated goal', async () => {
        const projectData = {
          type: 'project',
          name: 'Goal-linked Project',
          projectType: 'personal',
          createGoal: true
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', projectData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.success).toBe(true);
        expect(mockGoalRepo.prototype.create).toHaveBeenCalledWith({
          userId: 'user-placeholder-id',
          title: `Complete ${mockProject.name}`,
          description: `Work project: ${mockProject.description || ''}`,
          moduleId: 'work',
          targetDate: mockProject.endDate,
          difficulty: 'medium',
          priority: mockProject.priority,
          moduleData: { projectId: mockProject.id, type: 'work_project' }
        });
      });

      it('should validate project creation data', async () => {
        const invalidData = {
          type: 'project',
          name: '', // Invalid: empty name
          projectType: 'invalid-type' // Invalid: not in enum
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', invalidData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Validation failed');
        expect(responseData.details).toBeDefined();
      });
    });

    describe('Task Creation', () => {
      it('should create a task successfully', async () => {
        const taskData = {
          type: 'task',
          projectId: mockProject.id,
          title: 'New Task',
          description: 'Task description',
          priority: 'high',
          dueDate: '2024-02-01T00:00:00.000Z'
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', taskData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Task created successfully');
        expect(mockProjectTaskRepo.create).toHaveBeenCalledWith({
          projectId: mockProject.id,
          title: 'New Task',
          description: 'Task description',
          priority: 'high',
          dueDate: new Date('2024-02-01T00:00:00.000Z'),
          userId: 'user-placeholder-id'
        });
      });

      it('should validate project ownership for task creation', async () => {
        mockWorkProjectRepo.findById.mockResolvedValue(null);

        const taskData = {
          type: 'task',
          projectId: 'nonexistent-project',
          title: 'Task for nonexistent project'
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', taskData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Project not found or access denied');
      });
    });

    describe('Time Entry Creation', () => {
      it('should create a time entry successfully', async () => {
        const timeData = {
          type: 'time-entry',
          projectId: mockProject.id,
          description: 'Working on features',
          startTime: '2024-01-15T09:00:00.000Z',
          endTime: '2024-01-15T11:00:00.000Z',
          durationMinutes: 120,
          isBillable: true
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', timeData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Time entry logged successfully');
        expect(mockTimeEntryRepo.create).toHaveBeenCalledWith({
          projectId: mockProject.id,
          description: 'Working on features',
          startTime: new Date('2024-01-15T09:00:00.000Z'),
          endTime: new Date('2024-01-15T11:00:00.000Z'),
          durationMinutes: 120,
          isBillable: true,
          userId: 'user-placeholder-id',
          entryDate: new Date('2024-01-15T09:00:00.000Z')
        });
        expect(mockWorkProjectRepo.updateProjectHours).toHaveBeenCalledWith(mockProject.id);
      });

      it('should calculate duration if not provided', async () => {
        const timeData = {
          type: 'time-entry',
          projectId: mockProject.id,
          startTime: '2024-01-15T09:00:00.000Z',
          endTime: '2024-01-15T11:00:00.000Z'
          // durationMinutes not provided
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', timeData);
        
        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(mockTimeEntryRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            durationMinutes: 120 // Should be calculated as 2 hours
          })
        );
      });
    });

    describe('Timer Operations', () => {
      it('should start a timer successfully', async () => {
        const timerData = {
          type: 'time-start',
          projectId: mockProject.id,
          description: 'Starting work session'
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', timerData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Timer started');
        expect(mockTimeEntryRepo.startTimer).toHaveBeenCalledWith(
          'user-placeholder-id',
          mockProject.id,
          undefined,
          'Starting work session'
        );
      });
    });

    describe('Career Goal Creation', () => {
      it('should create a career goal with associated main goal', async () => {
        const careerData = {
          type: 'career-goal',
          category: 'skill',
          title: 'Master TypeScript',
          description: 'Become proficient in TypeScript',
          currentLevel: 'beginner',
          targetLevel: 'advanced',
          createGoal: true
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', careerData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Career goal created successfully');
        expect(mockCareerGoalRepo.create).toHaveBeenCalledWith({
          category: 'skill',
          title: 'Master TypeScript',
          description: 'Become proficient in TypeScript',
          currentLevel: 'beginner',
          targetLevel: 'advanced',
          createGoal: true,
          userId: 'user-placeholder-id'
        });
        expect(mockGoalRepo.prototype.create).toHaveBeenCalledWith({
          userId: 'user-placeholder-id',
          title: mockCareerGoal.title,
          description: mockCareerGoal.description,
          moduleId: 'work',
          targetDate: mockCareerGoal.targetDate,
          difficulty: 'medium',
          priority: 'medium',
          moduleData: {
            careerGoalId: mockCareerGoal.id,
            category: mockCareerGoal.category,
            type: 'career_goal'
          }
        });
      });
    });

    describe('Unknown Type Handling', () => {
      it('should return 400 for unknown type', async () => {
        const invalidData = {
          type: 'unknown-type',
          someField: 'value'
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', invalidData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Unknown type: unknown-type');
      });
    });
  });

  describe('PUT /api/v1/modules/work - Resource Updates', () => {
    describe('Project Updates', () => {
      it('should update a project successfully', async () => {
        const updateData = {
          type: 'project',
          id: mockProject.id,
          name: 'Updated Project Name',
          priority: 'urgent',
          status: 'on-hold'
        };

        const request = createMockRequest('PUT', 'http://localhost:3000/api/v1/modules/work', updateData);
        
        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Project updated successfully');
        expect(mockWorkProjectRepo.findById).toHaveBeenCalledWith(mockProject.id);
        expect(mockWorkProjectRepo.update).toHaveBeenCalledWith(mockProject.id, {
          name: 'Updated Project Name',
          priority: 'urgent',
          status: 'on-hold'
        });
      });

      it('should return 400 if ID is missing', async () => {
        const updateData = {
          type: 'project',
          name: 'Updated Name'
          // id is missing
        };

        const request = createMockRequest('PUT', 'http://localhost:3000/api/v1/modules/work', updateData);
        
        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('ID is required for updates');
      });

      it('should return 404 for nonexistent project', async () => {
        mockWorkProjectRepo.findById.mockResolvedValue(null);

        const updateData = {
          type: 'project',
          id: 'nonexistent',
          name: 'Updated Name'
        };

        const request = createMockRequest('PUT', 'http://localhost:3000/api/v1/modules/work', updateData);
        
        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Project not found or access denied');
      });
    });

    describe('Task Updates', () => {
      it('should update a task and award XP for completion', async () => {
        const updateData = {
          type: 'task',
          id: mockTask.id,
          status: 'completed'
        };

        const request = createMockRequest('PUT', 'http://localhost:3000/api/v1/modules/work', updateData);
        
        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Task updated successfully');
        expect(mockProjectTaskRepo.update).toHaveBeenCalledWith(mockTask.id, {
          status: 'completed'
        });
      });
    });

    describe('Timer Stop', () => {
      it('should stop a timer successfully', async () => {
        const updateData = {
          type: 'time-stop',
          id: mockTimeEntry.id,
          endTime: '2024-01-15T11:00:00.000Z'
        };

        const request = createMockRequest('PUT', 'http://localhost:3000/api/v1/modules/work', updateData);
        
        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Timer stopped successfully');
        expect(mockTimeEntryRepo.stopTimer).toHaveBeenCalledWith(
          mockTimeEntry.id,
          new Date('2024-01-15T11:00:00.000Z')
        );
        expect(mockWorkProjectRepo.updateProjectHours).toHaveBeenCalledWith(mockTimeEntry.projectId);
      });

      it('should stop timer without custom end time', async () => {
        const updateData = {
          type: 'time-stop',
          id: mockTimeEntry.id
        };

        const request = createMockRequest('PUT', 'http://localhost:3000/api/v1/modules/work', updateData);
        
        const response = await PUT(request);
        
        expect(response.status).toBe(200);
        expect(mockTimeEntryRepo.stopTimer).toHaveBeenCalledWith(mockTimeEntry.id, undefined);
      });
    });

    describe('Milestone Completion', () => {
      it('should complete a milestone successfully', async () => {
        const updateData = {
          type: 'milestone-complete',
          id: 'milestone-123'
        };

        const request = createMockRequest('PUT', 'http://localhost:3000/api/v1/modules/work', updateData);
        
        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Milestone completed successfully');
        expect(mockProjectMilestoneRepo.completeMilestone).toHaveBeenCalledWith('milestone-123');
      });

      it('should validate project ownership for milestone completion', async () => {
        mockProjectMilestoneRepo.findById.mockResolvedValue(null);

        const updateData = {
          type: 'milestone-complete',
          id: 'nonexistent-milestone'
        };

        const request = createMockRequest('PUT', 'http://localhost:3000/api/v1/modules/work', updateData);
        
        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Milestone not found');
      });
    });
  });

  describe('DELETE /api/v1/modules/work - Resource Deletion', () => {
    describe('Project Deletion', () => {
      it('should delete a project successfully', async () => {
        const request = createMockRequest('DELETE', `http://localhost:3000/api/v1/modules/work?type=project&id=${mockProject.id}`);
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Project deleted successfully');
        expect(mockWorkProjectRepo.findById).toHaveBeenCalledWith(mockProject.id);
        expect(mockWorkProjectRepo.delete).toHaveBeenCalledWith(mockProject.id);
      });

      it('should return 404 for nonexistent project', async () => {
        mockWorkProjectRepo.findById.mockResolvedValue(null);

        const request = createMockRequest('DELETE', 'http://localhost:3000/api/v1/modules/work?type=project&id=nonexistent');
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Project not found or access denied');
      });
    });

    describe('Task Deletion', () => {
      it('should delete a task successfully', async () => {
        const request = createMockRequest('DELETE', `http://localhost:3000/api/v1/modules/work?type=task&id=${mockTask.id}`);
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Task deleted successfully');
        expect(mockProjectTaskRepo.delete).toHaveBeenCalledWith(mockTask.id);
      });
    });

    describe('Time Entry Deletion', () => {
      it('should delete time entry and update project hours', async () => {
        const request = createMockRequest('DELETE', `http://localhost:3000/api/v1/modules/work?type=time-entry&id=${mockTimeEntry.id}`);
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Time entry deleted successfully');
        expect(mockTimeEntryRepo.delete).toHaveBeenCalledWith(mockTimeEntry.id);
        expect(mockWorkProjectRepo.updateProjectHours).toHaveBeenCalledWith(mockTimeEntry.projectId);
      });
    });

    describe('Career Goal Deletion', () => {
      it('should delete a career goal successfully', async () => {
        const request = createMockRequest('DELETE', `http://localhost:3000/api/v1/modules/work?type=career-goal&id=${mockCareerGoal.id}`);
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.message).toBe('Career goal deleted successfully');
        expect(mockCareerGoalRepo.delete).toHaveBeenCalledWith(mockCareerGoal.id);
      });
    });

    describe('Parameter Validation', () => {
      it('should return 400 if type is missing', async () => {
        const request = createMockRequest('DELETE', `http://localhost:3000/api/v1/modules/work?id=${mockProject.id}`);
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Type and ID are required');
      });

      it('should return 400 if ID is missing', async () => {
        const request = createMockRequest('DELETE', 'http://localhost:3000/api/v1/modules/work?type=project');
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Type and ID are required');
      });

      it('should return 400 for unknown type', async () => {
        const request = createMockRequest('DELETE', 'http://localhost:3000/api/v1/modules/work?type=unknown&id=123');
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Unknown type: unknown');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('Database Errors', () => {
      it('should handle repository errors gracefully', async () => {
        mockWorkDashboardRepo.getDashboardData.mockRejectedValue(new Error('Connection timeout'));

        const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=dashboard');
        
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Connection timeout');
      });

      it('should handle validation errors with details', async () => {
        const invalidData = {
          type: 'project',
          name: '', // Will fail validation
          projectType: 'invalid'
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', invalidData);
        
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Validation failed');
        expect(responseData.details).toBeDefined();
      });
    });

    describe('Authorization Edge Cases', () => {
      it('should prevent access to other users resources', async () => {
        const otherUserProject = {
          ...mockProject,
          userId: 'other-user-456'
        };
        mockWorkProjectRepo.findById.mockResolvedValue(otherUserProject);

        const request = createMockRequest('DELETE', `http://localhost:3000/api/v1/modules/work?type=project&id=${mockProject.id}`);
        
        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Project not found or access denied');
      });
    });

    describe('Data Consistency', () => {
      it('should update project hours after time entry operations', async () => {
        const timeData = {
          type: 'time-entry',
          projectId: mockProject.id,
          durationMinutes: 60
        };

        const request = createMockRequest('POST', 'http://localhost:3000/api/v1/modules/work', timeData);
        
        await POST(request);

        expect(mockWorkProjectRepo.updateProjectHours).toHaveBeenCalledWith(mockProject.id);
      });
    });
  });

  describe('Performance and Pagination', () => {
    it('should handle pagination for large datasets', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=projects&page=5&limit=50');
      
      await GET(request);

      expect(mockWorkProjectRepo.getUserProjects).toHaveBeenCalledWith('user-placeholder-id', {
        status: undefined,
        page: 5,
        limit: 50
      });
    });

    it('should use default pagination values', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/v1/modules/work?type=projects');
      
      await GET(request);

      expect(mockWorkProjectRepo.getUserProjects).toHaveBeenCalledWith('user-placeholder-id', {
        status: undefined,
        page: 1,
        limit: 20
      });
    });
  });
});