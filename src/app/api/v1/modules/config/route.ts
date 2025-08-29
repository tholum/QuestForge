/**
 * Modules Config API Routes
 * 
 * Manages user-specific module configurations and enablement.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const ModuleConfigSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  isEnabled: z.boolean(),
  configuration: z.record(z.any()).optional()
})

const BulkModuleConfigSchema = z.array(ModuleConfigSchema)

const ModuleConfigUpdateSchema = z.object({
  isEnabled: z.boolean().optional(),
  configuration: z.record(z.any()).optional()
})

/**
 * Initialize default module configurations for a user
 */
async function initializeUserModuleConfigs(userId: string) {
  // Get all available modules
  const availableModules = await prisma.module.findMany({
    where: { isEnabled: true }
  })
  
  // Get existing user configurations
  const existingConfigs = await prisma.userModuleConfig.findMany({
    where: { userId },
    select: { moduleId: true }
  })
  
  const existingModuleIds = new Set(existingConfigs.map(c => c.moduleId))
  
  // Create configurations for modules that don't have them
  const newConfigs = availableModules
    .filter(module => !existingModuleIds.has(module.id))
    .map(module => ({
      userId,
      moduleId: module.id,
      isEnabled: true, // Enable by default
      configuration: '{}', // Default empty configuration
      usageCount: 0
    }))
  
  if (newConfigs.length > 0) {
    await prisma.userModuleConfig.createMany({
      data: newConfigs,
      skipDuplicates: true
    })
  }
  
  return newConfigs.length
}

/**
 * Update module usage statistics
 */
async function updateModuleUsage(userId: string, moduleId: string) {
  await prisma.userModuleConfig.upsert({
    where: {
      userId_moduleId: {
        userId,
        moduleId
      }
    },
    update: {
      lastUsedAt: new Date(),
      usageCount: {
        increment: 1
      }
    },
    create: {
      userId,
      moduleId,
      isEnabled: true,
      lastUsedAt: new Date(),
      usageCount: 1
    }
  })
}

/**
 * GET /api/v1/modules/config
 * Get user module configurations
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const url = new URL(request.url)
    const moduleId = url.searchParams.get('moduleId')
    const enabledOnly = url.searchParams.get('enabledOnly') === 'true'
    
    // Initialize default configurations if needed
    const initializedCount = await initializeUserModuleConfigs(request.user.id)
    
    // Build where clause
    const where: any = { userId: request.user.id }
    if (moduleId) {
      where.moduleId = moduleId
    }
    if (enabledOnly) {
      where.isEnabled = true
    }
    
    // Fetch user module configurations with module details
    const userConfigs = await prisma.userModuleConfig.findMany({
      where,
      include: {
        user: false, // Don't include user data to reduce payload
      },
      orderBy: [
        { isEnabled: 'desc' },
        { lastUsedAt: 'desc' },
        { usageCount: 'desc' }
      ]
    })
    
    // Get module information for each config
    const moduleIds = userConfigs.map(config => config.moduleId)
    const modules = await prisma.module.findMany({
      where: { id: { in: moduleIds } }
    })
    
    const moduleMap = modules.reduce((acc, module) => {
      acc[module.id] = module
      return acc
    }, {} as Record<string, any>)
    
    // Combine configuration and module data
    const configsWithModules = userConfigs.map(config => {
      const module = moduleMap[config.moduleId]
      let parsedConfiguration = {}
      
      try {
        parsedConfiguration = config.configuration ? JSON.parse(config.configuration) : {}
      } catch (error) {
        console.warn(`Failed to parse configuration for module ${config.moduleId}:`, error)
      }
      
      return {
        id: config.id,
        moduleId: config.moduleId,
        isEnabled: config.isEnabled,
        configuration: parsedConfiguration,
        lastUsedAt: config.lastUsedAt,
        usageCount: config.usageCount,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        module: module ? {
          id: module.id,
          name: module.name,
          version: module.version,
          isEnabled: module.isEnabled,
          isInstalled: module.isInstalled,
          config: module.config
        } : null
      }
    })
    
    // Calculate summary statistics
    const totalModules = configsWithModules.length
    const enabledModules = configsWithModules.filter(c => c.isEnabled).length
    const recentlyUsed = configsWithModules.filter(c => 
      c.lastUsedAt && c.lastUsedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    
    return NextResponse.json({
      success: true,
      data: {
        configurations: configsWithModules,
        summary: {
          totalModules,
          enabledModules,
          disabledModules: totalModules - enabledModules,
          recentlyUsed,
          initializedCount
        }
      },
      message: `Retrieved ${configsWithModules.length} module configurations`
    })
  }, 'Fetching module configurations')
}

/**
 * PUT /api/v1/modules/config
 * Update module configurations (single or bulk)
 */
async function handlePut(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    // Check if this is a bulk update or single module update
    const isBulkUpdate = Array.isArray(body)
    
    if (isBulkUpdate) {
      // Validate bulk configurations
      const validatedConfigs = BulkModuleConfigSchema.parse(body)
      
      // Verify all modules exist and are available
      const moduleIds = validatedConfigs.map(c => c.moduleId)
      const availableModules = await prisma.module.findMany({
        where: { 
          id: { in: moduleIds },
          isEnabled: true
        },
        select: { id: true }
      })
      
      const availableModuleIds = new Set(availableModules.map(m => m.id))
      const invalidModules = moduleIds.filter(id => !availableModuleIds.has(id))
      
      if (invalidModules.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Invalid or disabled modules: ${invalidModules.join(', ')}`
        }, { status: 400 })
      }
      
      // Perform bulk upsert using transaction
      const updatedConfigs = await prisma.$transaction(
        validatedConfigs.map(config => {
          const configurationStr = config.configuration ? JSON.stringify(config.configuration) : '{}'
          
          return prisma.userModuleConfig.upsert({
            where: {
              userId_moduleId: {
                userId: request.user.id,
                moduleId: config.moduleId
              }
            },
            update: {
              isEnabled: config.isEnabled,
              configuration: configurationStr,
              ...(config.isEnabled && { lastUsedAt: new Date() })
            },
            create: {
              userId: request.user.id,
              moduleId: config.moduleId,
              isEnabled: config.isEnabled,
              configuration: configurationStr,
              lastUsedAt: config.isEnabled ? new Date() : null,
              usageCount: 0
            }
          })
        })
      )
      
      return NextResponse.json({
        success: true,
        data: updatedConfigs,
        message: `${updatedConfigs.length} module configurations updated successfully`
      })
    } else {
      // Single module configuration update
      const { moduleId, ...updates } = body
      
      if (!moduleId) {
        return NextResponse.json({
          success: false,
          error: 'Module ID is required'
        }, { status: 400 })
      }
      
      const validatedUpdates = ModuleConfigUpdateSchema.parse(updates)
      
      // Verify module exists and is available
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { id: true, isEnabled: true }
      })
      
      if (!module || !module.isEnabled) {
        return NextResponse.json({
          success: false,
          error: 'Module not found or is disabled'
        }, { status: 404 })
      }
      
      // Prepare update data
      const updateData: any = {}
      
      if (validatedUpdates.isEnabled !== undefined) {
        updateData.isEnabled = validatedUpdates.isEnabled
        if (validatedUpdates.isEnabled) {
          updateData.lastUsedAt = new Date()
        }
      }
      
      if (validatedUpdates.configuration !== undefined) {
        updateData.configuration = JSON.stringify(validatedUpdates.configuration)
      }
      
      // Update or create module configuration
      const updatedConfig = await prisma.userModuleConfig.upsert({
        where: {
          userId_moduleId: {
            userId: request.user.id,
            moduleId: moduleId
          }
        },
        update: updateData,
        create: {
          userId: request.user.id,
          moduleId: moduleId,
          isEnabled: validatedUpdates.isEnabled ?? true,
          configuration: validatedUpdates.configuration ? JSON.stringify(validatedUpdates.configuration) : '{}',
          lastUsedAt: validatedUpdates.isEnabled !== false ? new Date() : null,
          usageCount: 0
        }
      })
      
      return NextResponse.json({
        success: true,
        data: updatedConfig,
        message: 'Module configuration updated successfully'
      })
    }
  }, 'Updating module configurations')
}

/**
 * POST /api/v1/modules/config
 * Track module usage or perform actions
 */
async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json()
    const { action, moduleId } = body
    
    if (action === 'track_usage' && moduleId) {
      // Update module usage statistics
      await updateModuleUsage(request.user.id, moduleId)
      
      return NextResponse.json({
        success: true,
        message: 'Module usage tracked successfully'
      })
    }
    
    if (action === 'initialize_defaults') {
      // Initialize default configurations for all available modules
      const initializedCount = await initializeUserModuleConfigs(request.user.id)
      
      return NextResponse.json({
        success: true,
        data: { initializedCount },
        message: `Initialized ${initializedCount} default module configurations`
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing parameters'
    }, { status: 400 })
  }, 'Processing module action')
}

/**
 * Main route handlers
 */
export async function GET(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handleGet)
}

export async function PUT(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['PUT'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handlePut)
}

export async function POST(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['POST'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handlePost)
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}