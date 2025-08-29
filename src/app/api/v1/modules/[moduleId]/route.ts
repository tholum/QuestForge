import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getModuleRegistry, initializeModuleSystem } from '../../../../../lib/module-helpers';

// Initialize module system
let moduleRegistry: any = null;

async function ensureModuleRegistry() {
  if (!moduleRegistry) {
    moduleRegistry = await initializeModuleSystem(prisma);
  }
  return moduleRegistry;
}

/**
 * GET /api/v1/modules/[moduleId]
 * Get specific module information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;
    const registry = await ensureModuleRegistry();
    
    const moduleData = registry.getModule(moduleId);
    const state = registry.getModuleState(moduleId);

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

    return NextResponse.json({
      success: true,
      data: {
        ...moduleData,
        state
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch module',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/modules/[moduleId]
 * Update module configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;
    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid configuration object is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const registry = await ensureModuleRegistry();
    
    const result = await registry.updateConfig(moduleId, config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: `Module '${moduleId}' configuration updated`,
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
    console.error('Error updating module configuration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update module configuration',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/modules/[moduleId]
 * Uninstall a module
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;
    const registry = await ensureModuleRegistry();
    
    const result = await registry.unregister(moduleId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: `Module '${moduleId}' uninstalled successfully`,
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
    console.error('Error uninstalling module:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to uninstall module',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}