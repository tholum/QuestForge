import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { getModuleRegistry, initializeModuleSystem } from '../../../../../../lib/module-helpers';

// Initialize module system
let moduleRegistry: any = null;

async function ensureModuleRegistry() {
  if (!moduleRegistry) {
    moduleRegistry = await initializeModuleSystem(prisma);
  }
  return moduleRegistry;
}

/**
 * POST /api/v1/modules/[moduleId]/actions
 * Perform actions on a module (enable, disable, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const registry = await ensureModuleRegistry();
    let result;

    switch (action) {
      case 'enable':
        result = await registry.enable(moduleId);
        break;
      
      case 'disable':
        result = await registry.disable(moduleId);
        break;
      
      case 'validate':
        const moduleData = registry.getModule(moduleId);
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
        result = await registry.validateModule(moduleData);
        break;
      
      case 'getDependencies':
        result = await registry.getDependencyInfo(moduleId);
        break;
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action '${action}'`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
    }

    if (result.success !== false) { // Handle both boolean success and objects without success field
      return NextResponse.json({
        success: true,
        data: result,
        message: `Action '${action}' completed for module '${moduleId}'`,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || `Failed to execute action '${action}'`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error executing module action:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute module action',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}