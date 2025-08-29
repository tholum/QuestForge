/**
 * Work Repository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  WorkProjectRepository,
  ProjectTaskRepository,
  TimeEntryRepository,
  CareerGoalRepository,
  WorkDashboardRepository
} from './work-repository';
import { prisma } from '../client';

describe('Work Repository Tests', () => {
  const testUserId = 'test-user-123';
  let workProjectRepo: WorkProjectRepository;
  let projectTaskRepo: ProjectTaskRepository;
  let timeEntryRepo: TimeEntryRepository;
  let careerGoalRepo: CareerGoalRepository;
  let dashboardRepo: WorkDashboardRepository;

  beforeEach(async () => {
    workProjectRepo = new WorkProjectRepository();
    projectTaskRepo = new ProjectTaskRepository();
    timeEntryRepo = new TimeEntryRepository();
    careerGoalRepo = new CareerGoalRepository();
    dashboardRepo = new WorkDashboardRepository();

    // Clean up any existing test data
    await prisma.timeEntry.deleteMany({ where: { userId: testUserId } });
    await prisma.projectTask.deleteMany({ where: { userId: testUserId } });
    await prisma.projectMilestone.deleteMany();
    await prisma.workProject.deleteMany({ where: { userId: testUserId } });
    await prisma.careerGoal.deleteMany({ where: { userId: testUserId } });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.timeEntry.deleteMany({ where: { userId: testUserId } });
    await prisma.projectTask.deleteMany({ where: { userId: testUserId } });
    await prisma.projectMilestone.deleteMany();
    await prisma.workProject.deleteMany({ where: { userId: testUserId } });
    await prisma.careerGoal.deleteMany({ where: { userId: testUserId } });
  });

  describe('WorkProjectRepository', () => {
    it('should create a work project', async () => {
      const projectData = {
        userId: testUserId,
        name: 'Test Project',
        description: 'A test project',
        projectType: 'personal' as const,
        priority: 'medium' as const,
        estimatedHours: 40
      };

      const project = await workProjectRepo.create(projectData);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.userId).toBe(testUserId);
      expect(project.projectType).toBe('personal');
      expect(project.estimatedHours).toBe(40);
      expect(project.actualHours).toBe(0);
    });

    it('should get user projects', async () => {
      // Create test projects
      await workProjectRepo.create({
        userId: testUserId,
        name: 'Project 1',
        projectType: 'client' as const
      });
      
      await workProjectRepo.create({
        userId: testUserId,
        name: 'Project 2', 
        projectType: 'internal' as const,
        status: 'completed' as const
      });

      const projects = await workProjectRepo.getUserProjects(testUserId);
      expect(projects).toHaveLength(2);

      const activeProjects = await workProjectRepo.getUserProjects(testUserId, { status: 'active' });
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].name).toBe('Project 1');
    });

    it('should calculate project progress correctly', async () => {
      const project = await workProjectRepo.create({
        userId: testUserId,
        name: 'Progress Test',
        projectType: 'personal' as const
      });

      // Mock project with tasks for progress calculation
      const mockProject = {
        id: project.id,
        tasks: [
          { status: 'completed' },
          { status: 'completed' },
          { status: 'in-progress' },
          { status: 'todo' }
        ]
      };

      const progress = workProjectRepo.calculateProjectProgress(mockProject);
      expect(progress).toBe(50); // 2 out of 4 tasks completed
    });

    it('should get analytics for user', async () => {
      const project = await workProjectRepo.create({
        userId: testUserId,
        name: 'Analytics Test',
        projectType: 'personal' as const,
        status: 'completed' as const
      });

      const analytics = await workProjectRepo.getAnalytics(testUserId, 'week');
      
      expect(analytics).toBeDefined();
      expect(analytics.totalProjects).toBe(1);
      expect(analytics.completedProjects).toBe(1);
      expect(analytics.activeProjects).toBe(0);
      expect(analytics.completionRate).toBe(100);
    });
  });

  describe('ProjectTaskRepository', () => {
    it('should create a project task', async () => {
      const project = await workProjectRepo.create({
        userId: testUserId,
        name: 'Task Test Project',
        projectType: 'personal' as const
      });

      const taskData = {
        projectId: project.id,
        userId: testUserId,
        title: 'Test Task',
        description: 'A test task',
        priority: 'high' as const,
        estimatedHours: 4
      };

      const task = await projectTaskRepo.create(taskData);

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.projectId).toBe(project.id);
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('high');
    });

    it('should complete a task', async () => {
      const project = await workProjectRepo.create({
        userId: testUserId,
        name: 'Complete Test Project',
        projectType: 'personal' as const
      });

      const task = await projectTaskRepo.create({
        projectId: project.id,
        userId: testUserId,
        title: 'Task to Complete'
      });

      const completedTask = await projectTaskRepo.completeTask(task.id, testUserId);

      expect(completedTask.status).toBe('completed');
      expect(completedTask.completedAt).toBeDefined();
    });

    it('should get project tasks', async () => {
      const project = await workProjectRepo.create({
        userId: testUserId,
        name: 'Task List Project',
        projectType: 'personal' as const
      });

      await projectTaskRepo.create({
        projectId: project.id,
        userId: testUserId,
        title: 'Task 1'
      });

      await projectTaskRepo.create({
        projectId: project.id,
        userId: testUserId,
        title: 'Task 2',
        status: 'completed' as const
      });

      const allTasks = await projectTaskRepo.getProjectTasks(project.id, testUserId);
      expect(allTasks).toHaveLength(2);

      const todoTasks = await projectTaskRepo.getProjectTasks(project.id, testUserId, { status: 'todo' });
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].title).toBe('Task 1');
    });
  });

  describe('TimeEntryRepository', () => {
    it('should create a time entry', async () => {
      const project = await workProjectRepo.create({
        userId: testUserId,
        name: 'Time Test Project',
        projectType: 'personal' as const
      });

      const startTime = new Date('2024-01-01T09:00:00Z');
      const endTime = new Date('2024-01-01T11:00:00Z');

      const timeEntryData = {
        userId: testUserId,
        projectId: project.id,
        startTime,
        endTime,
        durationMinutes: 120,
        entryDate: startTime,
        description: 'Morning work session'
      };

      const timeEntry = await timeEntryRepo.create(timeEntryData);

      expect(timeEntry).toBeDefined();
      expect(timeEntry.id).toBeDefined();
      expect(timeEntry.durationMinutes).toBe(120);
      expect(timeEntry.description).toBe('Morning work session');
    });

    it('should start and stop timer', async () => {
      const project = await workProjectRepo.create({
        userId: testUserId,
        name: 'Timer Test Project',
        projectType: 'personal' as const
      });

      // Start timer
      const timerEntry = await timeEntryRepo.startTimer(testUserId, project.id, undefined, 'Timer test');

      expect(timerEntry).toBeDefined();
      expect(timerEntry.startTime).toBeDefined();
      expect(timerEntry.endTime).toBeNull();
      expect(timerEntry.durationMinutes).toBeNull();

      // Stop timer
      const stoppedEntry = await timeEntryRepo.stopTimer(timerEntry.id);

      expect(stoppedEntry.endTime).toBeDefined();
      expect(stoppedEntry.durationMinutes).toBeGreaterThan(0);
    });
  });

  describe('CareerGoalRepository', () => {
    it('should create a career goal', async () => {
      const careerGoalData = {
        userId: testUserId,
        category: 'skill' as const,
        title: 'Learn React',
        description: 'Master React for frontend development',
        currentLevel: 'beginner' as const,
        targetLevel: 'advanced' as const
      };

      const careerGoal = await careerGoalRepo.create(careerGoalData);

      expect(careerGoal).toBeDefined();
      expect(careerGoal.id).toBeDefined();
      expect(careerGoal.title).toBe('Learn React');
      expect(careerGoal.category).toBe('skill');
      expect(careerGoal.isCompleted).toBe(false);
    });

    it('should complete a career goal', async () => {
      const careerGoal = await careerGoalRepo.create({
        userId: testUserId,
        category: 'certification' as const,
        title: 'AWS Certification'
      });

      const evidence = { certificate: 'aws-cert-123.pdf' };
      const completedGoal = await careerGoalRepo.completeCareerGoal(
        careerGoal.id, 
        testUserId, 
        evidence
      );

      expect(completedGoal.isCompleted).toBe(true);
      expect(completedGoal.completedAt).toBeDefined();
      expect(completedGoal.evidence).toEqual(evidence);
    });

    it('should get career goals by category', async () => {
      await careerGoalRepo.create({
        userId: testUserId,
        category: 'skill' as const,
        title: 'Skill Goal'
      });

      await careerGoalRepo.create({
        userId: testUserId,
        category: 'certification' as const,
        title: 'Cert Goal'
      });

      const skillGoals = await careerGoalRepo.getByCategory(testUserId, 'skill');
      expect(skillGoals).toHaveLength(1);
      expect(skillGoals[0].title).toBe('Skill Goal');
    });
  });

  describe('WorkDashboardRepository', () => {
    it('should get dashboard data', async () => {
      // Create test data
      const project = await workProjectRepo.create({
        userId: testUserId,
        name: 'Dashboard Project',
        projectType: 'personal' as const,
        status: 'active' as const
      });

      const task = await projectTaskRepo.create({
        projectId: project.id,
        userId: testUserId,
        title: 'Dashboard Task',
        dueDate: new Date()
      });

      const careerGoal = await careerGoalRepo.create({
        userId: testUserId,
        category: 'skill' as const,
        title: 'Dashboard Career Goal'
      });

      const dashboardData = await dashboardRepo.getDashboardData(testUserId);

      expect(dashboardData).toBeDefined();
      expect(dashboardData.activeProjects).toBeDefined();
      expect(dashboardData.activeProjects.length).toBeGreaterThan(0);
      expect(dashboardData.todayTasks).toBeDefined();
      expect(dashboardData.careerGoals).toBeDefined();
      expect(dashboardData.stats).toBeDefined();
      expect(dashboardData.stats.totalActiveProjects).toBe(1);
    });
  });
});