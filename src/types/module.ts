import { ReactNode } from 'react';
import { Prisma } from '@prisma/client';

/**
 * Module capability flags that define what features a module supports
 */
export interface ModuleCapability {
  id: string;
  name: string;
  description: string;
  required?: boolean;
}

/**
 * Prisma schema extension for module-specific database tables
 */
export interface ModuleSchema {
  tables: Record<string, Prisma.DMMF.Model>;
  relations: Record<string, Prisma.DMMF.Field[]>;
  indexes: Record<string, string[]>;
}

/**
 * API route definitions for module endpoints
 */
export interface ModuleAPIRoutes {
  baseRoute: string;
  routes: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    handler: string; // Path to handler function
    middleware?: string[]; // Optional middleware
    permissions?: string[]; // Required permissions
  }[];
}

/**
 * Achievement configuration for gamification
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  conditions: {
    type: 'count' | 'streak' | 'completion' | 'custom';
    target?: number;
    field?: string;
    customValidator?: string; // Path to custom validation function
  };
  xpReward: number;
  unlockConditions?: string[]; // IDs of prerequisite achievements
}

/**
 * Points configuration for module actions
 */
export interface PointsConfiguration {
  actions: Record<string, {
    basePoints: number;
    difficultyMultiplier?: boolean; // Apply difficulty multiplier
    streakBonus?: boolean; // Apply streak bonus
    description: string;
  }>;
  difficultyMultipliers: {
    easy: number;
    medium: number;
    hard: number;
    expert: number;
  };
  streakBonusPercentage: number; // Percentage bonus per consecutive day
}

/**
 * Module state for runtime management
 */
export interface ModuleState {
  id: string;
  status: 'installing' | 'installed' | 'enabled' | 'disabled' | 'error' | 'uninstalling';
  version: string;
  lastError?: string;
  config: Record<string, unknown>;
  dependencies: string[]; // Module IDs this module depends on
  dependents: string[]; // Module IDs that depend on this module
}

/**
 * Module metadata for discovery and management
 */
export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  keywords: string[];
  homepage?: string;
  repository?: string;
  license: string;
  minSystemVersion: string;
  dependencies: Record<string, string>; // moduleId -> version
  peerDependencies?: Record<string, string>;
}

/**
 * Component props interfaces for module UI components
 */
export interface ModuleDashboardProps {
  moduleId: string;
  userId: string;
  config: Record<string, unknown>;
}

export interface ModuleMobileQuickAddProps {
  moduleId: string;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export interface ModuleDesktopDetailProps {
  moduleId: string;
  userId: string;
  config: Record<string, unknown>;
}

export interface ModuleSettingsProps {
  moduleId: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}

/**
 * Module UI components interface
 */
export interface ModuleComponents {
  dashboard: React.ComponentType<ModuleDashboardProps>;
  mobileQuickAdd: React.ComponentType<ModuleMobileQuickAddProps>;
  desktopDetail: React.ComponentType<ModuleDesktopDetailProps>;
  settings: React.ComponentType<ModuleSettingsProps>;
}

/**
 * Module lifecycle hooks interface
 */
export interface ModuleLifecycle {
  onInstall(): Promise<void>;
  onUninstall(): Promise<void>;
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
  onUpgrade?(fromVersion: string, toVersion: string): Promise<void>;
  onConfigChange?(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): Promise<void>;
}

/**
 * Main module interface that all modules must implement
 */
export interface IModule extends ModuleLifecycle {
  // Core identification
  id: string;
  name: string;
  version: string;
  icon: string;
  color: string;

  // Metadata
  metadata: ModuleMetadata;

  // UI Components
  components: ModuleComponents;

  // Data schema and API
  dataSchema?: ModuleSchema;
  apiRoutes?: ModuleAPIRoutes;

  // Gamification
  achievements: Achievement[];
  pointsConfig: PointsConfiguration;

  // Permissions and capabilities
  permissions: string[];
  capabilities: ModuleCapability[];

  // Runtime state (managed by registry)
  state?: ModuleState;
}

/**
 * Module registration options
 */
export interface ModuleRegistrationOptions {
  autoEnable?: boolean;
  skipDependencyCheck?: boolean;
  config?: Record<string, unknown>;
}

/**
 * Module query filters for registry searches
 */
export interface ModuleQueryFilter {
  status?: ModuleState['status'] | ModuleState['status'][];
  enabled?: boolean;
  installed?: boolean;
  search?: string; // Search in name, description, keywords
  category?: string;
  author?: string;
}

/**
 * Module operation result
 */
export interface ModuleOperationResult {
  success: boolean;
  moduleId: string;
  error?: string;
  warnings?: string[];
  data?: unknown;
}

/**
 * Module dependency resolution result
 */
export interface ModuleDependencyResult {
  moduleId: string;
  dependencies: {
    moduleId: string;
    version: string;
    available: boolean;
    currentVersion?: string;
  }[];
  conflicts: {
    moduleId: string;
    reason: string;
  }[];
  canInstall: boolean;
}

/**
 * Module validation result
 */
export interface ModuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  moduleId: string;
}

/**
 * Event types for module system events
 */
export type ModuleEventType = 
  | 'module:installing'
  | 'module:installed'
  | 'module:enabling'
  | 'module:enabled'
  | 'module:disabling'
  | 'module:disabled'
  | 'module:uninstalling'
  | 'module:uninstalled'
  | 'module:error'
  | 'module:config-changed';

/**
 * Module system event
 */
export interface ModuleEvent {
  type: ModuleEventType;
  moduleId: string;
  timestamp: Date;
  data?: unknown;
  error?: string;
}

/**
 * Module event listener function
 */
export type ModuleEventListener = (event: ModuleEvent) => void | Promise<void>;