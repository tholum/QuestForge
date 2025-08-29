import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

// Start the MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Stop the server after all tests
afterAll(() => {
  server.close();
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';