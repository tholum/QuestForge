import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getModuleRegistry, initializeModuleSystem } from '../../../../lib/module-helpers';
import { getAllAvailableModules, getModuleById } from '../../../../modules';
import { ModuleQueryFilter } from '../../../../types/module';

// Initialize module system
let moduleRegistry: any = null;

async function ensureModuleRegistry() {
  if (!moduleRegistry) {
    moduleRegistry = await initializeModuleSystem(prisma);
  }
  return moduleRegistry;
}

/**
 * GET /api/v1/modules
 * Get all modules with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled');
    const installed = searchParams.get('installed');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const registry = await ensureModuleRegistry();
    
    const filter: ModuleQueryFilter = {
      ...(enabled !== null && { enabled: enabled === 'true' }),
      ...(installed !== null && { installed: installed === 'true' }),
      ...(search && { search }),
      ...(status && { status: status as any })
    };

    const modules = registry.getModules(filter);
    
    // Enhance with state information
    const modulesWithState = modules.map((module: any) => {
      const state = registry.getModuleState(module.id);
      return {
        ...module,
        state
      };
    });

    return NextResponse.json({
      success: true,
      data: modulesWithState,
      message: `Found ${modulesWithState.length} modules`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch modules',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/modules
 * Install a new module
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, config, autoEnable } = body;

    if (!moduleId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const registry = await ensureModuleRegistry();
    
    // Get the module from available modules
    const moduleData = getModuleById(moduleId);
    if (!moduleData) {
      return NextResponse.json(
        {
          success: false,
          error: `Module '${moduleId}' not found`,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    // Install the module
    const result = await registry.register(moduleData, {
      config: config || {},
      autoEnable: autoEnable || false
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: `Module '${moduleId}' installed successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error installing module:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to install module',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}