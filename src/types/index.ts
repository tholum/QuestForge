/**
 * Central exports for all type definitions
 */

// Module system types
export * from './module';
export * from './gamification';

// Core application types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Base entity interface for all database models
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User preferences structure
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    achievements: boolean;
    reminders: boolean;
    streaks: boolean;
    deadlines: boolean;
  };
  privacy: {
    showProfile: boolean;
    showProgress: boolean;
    showAchievements: boolean;
  };
  ui: {
    compactMode: boolean;
    animationsEnabled: boolean;
    defaultView: 'mobile' | 'desktop';
  };
}

/**
 * Goal difficulty levels
 */
export type GoalDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Goal priority levels
 */
export type GoalPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Goal status types
 */
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

/**
 * Progress tracking entry
 */
export interface ProgressEntry {
  id: string;
  goalId: string;
  userId: string;
  value: number;
  maxValue: number;
  percentage: number;
  xpEarned: number;
  notes?: string;
  recordedAt: Date;
  createdAt: Date;
}

/**
 * Goal entity interface
 */
export interface Goal extends BaseEntity {
  title: string;
  description?: string;
  isCompleted: boolean;
  targetDate?: Date;
  difficulty: GoalDifficulty;
  priority: GoalPriority;
  status: GoalStatus;
  userId: string;
  moduleId: string;
  moduleData?: Record<string, unknown>;
  parentGoalId?: string;
  progress: ProgressEntry[];
  completedAt?: Date;
  estimatedDuration?: number; // in minutes
  tags?: string[];
}

/**
 * Module configuration interface
 */
export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  isEnabled: boolean;
  isInstalled: boolean;
  config: Record<string, unknown>;
  installedAt?: Date;
  lastUpdated?: Date;
}

/**
 * Error types for the application
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL',
  MODULE_ERROR = 'MODULE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

/**
 * Application error class
 */
export class AppError extends Error {
  type: ErrorType;
  details?: unknown;
  timestamp: Date;

  constructor(config: { type: ErrorType; message: string; details?: unknown }) {
    super(config.message);
    this.type = config.type;
    this.details = config.details;
    this.timestamp = new Date();
    this.name = 'AppError';
  }
}

/**
 * Event emitter types
 */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

export interface EventMap {
  [key: string]: unknown;
}

/**
 * Generic form state interface
 */
export interface FormState<T = Record<string, unknown>> {
  data: T;
  errors: Record<keyof T, string[]>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  touchedFields: Set<keyof T>;
}

/**
 * Component loading states
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

/**
 * Async operation state
 */
export interface AsyncState<T = unknown> extends LoadingState {
  data?: T;
}

/**
 * Generic filter interface
 */
export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';
  value: unknown;
}

/**
 * Sort configuration
 */
export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Query configuration for data fetching
 */
export interface QueryConfig {
  filters?: Filter[];
  sort?: Sort[];
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Database transaction context
 */
export interface TransactionContext {
  id: string;
  timestamp: Date;
  userId?: string;
}