import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock providers for testing
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};

// Re-export everything from RTL
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Common test utilities
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockGoal = (overrides = {}) => ({
  id: '1',
  title: 'Test Goal',
  description: 'Test goal description',
  status: 'ACTIVE' as const,
  priority: 'MEDIUM' as const,
  targetDate: new Date(),
  userId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Wait for async operations
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Mock data generators
export const generateMockGoals = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    createMockGoal({
      id: `${index + 1}`,
      title: `Goal ${index + 1}`,
    })
  );

// Test ID helpers
export const testIds = {
  button: (name: string) => `button-${name}`,
  input: (name: string) => `input-${name}`,
  form: (name: string) => `form-${name}`,
  modal: (name: string) => `modal-${name}`,
  card: (name: string) => `card-${name}`,
} as const;