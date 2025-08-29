/**
 * Module system exports
 * 
 * This file exports all available modules and core module system functionality
 */

// Core module system
export * from './core';

// Example modules
export { FitnessModule } from './fitness/FitnessModule';
export { LearningModule } from './learning/LearningModule';
export { HomeProjectsModule } from './home/HomeProjectsModule';
export { BibleModule } from './bible/BibleModule';

// Module registry utility to get all available modules
import { FitnessModule } from './fitness/FitnessModule';
import { LearningModule } from './learning/LearningModule';
import { HomeProjectsModule } from './home/HomeProjectsModule';
import { BibleModule } from './bible/BibleModule';
import { IModule } from '../types/module';

/**
 * Registry of all available modules
 */
export const AVAILABLE_MODULES: Record<string, IModule> = {
  fitness: FitnessModule,
  learning: LearningModule,
  home_projects: HomeProjectsModule,
  bible: BibleModule
};

/**
 * Get all available modules
 */
export function getAllAvailableModules(): IModule[] {
  return Object.values(AVAILABLE_MODULES);
}

/**
 * Get module by ID
 */
export function getModuleById(moduleId: string): IModule | undefined {
  return AVAILABLE_MODULES[moduleId];
}

/**
 * Get modules by category/tag
 */
export function getModulesByKeyword(keyword: string): IModule[] {
  return Object.values(AVAILABLE_MODULES).filter(module =>
    module.metadata.keywords.includes(keyword.toLowerCase())
  );
}