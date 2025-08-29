import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from './route';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database client
vi.mock('@/lib/prisma/client', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    goal: {
      findMany: vi.fn(),
    },
    calendarEvent: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    progress: {
      findMany: vi.fn(),
    },
  },
}));

// Mock auth middleware
vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn(),
}));

import { db } from '@/lib/prisma/client';
import { authenticateRequest } from '@/lib/auth/middleware';

const mockAuthenticateRequest = authenticateRequest as any;
const mockDb = db as any;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
};

const mockEvents = [
  {
    id: 'event-1',
    title: 'Morning Workout',
    description: 'Gym session',
    startTime: new Date('2024-01-15T08:00:00Z'),
    endTime: new Date('2024-01-15T09:00:00Z'),
    type: 'goal',
    goalId: 'goal-1',
    userId: 'user-1',
    module: 'fitness',
    priority: 'high',
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'event-2',
    title: 'Team Meeting',
    description: 'Weekly standup',
    startTime: new Date('2024-01-15T14:00:00Z'),
    endTime: new Date('2024-01-15T15:00:00Z'),
    type: 'deadline',
    goalId: 'goal-2',
    userId: 'user-1',
    module: 'work',
    priority: 'medium',
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockGoals = [
  {
    id: 'goal-1',
    title: 'Fitness Challenge',
    module: 'fitness',
    userId: 'user-1',
    status: 'active',
    dueDate: new Date('2024-01-20T23:59:59Z'),
    targetValue: 30,
    currentValue: 15,
  },
  {
    id: 'goal-2',
    title: 'Project Delivery',
    module: 'work',
    userId: 'user-1',
    status: 'active',
    dueDate: new Date('2024-01-18T17:00:00Z'),
    targetValue: 100,
    currentValue: 75,
  },
];

describe('/api/v1/calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/calendar', () => {
    it('returns calendar events and deadlines successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findMany.mockResolvedValue(mockEvents);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);

      const request = new NextRequest('http://localhost:3000/api/v1/calendar');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.events).toHaveLength(2);
      expect(data.deadlines).toBeInstanceOf(Array);
      expect(data.upcomingGoals).toBeInstanceOf(Array);
      
      // Check event structure
      const firstEvent = data.events[0];
      expect(firstEvent).toMatchObject({
        id: 'event-1',
        title: 'Morning Workout',
        start: expect.any(String),
        end: expect.any(String),
        type: 'goal',
        module: 'fitness',
        priority: 'high',
      });
    });

    it('filters events by date range', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findMany.mockResolvedValue(mockEvents.slice(0, 1));
      mockDb.goal.findMany.mockResolvedValue(mockGoals);

      const request = new NextRequest('http://localhost:3000/api/v1/calendar?start=2024-01-15&end=2024-01-15');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.events).toHaveLength(1);
      
      // Should call findMany with date filters
      expect(mockDb.calendarEvent.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          startTime: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        include: { goal: true },
        orderBy: { startTime: 'asc' },
      });
    });

    it('filters by module', async () => {
      const fitnessEvents = mockEvents.filter(e => e.module === 'fitness');
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findMany.mockResolvedValue(fitnessEvents);
      mockDb.goal.findMany.mockResolvedValue(mockGoals.filter(g => g.module === 'fitness'));

      const request = new NextRequest('http://localhost:3000/api/v1/calendar?module=fitness');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.events).toHaveLength(1);
      expect(data.events[0].module).toBe('fitness');
    });

    it('calculates upcoming deadlines correctly', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findMany.mockResolvedValue(mockEvents);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);

      const request = new NextRequest('http://localhost:3000/api/v1/calendar');
      const response = await GET(request);
      
      const data = await response.json();
      expect(data.deadlines).toBeInstanceOf(Array);
      
      if (data.deadlines.length > 0) {
        const deadline = data.deadlines[0];
        expect(deadline).toHaveProperty('goalId');
        expect(deadline).toHaveProperty('goalTitle');
        expect(deadline).toHaveProperty('dueDate');
        expect(deadline).toHaveProperty('daysRemaining');
        expect(deadline).toHaveProperty('priority');
      }
    });

    it('handles empty calendar data', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findMany.mockResolvedValue([]);
      mockDb.goal.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/v1/calendar');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.events).toHaveLength(0);
      expect(data.deadlines).toHaveLength(0);
      expect(data.upcomingGoals).toHaveLength(0);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/v1/calendar');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Authentication required');
    });

    it('handles database errors gracefully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/v1/calendar');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to retrieve calendar data');
    });
  });

  describe('POST /api/v1/calendar', () => {
    it('creates calendar event successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.create.mockResolvedValue({
        ...mockEvents[0],
        id: 'new-event-1',
      });

      const requestBody = {
        title: 'New Meeting',
        description: 'Project discussion',
        startTime: '2024-01-16T10:00:00Z',
        endTime: '2024-01-16T11:00:00Z',
        type: 'meeting',
        module: 'work',
        priority: 'medium',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Event created successfully');
      expect(data.event).toHaveProperty('id');
      
      expect(mockDb.calendarEvent.create).toHaveBeenCalledWith({
        data: {
          title: 'New Meeting',
          description: 'Project discussion',
          startTime: new Date('2024-01-16T10:00:00Z'),
          endTime: new Date('2024-01-16T11:00:00Z'),
          type: 'meeting',
          userId: 'user-1',
          module: 'work',
          priority: 'medium',
          status: 'scheduled',
        },
      });
    });

    it('creates goal-linked event successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.create.mockResolvedValue({
        ...mockEvents[0],
        goalId: 'goal-1',
      });

      const requestBody = {
        title: 'Goal Session',
        startTime: '2024-01-16T08:00:00Z',
        endTime: '2024-01-16T09:00:00Z',
        type: 'goal',
        goalId: 'goal-1',
        module: 'fitness',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      expect(mockDb.calendarEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          goalId: 'goal-1',
          type: 'goal',
        }),
      });
    });

    it('validates required fields', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const requestBody = {
        title: 'Missing dates',
        // Missing startTime and endTime
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('required');
    });

    it('validates date format and logic', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const requestBody = {
        title: 'Invalid dates',
        startTime: '2024-01-16T10:00:00Z',
        endTime: '2024-01-16T09:00:00Z', // End before start
        type: 'meeting',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('End time must be after start time');
    });

    it('handles malformed JSON', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid JSON format');
    });
  });

  describe('PUT /api/v1/calendar', () => {
    it('updates calendar event successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findUnique.mockResolvedValue({
        ...mockEvents[0],
        userId: 'user-1',
      });
      mockDb.calendarEvent.update.mockResolvedValue({
        ...mockEvents[0],
        title: 'Updated Meeting',
      });

      const requestBody = {
        id: 'event-1',
        title: 'Updated Meeting',
        description: 'Updated description',
        priority: 'high',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Event updated successfully');
      
      expect(mockDb.calendarEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: {
          title: 'Updated Meeting',
          description: 'Updated description',
          priority: 'high',
        },
      });
    });

    it('validates event exists and belongs to user', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findUnique.mockResolvedValue(null);

      const requestBody = {
        id: 'nonexistent-event',
        title: 'Updated Meeting',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Event not found');
    });

    it('prevents updating another user\'s event', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findUnique.mockResolvedValue({
        ...mockEvents[0],
        userId: 'other-user',
      });

      const requestBody = {
        id: 'event-1',
        title: 'Unauthorized update',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Event not found');
    });
  });

  describe('DELETE /api/v1/calendar', () => {
    it('deletes calendar event successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findUnique.mockResolvedValue({
        ...mockEvents[0],
        userId: 'user-1',
      });
      mockDb.calendarEvent.delete.mockResolvedValue(mockEvents[0]);

      const request = new NextRequest('http://localhost:3000/api/v1/calendar?id=event-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Event deleted successfully');
      
      expect(mockDb.calendarEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event-1' },
      });
    });

    it('validates event exists and belongs to user', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/calendar?id=nonexistent-event', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Event not found');
    });

    it('requires event ID parameter', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Event ID is required');
    });

    it('prevents deleting another user\'s event', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findUnique.mockResolvedValue({
        ...mockEvents[0],
        userId: 'other-user',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/calendar?id=event-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Event not found');
    });
  });

  describe('Recurring Events', () => {
    it('handles recurring event creation', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.create.mockResolvedValue({
        ...mockEvents[0],
        recurrence: 'daily',
      });

      const requestBody = {
        title: 'Daily Workout',
        startTime: '2024-01-16T08:00:00Z',
        endTime: '2024-01-16T09:00:00Z',
        type: 'goal',
        recurrence: 'daily',
        recurrenceEnd: '2024-02-16T09:00:00Z',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      expect(mockDb.calendarEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recurrence: 'daily',
          recurrenceEnd: new Date('2024-02-16T09:00:00Z'),
        }),
      });
    });
  });

  describe('Event Status Management', () => {
    it('updates event status', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findUnique.mockResolvedValue({
        ...mockEvents[0],
        userId: 'user-1',
      });
      mockDb.calendarEvent.update.mockResolvedValue({
        ...mockEvents[0],
        status: 'completed',
      });

      const requestBody = {
        id: 'event-1',
        status: 'completed',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      
      expect(mockDb.calendarEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { status: 'completed' },
      });
    });

    it('validates status values', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.calendarEvent.findUnique.mockResolvedValue({
        ...mockEvents[0],
        userId: 'user-1',
      });

      const requestBody = {
        id: 'event-1',
        status: 'invalid-status',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid status');
    });
  });

  describe('Time Zone Handling', () => {
    it('handles different time zones correctly', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        ...mockUser,
        timezone: 'America/New_York',
      });
      mockDb.calendarEvent.create.mockResolvedValue(mockEvents[0]);

      const requestBody = {
        title: 'Timezone Test',
        startTime: '2024-01-16T15:00:00Z', // UTC
        endTime: '2024-01-16T16:00:00Z',
        type: 'meeting',
        timezone: 'America/New_York',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      // Should store in UTC but handle timezone conversion
      expect(mockDb.calendarEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startTime: expect.any(Date),
          endTime: expect.any(Date),
        }),
      });
    });
  });
});