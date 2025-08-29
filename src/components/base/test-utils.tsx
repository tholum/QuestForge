import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { vi } from 'vitest'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator.vibrate for QuickAddButton tests
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn()

// Provider wrapper for components that might need context
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-background text-foreground">
      {children}
    </div>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Common test utilities
export const mockGoal = {
  id: 'test-goal-1',
  title: 'Test Goal',
  description: 'A test goal for components',
  isCompleted: false,
  isPaused: false,
  isCancelled: false,
  dueDate: new Date(Date.now() + 86400000), // Tomorrow
  startDate: new Date(),
  priority: 'medium' as const,
  category: 'fitness' as const,
  progress: 45,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  level: 5,
  xp: 1250,
  nextLevelXp: 1500,
  streak: 12,
  achievements: 8,
}

export const createMockGoal = (overrides?: Partial<typeof mockGoal>) => ({
  ...mockGoal,
  ...overrides,
})

// Accessibility test helpers
export const axeMatchers = {
  toHaveNoViolations: expect.toHaveNoViolations,
}

// Animation helpers for components with animations
export const waitForAnimation = (duration = 500) => 
  new Promise(resolve => setTimeout(resolve, duration))

// Component testing utilities
export const getByTextContent = (container: HTMLElement, text: string) => {
  return Array.from(container.querySelectorAll('*')).find(
    element => element.textContent === text
  )
}

export const queryByTextContent = (container: HTMLElement, text: string) => {
  return Array.from(container.querySelectorAll('*')).find(
    element => element.textContent === text
  ) || null
}

// Toast testing utilities (since toasts might be portaled)
export const findToastByText = (text: string) => {
  // Look in document body since toasts might be portaled
  const elements = Array.from(document.body.querySelectorAll('*'))
  return elements.find(el => el.textContent?.includes(text))
}

// Form testing utilities
export const fillAndSubmitForm = async (
  user: ReturnType<typeof import('@testing-library/user-event').default.setup>,
  fields: Record<string, string>
) => {
  for (const [label, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(label, 'i'))
    await user.clear(field)
    await user.type(field, value)
  }
}

export * from '@testing-library/user-event'