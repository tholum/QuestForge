import { http, HttpResponse } from 'msw';

// Mock data
const mockUsers = [
  {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  },
];

const mockGoals = [
  {
    id: '1',
    title: 'Learn TypeScript',
    description: 'Master TypeScript fundamentals and advanced concepts',
    status: 'ACTIVE',
    priority: 'HIGH',
    targetDate: '2024-12-31T00:00:00.000Z',
    userId: '1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Build a Full-Stack App',
    description: 'Create a complete application with React and Node.js',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    targetDate: '2024-06-30T00:00:00.000Z',
    userId: '1',
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  },
];

export const handlers = [
  // Users API handlers
  http.get('/api/v1/users', () => {
    return HttpResponse.json(mockUsers);
  }),

  http.get('/api/v1/users/:id', ({ params }) => {
    const { id } = params;
    const user = mockUsers.find((u) => u.id === id);
    
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(user);
  }),

  http.post('/api/v1/users', async ({ request }) => {
    const newUser = await request.json() as any;
    const user = {
      id: String(mockUsers.length + 1),
      ...newUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockUsers.push(user);
    return HttpResponse.json(user, { status: 201 });
  }),

  http.put('/api/v1/users/:id', async ({ params, request }) => {
    const { id } = params;
    const updates = await request.json() as any;
    const userIndex = mockUsers.findIndex((u) => u.id === id);
    
    if (userIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockUsers[userIndex]);
  }),

  http.delete('/api/v1/users/:id', ({ params }) => {
    const { id } = params;
    const userIndex = mockUsers.findIndex((u) => u.id === id);
    
    if (userIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockUsers.splice(userIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Goals API handlers
  http.get('/api/v1/goals', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    const filteredGoals = userId 
      ? mockGoals.filter((goal) => goal.userId === userId)
      : mockGoals;
    
    return HttpResponse.json(filteredGoals);
  }),

  http.get('/api/v1/goals/:id', ({ params }) => {
    const { id } = params;
    const goal = mockGoals.find((g) => g.id === id);
    
    if (!goal) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(goal);
  }),

  http.post('/api/v1/goals', async ({ request }) => {
    const newGoal = await request.json() as any;
    const goal = {
      id: String(mockGoals.length + 1),
      ...newGoal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockGoals.push(goal);
    return HttpResponse.json(goal, { status: 201 });
  }),

  http.put('/api/v1/goals/:id', async ({ params, request }) => {
    const { id } = params;
    const updates = await request.json() as any;
    const goalIndex = mockGoals.findIndex((g) => g.id === id);
    
    if (goalIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockGoals[goalIndex] = {
      ...mockGoals[goalIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockGoals[goalIndex]);
  }),

  http.delete('/api/v1/goals/:id', ({ params }) => {
    const { id } = params;
    const goalIndex = mockGoals.findIndex((g) => g.id === id);
    
    if (goalIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockGoals.splice(goalIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Error simulation handlers
  http.get('/api/v1/error', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  http.get('/api/v1/timeout', () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json({ message: 'Delayed response' }));
      }, 1000);
    });
  }),
];