import { ModuleDependencyResult } from '../../types/module';
import { ModuleRegistry } from './ModuleRegistry';

/**
 * Resolves and manages module dependencies
 */
export class ModuleDependencyResolver {
  private registry: ModuleRegistry;

  constructor(registry: ModuleRegistry) {
    this.registry = registry;
  }

  /**
   * Resolve dependencies for a module
   */
  async resolve(moduleId: string, dependencies: Record<string, string>): Promise<ModuleDependencyResult> {
    const dependencyList = Object.entries(dependencies).map(([depId, version]) => ({
      moduleId: depId,
      version,
      available: false,
      currentVersion: undefined as string | undefined
    }));

    const conflicts: { moduleId: string; reason: string }[] = [];
    let canInstall = true;

    // Check each dependency
    for (const dep of dependencyList) {
      const depModule = this.registry.getModule(dep.moduleId);
      const depState = this.registry.getModuleState(dep.moduleId);

      if (!depModule || !depState) {
        // Dependency not installed
        dep.available = false;
        conflicts.push({
          moduleId: dep.moduleId,
          reason: 'Dependency not installed'
        });
        canInstall = false;
      } else {
        // Dependency is available
        dep.available = true;
        dep.currentVersion = depModule.version;

        // Check version compatibility
        if (!this.isVersionCompatible(dep.currentVersion, dep.version)) {
          conflicts.push({
            moduleId: dep.moduleId,
            reason: `Version mismatch: required ${dep.version}, found ${dep.currentVersion}`
          });
          canInstall = false;
        }

        // Check if dependency is enabled (required for installation)
        if (depState.status !== 'enabled') {
          conflicts.push({
            moduleId: dep.moduleId,
            reason: 'Dependency is not enabled'
          });
          canInstall = false;
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(moduleId, dependencies);
    if (circularDeps.length > 0) {
      conflicts.push({
        moduleId: moduleId,
        reason: `Circular dependency detected: ${circularDeps.join(' -> ')}`
      });
      canInstall = false;
    }

    return {
      moduleId,
      dependencies: dependencyList,
      conflicts,
      canInstall
    };
  }

  /**
   * Get the dependency tree for a module
   */
  getDependencyTree(moduleId: string): string[] {
    const visited = new Set<string>();
    const tree: string[] = [];

    this.buildDependencyTree(moduleId, visited, tree);
    return tree;
  }

  /**
   * Get modules that depend on the given module
   */
  getDependents(moduleId: string): string[] {
    const dependents: string[] = [];
    const allModules = this.registry.getModules();

    for (const module of allModules) {
      const dependencies = module.metadata.dependencies || {};
      if (dependencies[moduleId]) {
        dependents.push(module.id);
      }
    }

    return dependents;
  }

  /**
   * Check if a module can be safely removed
   */
  canRemove(moduleId: string): { canRemove: boolean; blockers: string[] } {
    const dependents = this.getDependents(moduleId);
    const enabledDependents = dependents.filter(depId => {
      const state = this.registry.getModuleState(depId);
      return state && state.status === 'enabled';
    });

    return {
      canRemove: enabledDependents.length === 0,
      blockers: enabledDependents
    };
  }

  /**
   * Get the installation order for a set of modules
   */
  getInstallationOrder(moduleIds: string[]): string[] {
    const modules = moduleIds.map(id => this.registry.getModule(id)).filter(Boolean);
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Build dependency graph
    for (const module of modules) {
      if (!module) continue;
      
      graph.set(module.id, []);
      inDegree.set(module.id, 0);
    }

    for (const module of modules) {
      if (!module) continue;
      
      const dependencies = module.metadata.dependencies || {};
      for (const depId of Object.keys(dependencies)) {
        if (graph.has(depId)) {
          graph.get(depId)!.push(module.id);
          inDegree.set(module.id, (inDegree.get(module.id) || 0) + 1);
        }
      }
    }

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    for (const [moduleId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(moduleId);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const dependents = graph.get(current) || [];
      for (const dependent of dependents) {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);
        
        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    return result;
  }

  /**
   * Validate dependency chain for potential issues
   */
  validateDependencyChain(moduleId: string): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    this.validateChainRecursive(moduleId, visited, recursionStack, issues);

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Private helper methods

  private isVersionCompatible(currentVersion: string, requiredVersion: string): boolean {
    // Simple version comparison - in practice, you'd want to use semver
    const current = this.parseVersion(currentVersion);
    const required = this.parseVersion(requiredVersion);

    // Handle version ranges (simplified)
    if (requiredVersion.startsWith('^')) {
      // Compatible with same major version
      return current.major === required.major && 
             (current.minor > required.minor || 
              (current.minor === required.minor && current.patch >= required.patch));
    } else if (requiredVersion.startsWith('~')) {
      // Compatible with same minor version
      return current.major === required.major && 
             current.minor === required.minor && 
             current.patch >= required.patch;
    } else {
      // Exact version match
      return currentVersion === requiredVersion;
    }
  }

  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const cleanVersion = version.replace(/^[\^~]/, '');
    const [major, minor, patch] = cleanVersion.split('.').map(Number);
    return { major: major || 0, minor: minor || 0, patch: patch || 0 };
  }

  private detectCircularDependencies(
    moduleId: string, 
    dependencies: Record<string, string>,
    visited: Set<string> = new Set(),
    path: string[] = []
  ): string[] {
    if (visited.has(moduleId)) {
      const cycleStart = path.indexOf(moduleId);
      if (cycleStart !== -1) {
        return path.slice(cycleStart).concat(moduleId);
      }
      return [];
    }

    visited.add(moduleId);
    path.push(moduleId);

    for (const depId of Object.keys(dependencies)) {
      const depModule = this.registry.getModule(depId);
      if (depModule) {
        const cycle = this.detectCircularDependencies(
          depId,
          depModule.metadata.dependencies || {},
          new Set(visited),
          [...path]
        );
        if (cycle.length > 0) {
          return cycle;
        }
      }
    }

    return [];
  }

  private buildDependencyTree(
    moduleId: string,
    visited: Set<string>,
    tree: string[]
  ): void {
    if (visited.has(moduleId)) {
      return;
    }

    visited.add(moduleId);
    const module = this.registry.getModule(moduleId);
    
    if (module) {
      const dependencies = module.metadata.dependencies || {};
      for (const depId of Object.keys(dependencies)) {
        this.buildDependencyTree(depId, visited, tree);
      }
      tree.push(moduleId);
    }
  }

  private validateChainRecursive(
    moduleId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    issues: string[]
  ): void {
    if (recursionStack.has(moduleId)) {
      issues.push(`Circular dependency detected involving ${moduleId}`);
      return;
    }

    if (visited.has(moduleId)) {
      return;
    }

    visited.add(moduleId);
    recursionStack.add(moduleId);

    const module = this.registry.getModule(moduleId);
    if (module) {
      const dependencies = module.metadata.dependencies || {};
      
      for (const [depId, requiredVersion] of Object.entries(dependencies)) {
        const depModule = this.registry.getModule(depId);
        
        if (!depModule) {
          issues.push(`Missing dependency: ${depId} required by ${moduleId}`);
        } else {
          if (!this.isVersionCompatible(depModule.version, requiredVersion)) {
            issues.push(
              `Version conflict: ${moduleId} requires ${depId}@${requiredVersion}, ` +
              `but ${depModule.version} is installed`
            );
          }
          
          this.validateChainRecursive(depId, visited, recursionStack, issues);
        }
      }
    }

    recursionStack.delete(moduleId);
  }
}