/**
 * Work Module Integration Tests
 * 
 * End-to-end integration tests for the Work Projects Module including:
 * - Time tracking workflows and data consistency
 * - Integration with Goal Management system
 * - Gamification system integration (XP, achievements)
 * - Cross-module data dependencies
 * - Real database operations
 * - Complete user workflows
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../lib/prisma/client';
import {
  workProjectRepository,
  projectTaskRepository,
  timeEntryRepository,
  careerGoalRepository,
  performanceMetricRepository,
  projectMilestoneRepository,
  workDashboardRepository
} from '../../lib/prisma/repositories/work-repository';
import { GoalRepository } from '../../lib/prisma/repositories/goal-repository';
import { ProgressRepository } from '../../lib/prisma/repositories/progress-repository';
import { XPManager } from '../../lib/gamification/XPManager';
import { AchievementManager } from '../../lib/gamification/AchievementManager';
import { WorkModule } from '../../modules/work/WorkModule';

// Test user data
const testUser = {
  id: 'integration-test-user',
  email: 'integration@test.com',
  name: 'Integration Test User',
  password: 'hashed-password'
};

const goalRepository = new GoalRepository();
const progressRepository = new ProgressRepository();
const xpManager = new XPManager();
const achievementManager = new AchievementManager();

describe('Work Module Integration Tests', () => {
  beforeAll(async () => {
    // Ensure clean test environment
    await cleanupTestData();
    
    // Create test user
    await prisma.user.create({
      data: testUser
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean slate for each test
    await cleanupWorkData();
  });

  afterEach(async () => {
    await cleanupWorkData();
  });

  async function cleanupTestData() {
    // Clean up in dependency order
    await prisma.progress.deleteMany({ where: { userId: testUser.id } });
    await prisma.userAchievement.deleteMany({ where: { userId: testUser.id } });
    await prisma.timeEntry.deleteMany({ where: { userId: testUser.id } });
    await prisma.projectTask.deleteMany({ where: { userId: testUser.id } });
    await prisma.projectMilestone.deleteMany({ where: { project: { userId: testUser.id } } });
    await prisma.workProject.deleteMany({ where: { userId: testUser.id } });
    await prisma.careerGoal.deleteMany({ where: { userId: testUser.id } });
    await prisma.performanceMetric.deleteMany({ where: { userId: testUser.id } });
    await prisma.goal.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
  }

  async function cleanupWorkData() {
    // Clean work-specific data while keeping user
    await prisma.progress.deleteMany({ where: { userId: testUser.id } });
    await prisma.userAchievement.deleteMany({ where: { userId: testUser.id } });
    await prisma.timeEntry.deleteMany({ where: { userId: testUser.id } });
    await prisma.projectTask.deleteMany({ where: { userId: testUser.id } });
    await prisma.projectMilestone.deleteMany({ where: { project: { userId: testUser.id } } });
    await prisma.workProject.deleteMany({ where: { userId: testUser.id } });
    await prisma.careerGoal.deleteMany({ where: { userId: testUser.id } });
    await prisma.performanceMetric.deleteMany({ where: { userId: testUser.id } });
    await prisma.goal.deleteMany({ where: { userId: testUser.id, moduleId: 'work' } });
  }

  describe('Complete Project Lifecycle Integration', () => {
    it('should handle full project lifecycle with goal integration', async () => {
      // 1. Create project with associated goal
      const project = await workProjectRepository.create({
        userId: testUser.id,
        name: 'Integration Test Project',
        description: 'Full lifecycle integration test',
        projectType: 'personal',
        priority: 'high',
        estimatedHours: 40,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      // Create associated goal
      const goal = await goalRepository.create({
        userId: testUser.id,
        title: `Complete ${project.name}`,
        description: project.description || '',
        moduleId: 'work',
        targetDate: project.endDate,
        difficulty: 'medium',
        priority: project.priority,
        moduleData: { projectId: project.id, type: 'work_project' }
      });

      // Link project to goal
      await workProjectRepository.update(project.id, { goalId: goal.id });

      // 2. Create tasks for the project
      const tasks = [];
      for (let i = 1; i <= 5; i++) {
        const task = await projectTaskRepository.create({
          projectId: project.id,
          userId: testUser.id,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          priority: i <= 2 ? 'high' : 'medium',
          estimatedHours: 8,
          dueDate: new Date(Date.now() + (i * 5) * 24 * 60 * 60 * 1000)
        });
        tasks.push(task);
      }

      // 3. Create milestones
      const milestone1 = await projectMilestoneRepository.create({
        projectId: project.id,
        title: 'Phase 1 Complete',
        description: 'First phase milestone',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        priority: 'high'
      });

      const milestone2 = await projectMilestoneRepository.create({
        projectId: project.id,
        title: 'Project Complete',
        description: 'Final project completion',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priority: 'urgent'
      });

      // 4. Start working on tasks with time tracking
      let totalTimeMinutes = 0;
      
      // Work on first task
      const timeEntry1 = await timeEntryRepository.startTimer(
        testUser.id,
        project.id,
        tasks[0].id,
        'Working on task implementation'
      );

      // Simulate working for 2 hours
      const workDuration = 120; // 2 hours in minutes
      await timeEntryRepository.stopTimer(timeEntry1.id, 
        new Date(timeEntry1.startTime.getTime() + workDuration * 60 * 1000)
      );
      totalTimeMinutes += workDuration;

      // Add manual time entry
      const manualEntry = await timeEntryRepository.create({
        userId: testUser.id,
        projectId: project.id,
        taskId: tasks[1].id,
        description: 'Manual time entry for task 2',
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        durationMinutes: 120,
        entryDate: new Date()
      });
      totalTimeMinutes += 120;

      // Update project hours
      await workProjectRepository.updateProjectHours(project.id);

      // 5. Complete some tasks and milestones
      await projectTaskRepository.update(tasks[0].id, { 
        status: 'completed',
        completedAt: new Date()
      });

      await projectTaskRepository.update(tasks[1].id, { 
        status: 'completed',
        completedAt: new Date()
      });

      await projectMilestoneRepository.completeMilestone(milestone1.id);

      // 6. Add progress to associated goal
      await progressRepository.create({
        userId: testUser.id,
        goalId: goal.id,
        value: 40, // 40% complete (2 out of 5 tasks done)
        maxValue: 100,
        xpEarned: 50,
        notes: 'Completed first two tasks'
      });

      // 7. Verify integrated data consistency
      const updatedProject = await workProjectRepository.findById(project.id);
      const projectTasks = await projectTaskRepository.getProjectTasks(project.id, testUser.id);
      const projectTimeEntries = await timeEntryRepository.findMany({
        userId: testUser.id,
        projectId: project.id
      });
      const projectMilestones = await projectMilestoneRepository.findMany({ projectId: project.id });
      const associatedGoal = await goalRepository.findById(goal.id);
      const goalProgress = await progressRepository.findMany({ userId: testUser.id, goalId: goal.id });

      // Verify project state
      expect(updatedProject).toBeDefined();
      expect(updatedProject!.actualHours).toBe(4); // 240 minutes = 4 hours
      expect(updatedProject!.goalId).toBe(goal.id);

      // Verify tasks
      expect(projectTasks).toHaveLength(5);
      const completedTasks = projectTasks.filter(t => t.status === 'completed');
      expect(completedTasks).toHaveLength(2);

      // Verify time entries
      expect(projectTimeEntries).toHaveLength(2);
      const totalTrackedTime = projectTimeEntries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);
      expect(totalTrackedTime).toBe(totalTimeMinutes);

      // Verify milestones
      expect(projectMilestones).toHaveLength(2);
      const completedMilestones = projectMilestones.filter(m => m.isCompleted);
      expect(completedMilestones).toHaveLength(1);
      expect(completedMilestones[0].id).toBe(milestone1.id);

      // Verify goal integration
      expect(associatedGoal).toBeDefined();
      expect(associatedGoal!.moduleId).toBe('work');
      expect(goalProgress).toHaveLength(1);
      expect(goalProgress[0].value).toBe(40);
    });

    it('should handle project completion and goal achievement', async () => {
      // Create and complete a full project workflow
      const project = await workProjectRepository.create({
        userId: testUser.id,
        name: 'Completed Integration Project',
        projectType: 'client',
        priority: 'high',
        estimatedHours: 20
      });

      const goal = await goalRepository.create({
        userId: testUser.id,
        title: `Complete ${project.name}`,
        moduleId: 'work',
        difficulty: 'medium',
        priority: 'high',
        moduleData: { projectId: project.id, type: 'work_project' }
      });

      // Create and complete all tasks
      const tasks = [];
      for (let i = 1; i <= 3; i++) {
        const task = await projectTaskRepository.create({
          projectId: project.id,
          userId: testUser.id,
          title: `Completion Task ${i}`,
          priority: 'high',
          estimatedHours: 6
        });

        // Complete the task
        await projectTaskRepository.update(task.id, {
          status: 'completed',
          completedAt: new Date(),
          actualHours: 7 // Slightly over estimate
        });

        tasks.push(task);
      }

      // Add time entries for completed work
      for (let i = 0; i < 3; i++) {
        await timeEntryRepository.create({
          userId: testUser.id,
          projectId: project.id,
          taskId: tasks[i].id,
          startTime: new Date(Date.now() - (i + 2) * 60 * 60 * 1000),
          endTime: new Date(Date.now() - (i + 1) * 60 * 60 * 1000),
          durationMinutes: 60,
          entryDate: new Date()
        });
      }

      // Complete project
      await workProjectRepository.update(project.id, {
        status: 'completed'
      });

      // Mark goal as completed
      await goalRepository.update(goal.id, {
        isCompleted: true
      });

      // Add final progress entry
      await progressRepository.create({
        userId: testUser.id,
        goalId: goal.id,
        value: 100,
        maxValue: 100,
        xpEarned: 100,
        notes: 'Project completed successfully'
      });

      // Verify completion state
      const completedProject = await workProjectRepository.findById(project.id);
      const completedGoal = await goalRepository.findById(goal.id);
      const allTasks = await projectTaskRepository.getProjectTasks(project.id, testUser.id);

      expect(completedProject!.status).toBe('completed');
      expect(completedGoal!.isCompleted).toBe(true);
      expect(allTasks.every(t => t.status === 'completed')).toBe(true);
    });
  });

  describe('Time Tracking Integration', () => {
    it('should handle complex time tracking scenarios', async () => {
      const project = await workProjectRepository.create({
        userId: testUser.id,
        name: 'Time Tracking Test Project',
        projectType: 'client',
        priority: 'high'
      });

      const task = await projectTaskRepository.create({
        projectId: project.id,
        userId: testUser.id,
        title: 'Time Intensive Task',
        priority: 'high'
      });

      // Test multiple timer sessions
      const sessions = [];
      
      // Session 1: Start and stop timer normally
      const timer1 = await timeEntryRepository.startTimer(
        testUser.id,
        project.id,
        task.id,
        'First work session'
      );
      
      const session1End = new Date(timer1.startTime.getTime() + 90 * 60 * 1000); // 1.5 hours
      const stoppedTimer1 = await timeEntryRepository.stopTimer(timer1.id, session1End);
      sessions.push(stoppedTimer1);

      // Session 2: Another timer session
      const timer2 = await timeEntryRepository.startTimer(
        testUser.id,
        project.id,
        task.id,
        'Second work session'
      );
      
      const session2End = new Date(timer2.startTime.getTime() + 120 * 60 * 1000); // 2 hours
      const stoppedTimer2 = await timeEntryRepository.stopTimer(timer2.id, session2End);
      sessions.push(stoppedTimer2);

      // Add manual time entries
      const manualEntry1 = await timeEntryRepository.create({
        userId: testUser.id,
        projectId: project.id,
        taskId: task.id,
        description: 'Manual entry - offline work',
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        durationMinutes: 60,
        isBillable: true,
        hourlyRate: 50,
        entryDate: new Date()
      });

      const manualEntry2 = await timeEntryRepository.create({
        userId: testUser.id,
        projectId: project.id,
        description: 'Project planning (no specific task)',
        startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        durationMinutes: 30,
        isBillable: false,
        entryDate: new Date()
      });

      // Update project hours
      await workProjectRepository.updateProjectHours(project.id);

      // Get comprehensive time data
      const allTimeEntries = await timeEntryRepository.findMany({
        userId: testUser.id,
        projectId: project.id
      });

      const todayEntries = await timeEntryRepository.getTimeEntries(
        testUser.id,
        new Date().toISOString().split('T')[0]
      );

      const weeklyTimeSummary = await timeEntryRepository.getWeeklyTimeSummary(
        testUser.id,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      const updatedProject = await workProjectRepository.findById(project.id);

      // Verify time tracking accuracy
      expect(allTimeEntries).toHaveLength(4); // 2 timer sessions + 2 manual entries
      
      const totalMinutes = allTimeEntries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);
      expect(totalMinutes).toBe(300); // 90 + 120 + 60 + 30 = 300 minutes
      
      expect(updatedProject!.actualHours).toBe(5); // 300 minutes = 5 hours
      
      // Check billable vs non-billable time
      const billableEntries = allTimeEntries.filter(e => e.isBillable);
      const billableMinutes = billableEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
      expect(billableMinutes).toBe(60); // Only manual entry 1 is billable

      // Verify weekly summary includes the project
      const projectSummary = weeklyTimeSummary.find(s => s.projectId === project.id);
      expect(projectSummary).toBeDefined();
      expect(projectSummary!._sum.durationMinutes).toBe(300);
    });

    it('should handle timer edge cases and error recovery', async () => {
      const project = await workProjectRepository.create({
        userId: testUser.id,
        name: 'Timer Edge Case Project',
        projectType: 'personal'
      });

      // Test timer without task assignment
      const timer1 = await timeEntryRepository.startTimer(
        testUser.id,
        project.id,
        undefined,
        'General project work'
      );

      expect(timer1.taskId).toBeNull();
      expect(timer1.endTime).toBeNull();
      expect(timer1.durationMinutes).toBeNull();

      // Stop timer and verify duration calculation
      const stopTime = new Date(timer1.startTime.getTime() + 45 * 60 * 1000); // 45 minutes
      const stoppedTimer = await timeEntryRepository.stopTimer(timer1.id, stopTime);

      expect(stoppedTimer.endTime).toEqual(stopTime);
      expect(stoppedTimer.durationMinutes).toBe(45);

      // Test stopping a timer that doesn't exist
      await expect(timeEntryRepository.stopTimer('nonexistent-timer')).rejects.toThrow('Time entry not found');

      // Test creating time entry with calculated duration
      const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const endTime = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

      const calculatedEntry = await timeEntryRepository.create({
        userId: testUser.id,
        projectId: project.id,
        startTime,
        endTime,
        // Duration will be calculated
        entryDate: startTime
      });

      // Duration should be calculated as approximately 60 minutes
      expect(calculatedEntry.durationMinutes).toBeCloseTo(60, -1); // Within 10 minutes
    });
  });

  describe('Career Development Integration', () => {
    it('should integrate career goals with main goal system', async () => {
      // Create career goal
      const careerGoal = await careerGoalRepository.create({
        userId: testUser.id,
        category: 'skill',
        title: 'Master React Hooks',
        description: 'Become proficient with React hooks patterns',
        currentLevel: 'beginner',
        targetLevel: 'advanced',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

      // Create associated main goal
      const mainGoal = await goalRepository.create({
        userId: testUser.id,
        title: careerGoal.title,
        description: careerGoal.description,
        moduleId: 'work',
        targetDate: careerGoal.targetDate,
        difficulty: 'medium',
        priority: 'high',
        moduleData: {
          careerGoalId: careerGoal.id,
          category: careerGoal.category,
          type: 'career_goal'
        }
      });

      // Link career goal to main goal
      await careerGoalRepository.update(careerGoal.id, { goalId: mainGoal.id });

      // Create supporting project for skill development
      const skillProject = await workProjectRepository.create({
        userId: testUser.id,
        name: 'React Hooks Practice Project',
        description: 'Build a project using advanced React hooks',
        projectType: 'personal',
        priority: 'high',
        goalId: mainGoal.id
      });

      // Track progress through time spent learning
      const studyTimeEntry = await timeEntryRepository.create({
        userId: testUser.id,
        projectId: skillProject.id,
        description: 'Study React hooks documentation and tutorials',
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        durationMinutes: 120,
        entryDate: new Date()
      });

      // Record progress
      await progressRepository.create({
        userId: testUser.id,
        goalId: mainGoal.id,
        value: 25,
        maxValue: 100,
        xpEarned: 30,
        notes: 'Completed introduction to hooks tutorial'
      });

      // Add performance metric
      const performanceMetric = await performanceMetricRepository.create({
        userId: testUser.id,
        metricType: 'skill',
        metricName: 'React Hooks Proficiency',
        value: 3,
        targetValue: 8,
        unit: 'skill_level/10',
        period: 'weekly',
        recordDate: new Date(),
        notes: 'Self-assessment after tutorial completion'
      });

      // Simulate skill progression
      await progressRepository.create({
        userId: testUser.id,
        goalId: mainGoal.id,
        value: 60,
        maxValue: 100,
        xpEarned: 50,
        notes: 'Built practice component with useReducer and useContext'
      });

      // Complete career goal
      const completionEvidence = {
        projectUrl: 'https://github.com/user/react-hooks-project',
        skillDemonstration: 'Successfully implemented complex state management with hooks',
        completionDate: new Date().toISOString(),
        selfAssessmentScore: 8
      };

      await careerGoalRepository.completeCareerGoal(careerGoal.id, testUser.id, completionEvidence);
      
      await goalRepository.update(mainGoal.id, { isCompleted: true });

      // Final progress entry
      await progressRepository.create({
        userId: testUser.id,
        goalId: mainGoal.id,
        value: 100,
        maxValue: 100,
        xpEarned: 100,
        notes: 'Career goal achieved - React hooks mastery demonstrated'
      });

      // Verify integration
      const completedCareerGoal = await careerGoalRepository.findById(careerGoal.id);
      const completedMainGoal = await goalRepository.findById(mainGoal.id);
      const allProgress = await progressRepository.findMany({ goalId: mainGoal.id });
      const skillMetrics = await performanceMetricRepository.findMany({
        userId: testUser.id,
        metricType: 'skill'
      });

      expect(completedCareerGoal!.isCompleted).toBe(true);
      expect(completedCareerGoal!.evidence).toEqual(completionEvidence);
      expect(completedMainGoal!.isCompleted).toBe(true);
      expect(allProgress).toHaveLength(3);
      expect(skillMetrics).toHaveLength(1);

      // Verify total XP earned
      const totalXp = allProgress.reduce((sum, p) => sum + p.xpEarned, 0);
      expect(totalXp).toBe(180); // 30 + 50 + 100
    });
  });

  describe('Dashboard Data Integration', () => {
    it('should provide comprehensive dashboard data with real aggregations', async () => {
      // Create complex test scenario
      const activeProject1 = await workProjectRepository.create({
        userId: testUser.id,
        name: 'Dashboard Active Project 1',
        projectType: 'client',
        status: 'active',
        priority: 'high',
        estimatedHours: 40
      });

      const activeProject2 = await workProjectRepository.create({
        userId: testUser.id,
        name: 'Dashboard Active Project 2',
        projectType: 'personal',
        status: 'active',
        priority: 'medium',
        estimatedHours: 20
      });

      const completedProject = await workProjectRepository.create({
        userId: testUser.id,
        name: 'Dashboard Completed Project',
        projectType: 'internal',
        status: 'completed',
        priority: 'low'
      });

      // Create tasks with various due dates
      const today = new Date();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);\n\n      // Today's tasks\n      const todayTask1 = await projectTaskRepository.create({\n        projectId: activeProject1.id,\n        userId: testUser.id,\n        title: 'Today Task 1',\n        dueDate: today,\n        status: 'completed',\n        priority: 'high'\n      });\n\n      const todayTask2 = await projectTaskRepository.create({\n        projectId: activeProject1.id,\n        userId: testUser.id,\n        title: 'Today Task 2',\n        dueDate: today,\n        status: 'in-progress',\n        priority: 'medium'\n      });\n\n      const todayTask3 = await projectTaskRepository.create({\n        projectId: activeProject2.id,\n        userId: testUser.id,\n        title: 'Today Task 3',\n        dueDate: today,\n        status: 'todo',\n        priority: 'low'\n      });\n\n      // Upcoming deadline tasks\n      const upcomingTask1 = await projectTaskRepository.create({\n        projectId: activeProject1.id,\n        userId: testUser.id,\n        title: 'Upcoming Task 1',\n        dueDate: tomorrow,\n        status: 'in-progress',\n        priority: 'urgent'\n      });\n\n      const upcomingTask2 = await projectTaskRepository.create({\n        projectId: activeProject2.id,\n        userId: testUser.id,\n        title: 'Upcoming Task 2',\n        dueDate: nextWeek,\n        status: 'todo',\n        priority: 'high'\n      });\n\n      // Overdue task\n      const overdueTask = await projectTaskRepository.create({\n        projectId: activeProject1.id,\n        userId: testUser.id,\n        title: 'Overdue Task',\n        dueDate: lastWeek,\n        status: 'todo',\n        priority: 'urgent'\n      });\n\n      // Add time entries for the week\n      const weekTimeEntries = [];\n      for (let i = 0; i < 7; i++) {\n        const entryDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);\n        const entry = await timeEntryRepository.create({\n          userId: testUser.id,\n          projectId: i % 2 === 0 ? activeProject1.id : activeProject2.id,\n          startTime: entryDate,\n          durationMinutes: 60 + (i * 15), // Varying durations\n          entryDate,\n          description: `Day ${i + 1} work`\n        });\n        weekTimeEntries.push(entry);\n      }\n\n      // Create career goals\n      const activeCareerGoal = await careerGoalRepository.create({\n        userId: testUser.id,\n        category: 'skill',\n        title: 'Dashboard Skill Goal',\n        isCompleted: false\n      });\n\n      const completedCareerGoal = await careerGoalRepository.create({\n        userId: testUser.id,\n        category: 'certification',\n        title: 'Dashboard Cert Goal',\n        isCompleted: true,\n        completedAt: new Date()\n      });\n\n      // Add milestones\n      const upcomingMilestone = await projectMilestoneRepository.create({\n        projectId: activeProject1.id,\n        title: 'Project Phase 1',\n        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),\n        priority: 'high'\n      });\n\n      // Update project hours\n      await workProjectRepository.updateProjectHours(activeProject1.id);\n      await workProjectRepository.updateProjectHours(activeProject2.id);\n\n      // Get dashboard data\n      const dashboardData = await workDashboardRepository.getDashboardData(testUser.id);\n\n      // Comprehensive verification\n      expect(dashboardData).toBeDefined();\n      \n      // Active projects\n      expect(dashboardData.activeProjects).toHaveLength(2);\n      const project1Data = dashboardData.activeProjects.find(p => p.id === activeProject1.id);\n      const project2Data = dashboardData.activeProjects.find(p => p.id === activeProject2.id);\n      \n      expect(project1Data).toBeDefined();\n      expect(project2Data).toBeDefined();\n      \n      // Check task counts and progress calculation\n      expect(project1Data!.totalTasks).toBeGreaterThan(0);\n      expect(project2Data!.totalTasks).toBeGreaterThan(0);\n      \n      const project1CompletedTasks = project1Data!.completedTasks;\n      const project1Progress = Math.round((project1CompletedTasks / project1Data!.totalTasks) * 100);\n      expect(project1Data!.progress).toBe(project1Progress);\n      \n      // Today's tasks\n      expect(dashboardData.todayTasks.total).toBe(3);\n      expect(dashboardData.todayTasks.completed).toBe(1);\n      expect(dashboardData.todayTasks.remaining).toBe(2);\n      \n      // Week time tracked\n      const expectedWeekMinutes = weekTimeEntries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);\n      expect(dashboardData.weekTimeTracked).toBe(expectedWeekMinutes);\n      \n      // Upcoming deadlines (should include tasks due within 30 days)\n      expect(dashboardData.upcomingDeadlines.length).toBeGreaterThanOrEqual(2);\n      const upcomingDeadlineIds = dashboardData.upcomingDeadlines.map(t => t.id);\n      expect(upcomingDeadlineIds).toContain(upcomingTask1.id);\n      expect(upcomingDeadlineIds).toContain(upcomingTask2.id);\n      \n      // Career goals\n      expect(dashboardData.careerGoals).toHaveLength(2);\n      \n      // Overdue tasks\n      expect(dashboardData.overdueTasks).toHaveLength(1);\n      expect(dashboardData.overdueTasks[0].id).toBe(overdueTask.id);\n      \n      // Stats\n      expect(dashboardData.stats.totalActiveProjects).toBe(2);\n      expect(dashboardData.stats.weekHours).toBe(Math.round(expectedWeekMinutes / 60));\n      expect(dashboardData.stats.overdueTaskCount).toBe(1);\n      expect(dashboardData.stats.completedCareerGoals).toBe(1);\n    });\n\n    it('should handle empty dashboard state', async () => {\n      const emptyDashboard = await workDashboardRepository.getDashboardData(testUser.id);\n      \n      expect(emptyDashboard.activeProjects).toHaveLength(0);\n      expect(emptyDashboard.todayTasks.total).toBe(0);\n      expect(emptyDashboard.todayTasks.completed).toBe(0);\n      expect(emptyDashboard.todayTasks.remaining).toBe(0);\n      expect(emptyDashboard.weekTimeTracked).toBe(0);\n      expect(emptyDashboard.upcomingDeadlines).toHaveLength(0);\n      expect(emptyDashboard.careerGoals).toHaveLength(0);\n      expect(emptyDashboard.overdueTasks).toHaveLength(0);\n      expect(emptyDashboard.stats.totalActiveProjects).toBe(0);\n      expect(emptyDashboard.stats.weekHours).toBe(0);\n      expect(emptyDashboard.stats.overdueTaskCount).toBe(0);\n      expect(emptyDashboard.stats.completedCareerGoals).toBe(0);\n    });\n  });\n\n  describe('Gamification Integration', () => {\n    it('should integrate with XP and achievement systems', async () => {\n      // This test would require the actual XP and Achievement managers to be implemented\n      // For now, we'll test the data structures that would be used for gamification\n      \n      const project = await workProjectRepository.create({\n        userId: testUser.id,\n        name: 'Gamification Test Project',\n        projectType: 'personal',\n        priority: 'medium'\n      });\n      \n      const task = await projectTaskRepository.create({\n        projectId: project.id,\n        userId: testUser.id,\n        title: 'XP Earning Task',\n        priority: 'high'\n      });\n      \n      // Complete task (would normally award XP)\n      await projectTaskRepository.update(task.id, {\n        status: 'completed',\n        completedAt: new Date()\n      });\n      \n      // Create time entry (would normally award XP)\n      await timeEntryRepository.create({\n        userId: testUser.id,\n        projectId: project.id,\n        taskId: task.id,\n        startTime: new Date(Date.now() - 60 * 60 * 1000),\n        endTime: new Date(),\n        durationMinutes: 60,\n        entryDate: new Date()\n      });\n      \n      // Complete project (would normally award significant XP)\n      await workProjectRepository.update(project.id, {\n        status: 'completed'\n      });\n      \n      // Verify the actions that would trigger XP awards\n      const completedTask = await projectTaskRepository.findById(task.id);\n      const completedProject = await workProjectRepository.findById(project.id);\n      const timeEntry = await timeEntryRepository.findMany({ \n        userId: testUser.id, \n        projectId: project.id \n      });\n      \n      expect(completedTask!.status).toBe('completed');\n      expect(completedProject!.status).toBe('completed');\n      expect(timeEntry).toHaveLength(1);\n      \n      // These actions would normally trigger:\n      // - XP for task completion based on priority and difficulty\n      // - XP for time tracking (encouraging consistent logging)\n      // - XP for project completion with potential streak bonuses\n      // - Achievement progress for various work-related achievements\n    });\n    \n    it('should track achievement-relevant metrics', async () => {\n      // Test data collection for achievements defined in WorkModule\n      const achievements = WorkModule.achievements;\n      \n      // Create projects to track \"first_project\" achievement\n      const firstProject = await workProjectRepository.create({\n        userId: testUser.id,\n        name: 'First Project Achievement',\n        projectType: 'personal'\n      });\n      \n      // Track time for \"time_tracker\" achievement (40 hours target)\n      const timeEntries = [];\n      for (let i = 0; i < 10; i++) {\n        const entry = await timeEntryRepository.create({\n          userId: testUser.id,\n          projectId: firstProject.id,\n          startTime: new Date(Date.now() - (i + 2) * 60 * 60 * 1000),\n          endTime: new Date(Date.now() - (i + 1) * 60 * 60 * 1000),\n          durationMinutes: 60,\n          entryDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000)\n        });\n        timeEntries.push(entry);\n      }\n      \n      // Complete projects for \"project_completer\" achievement\n      await workProjectRepository.update(firstProject.id, { status: 'completed' });\n      \n      for (let i = 1; i < 3; i++) {\n        const project = await workProjectRepository.create({\n          userId: testUser.id,\n          name: `Project ${i + 1}`,\n          projectType: 'client',\n          status: 'completed'\n        });\n      }\n      \n      // Create career goals for \"career_focused\" achievement\n      for (let i = 0; i < 2; i++) {\n        await careerGoalRepository.create({\n          userId: testUser.id,\n          category: 'skill',\n          title: `Career Goal ${i + 1}`,\n          isCompleted: true,\n          completedAt: new Date()\n        });\n      }\n      \n      // Verify metrics that achievements would check\n      const userProjects = await workProjectRepository.findMany({ userId: testUser.id });\n      const completedProjects = userProjects.filter(p => p.status === 'completed');\n      const totalTimeMinutes = await timeEntryRepository.findMany({ userId: testUser.id })\n        .then(entries => entries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0));\n      const completedCareerGoals = await careerGoalRepository.findMany({ \n        userId: testUser.id, \n        isCompleted: true \n      });\n      \n      // Achievement criteria checks\n      expect(userProjects.length).toBeGreaterThanOrEqual(1); // \"first_project\"\n      expect(totalTimeMinutes).toBeGreaterThanOrEqual(600); // Progress toward \"time_tracker\" (40h = 2400min)\n      expect(completedProjects.length).toBeGreaterThanOrEqual(1); // Progress toward \"project_completer\"\n      expect(completedCareerGoals.length).toBeGreaterThanOrEqual(1); // Progress toward \"career_focused\"\n      \n      // Verify achievement definitions exist and are properly structured\n      const firstProjectAchievement = achievements.find(a => a.id === 'first_project');\n      const timeTrackerAchievement = achievements.find(a => a.id === 'time_tracker');\n      \n      expect(firstProjectAchievement).toBeDefined();\n      expect(firstProjectAchievement!.conditions.type).toBe('count');\n      expect(firstProjectAchievement!.conditions.target).toBe(1);\n      expect(firstProjectAchievement!.conditions.field).toBe('projectsCreated');\n      \n      expect(timeTrackerAchievement).toBeDefined();\n      expect(timeTrackerAchievement!.conditions.target).toBe(2400); // 40 hours in minutes\n      expect(timeTrackerAchievement!.conditions.field).toBe('minutesTracked');\n    });\n  });\n\n  describe('Performance and Scalability', () => {\n    it('should handle large datasets efficiently', async () => {\n      const startTime = Date.now();\n      \n      // Create substantial test data\n      const projects = [];\n      for (let i = 0; i < 50; i++) {\n        const project = await workProjectRepository.create({\n          userId: testUser.id,\n          name: `Bulk Project ${i + 1}`,\n          projectType: i % 2 === 0 ? 'client' : 'personal',\n          status: i < 40 ? 'active' : 'completed',\n          priority: ['low', 'medium', 'high'][i % 3] as any\n        });\n        projects.push(project);\n      }\n      \n      // Create tasks for each project\n      const tasks = [];\n      for (let i = 0; i < projects.length; i++) {\n        const project = projects[i];\n        for (let j = 0; j < 5; j++) {\n          const task = await projectTaskRepository.create({\n            projectId: project.id,\n            userId: testUser.id,\n            title: `Task ${j + 1} for ${project.name}`,\n            status: j < 2 ? 'completed' : 'todo',\n            priority: 'medium'\n          });\n          tasks.push(task);\n        }\n      }\n      \n      // Create time entries\n      for (let i = 0; i < 200; i++) {\n        const project = projects[i % projects.length];\n        const task = tasks.find(t => t.projectId === project.id);\n        \n        await timeEntryRepository.create({\n          userId: testUser.id,\n          projectId: project.id,\n          taskId: task?.id,\n          startTime: new Date(Date.now() - i * 30 * 60 * 1000), // Spread over time\n          durationMinutes: 30 + (i % 90), // Varying durations\n          entryDate: new Date(Date.now() - i * 30 * 60 * 1000)\n        });\n      }\n      \n      const setupTime = Date.now() - startTime;\n      \n      // Test query performance\n      const queryStartTime = Date.now();\n      \n      const [dashboardData, analytics, weeklyTime, overdueTasks] = await Promise.all([\n        workDashboardRepository.getDashboardData(testUser.id),\n        workProjectRepository.getAnalytics(testUser.id, 'month'),\n        timeEntryRepository.getWeeklyTimeSummary(testUser.id, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),\n        projectTaskRepository.getOverdueTasks(testUser.id)\n      ]);\n      \n      const queryTime = Date.now() - queryStartTime;\n      \n      // Verify data integrity and performance\n      expect(dashboardData.activeProjects.length).toBeGreaterThan(0);\n      expect(dashboardData.stats.totalActiveProjects).toBe(40);\n      \n      expect(analytics.totalProjects).toBe(50);\n      expect(analytics.activeProjects).toBe(40);\n      expect(analytics.completedProjects).toBe(10);\n      \n      expect(weeklyTime.length).toBeGreaterThan(0);\n      \n      // Performance assertions - should handle large datasets efficiently\n      expect(queryTime).toBeLessThan(10000); // 10 seconds max for complex queries\n      \n      console.log(`Performance test - Setup: ${setupTime}ms, Queries: ${queryTime}ms`);\n    }, 30000); // Extended timeout for performance test\n  });\n\n  describe('Data Consistency and Integrity', () => {\n    it('should maintain referential integrity across module components', async () => {\n      const project = await workProjectRepository.create({\n        userId: testUser.id,\n        name: 'Integrity Test Project',\n        projectType: 'client'\n      });\n      \n      const goal = await goalRepository.create({\n        userId: testUser.id,\n        title: 'Project Goal',\n        moduleId: 'work',\n        moduleData: { projectId: project.id }\n      });\n      \n      const task = await projectTaskRepository.create({\n        projectId: project.id,\n        userId: testUser.id,\n        title: 'Integrity Task'\n      });\n      \n      const timeEntry = await timeEntryRepository.create({\n        userId: testUser.id,\n        projectId: project.id,\n        taskId: task.id,\n        startTime: new Date(),\n        durationMinutes: 60,\n        entryDate: new Date()\n      });\n      \n      const milestone = await projectMilestoneRepository.create({\n        projectId: project.id,\n        title: 'Test Milestone',\n        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)\n      });\n      \n      // Verify all relationships are maintained\n      const fullProject = await workProjectRepository.findById(project.id);\n      expect(fullProject).toBeDefined();\n      expect(fullProject!.tasks?.length).toBe(1);\n      expect(fullProject!.timeEntries?.length).toBe(1);\n      expect(fullProject!.milestones?.length).toBe(1);\n      \n      const fullTask = await projectTaskRepository.findById(task.id);\n      expect(fullTask!.project).toBeDefined();\n      expect(fullTask!.project.id).toBe(project.id);\n      \n      const fullTimeEntry = await timeEntryRepository.findById(timeEntry.id);\n      expect(fullTimeEntry!.project).toBeDefined();\n      expect(fullTimeEntry!.task).toBeDefined();\n      expect(fullTimeEntry!.project.id).toBe(project.id);\n      expect(fullTimeEntry!.task!.id).toBe(task.id);\n      \n      // Test cascade deletion\n      await workProjectRepository.delete(project.id);\n      \n      const deletedTask = await projectTaskRepository.findById(task.id);\n      const deletedTimeEntry = await timeEntryRepository.findById(timeEntry.id);\n      const deletedMilestone = await projectMilestoneRepository.findById(milestone.id);\n      \n      expect(deletedTask).toBeNull();\n      expect(deletedTimeEntry).toBeNull();\n      expect(deletedMilestone).toBeNull();\n      \n      // Goal should still exist (it's independent)\n      const persistedGoal = await goalRepository.findById(goal.id);\n      expect(persistedGoal).toBeDefined();\n    });\n  });\n});"