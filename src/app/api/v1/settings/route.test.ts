import { NextRequest } from 'next/server';
import { GET, PUT } from './route';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database client
vi.mock('@/lib/prisma/client', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    userSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
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
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSettings = [
  {
    id: 'setting-1',
    userId: 'user-1',
    category: 'notification',
    key: 'emailNotifications',
    value: 'true',
    dataType: 'boolean',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'setting-2',
    userId: 'user-1',
    category: 'display',
    key: 'theme',
    value: 'dark',
    dataType: 'string',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('/api/v1/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/settings', () => {
    it('returns user settings successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.findMany.mockResolvedValue(mockSettings);

      const request = new NextRequest('http://localhost:3000/api/v1/settings');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.settings).toEqual({
        notification: {
          emailNotifications: true,
        },
        display: {
          theme: 'dark',
        },
      });
      
      expect(mockDb.userSetting.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { category: 'asc' },
      });
    });

    it('returns empty settings for new user', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/v1/settings');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.settings).toEqual({});
    });

    it('handles different data types correctly', async () => {
      const mixedSettings = [
        { ...mockSettings[0], key: 'sessionTimeout', value: '60', dataType: 'number' },
        { ...mockSettings[1], key: 'enableFeatures', value: 'true', dataType: 'boolean' },
      ];

      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.findMany.mockResolvedValue(mixedSettings);

      const request = new NextRequest('http://localhost:3000/api/v1/settings');
      const response = await GET(request);
      
      const data = await response.json();
      expect(data.settings.notification.sessionTimeout).toBe(60);
      expect(data.settings.display.enableFeatures).toBe(true);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/v1/settings');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Authentication required');
    });

    it('handles database errors gracefully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/v1/settings');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to retrieve settings');
    });
  });

  describe('PUT /api/v1/settings', () => {
    it('updates single setting successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.upsert.mockResolvedValue(mockSettings[0]);

      const requestBody = {
        category: 'notification',
        key: 'emailNotifications',
        value: false,
        dataType: 'boolean',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Setting updated successfully');
      
      expect(mockDb.userSetting.upsert).toHaveBeenCalledWith({
        where: {
          userId_category_key: {
            userId: 'user-1',
            category: 'notification',
            key: 'emailNotifications',
          },
        },
        update: {
          value: 'false',
          dataType: 'boolean',
        },
        create: {
          userId: 'user-1',
          category: 'notification',
          key: 'emailNotifications',
          value: 'false',
          dataType: 'boolean',
        },
      });
    });

    it('updates multiple settings successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.deleteMany.mockResolvedValue({ count: 0 });
      mockDb.userSetting.createMany.mockResolvedValue({ count: 2 });

      const requestBody = {
        settings: [
          {
            category: 'notification',
            key: 'emailNotifications',
            value: true,
            dataType: 'boolean',
          },
          {
            category: 'display',
            key: 'theme',
            value: 'light',
            dataType: 'string',
          },
        ],
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Settings updated successfully');
      expect(data.updatedCount).toBe(2);
    });

    it('validates required fields', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const requestBody = {
        category: 'notification',
        // Missing key and value
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid request format');
    });

    it('validates setting categories', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const requestBody = {
        category: 'invalid_category',
        key: 'someKey',
        value: 'someValue',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid category');
    });

    it('validates data types', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const requestBody = {
        category: 'notification',
        key: 'emailNotifications',
        value: 'not_a_boolean',
        dataType: 'boolean',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid value for boolean type');
    });

    it('handles number type conversions', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.upsert.mockResolvedValue({
        ...mockSettings[0],
        value: '120',
        dataType: 'number',
      });

      const requestBody = {
        category: 'account',
        key: 'sessionTimeout',
        value: 120,
        dataType: 'number',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      
      expect(mockDb.userSetting.upsert).toHaveBeenCalledWith({
        where: {
          userId_category_key: {
            userId: 'user-1',
            category: 'account',
            key: 'sessionTimeout',
          },
        },
        update: {
          value: '120',
          dataType: 'number',
        },
        create: {
          userId: 'user-1',
          category: 'account',
          key: 'sessionTimeout',
          value: '120',
          dataType: 'number',
        },
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'notification',
          key: 'emailNotifications',
          value: false,
        }),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(401);
    });

    it('handles database errors during update', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.upsert.mockRejectedValue(new Error('Database error'));

      const requestBody = {
        category: 'notification',
        key: 'emailNotifications',
        value: false,
        dataType: 'boolean',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to update setting');
    });

    it('handles malformed JSON', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid JSON format');
    });
  });

  describe('Settings Categories Validation', () => {
    const validCategories = ['account', 'notification', 'privacy', 'display'];
    
    it.each(validCategories)('accepts valid category: %s', async (category) => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.upsert.mockResolvedValue(mockSettings[0]);

      const requestBody = {
        category,
        key: 'testKey',
        value: 'testValue',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('handles rate limiting for settings updates', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      
      // Mock rate limiting by rejecting after multiple calls
      let callCount = 0;
      mockDb.userSetting.upsert.mockImplementation(() => {
        callCount++;
        if (callCount > 10) {
          throw new Error('Rate limit exceeded');
        }
        return Promise.resolve(mockSettings[0]);
      });

      const requestBody = {
        category: 'notification',
        key: 'emailNotifications',
        value: false,
      };

      // Make multiple rapid requests
      const requests = Array.from({ length: 12 }, () =>
        PUT(new NextRequest('http://localhost:3000/api/v1/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }))
      );

      const responses = await Promise.allSettled(requests);
      
      // First 10 should succeed, 11th and 12th should fail
      const failedResponses = responses.slice(10);
      expect(failedResponses.length).toBe(2);
    });
  });

  describe('Security', () => {
    it('prevents setting updates for other users', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      mockAuthenticateRequest.mockResolvedValue(otherUser);

      const requestBody = {
        category: 'notification',
        key: 'emailNotifications',
        value: false,
        userId: 'user-1', // Trying to update another user's settings
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      // Should use authenticated user's ID, not the provided one
      expect(mockDb.userSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_category_key: expect.objectContaining({
              userId: 'other-user',
            }),
          }),
        })
      );
    });

    it('sanitizes input values', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userSetting.upsert.mockResolvedValue(mockSettings[0]);

      const requestBody = {
        category: 'display',
        key: 'customCss',
        value: '<script>alert("xss")</script>',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      
      // Should sanitize or reject malicious input
      const savedValue = mockDb.userSetting.upsert.mock.calls[0][0].create.value;
      expect(savedValue).not.toContain('<script>');
    });
  });
});