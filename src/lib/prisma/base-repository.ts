/**
 * Base Repository Pattern
 * 
 * Abstract base repository providing common CRUD operations with
 * error handling, validation, and transaction support.
 */

import { Prisma } from '@prisma/client'
import { prisma } from './client'
import { handlePrismaError, withErrorHandling } from './error-handler'
import { validateInput, PaginationParams } from '../validation/schemas'
import { z } from 'zod'

/**
 * Base repository interface
 */
export interface IBaseRepository<T, CreateInput, UpdateInput, QueryInput> {
  create(data: CreateInput): Promise<T>
  findById(id: string): Promise<T | null>
  findMany(query?: QueryInput): Promise<T[]>
  findFirst(query?: QueryInput): Promise<T | null>
  update(id: string, data: UpdateInput): Promise<T>
  delete(id: string): Promise<T>
  count(query?: QueryInput): Promise<number>
  exists(id: string): Promise<boolean>
}

/**
 * Repository options
 */
export interface RepositoryOptions {
  enableSoftDelete?: boolean
  enableTimestamps?: boolean
  enableAuditLog?: boolean
}

/**
 * Query result with pagination
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Transaction context
 */
export interface TransactionContext {
  tx: Prisma.TransactionClient
}

/**
 * Abstract base repository implementation
 */
export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  QueryInput extends { limit?: number; offset?: number }
> implements IBaseRepository<T, CreateInput, UpdateInput, QueryInput> {
  protected abstract model: any
  protected abstract createSchema: z.ZodSchema<CreateInput>
  protected abstract updateSchema: z.ZodSchema<UpdateInput>
  protected abstract querySchema: z.ZodSchema<QueryInput>
  protected options: RepositoryOptions

  constructor(options: RepositoryOptions = {}) {
    this.options = {
      enableSoftDelete: false,
      enableTimestamps: true,
      enableAuditLog: false,
      ...options
    }
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput, context?: TransactionContext): Promise<T> {
    return withErrorHandling(async () => {
      const validatedData = validateInput(this.createSchema, data)
      const client = context?.tx || prisma

      const result = await client[this.model].create({
        data: this.prepareCreateData(validatedData)
      })

      if (this.options.enableAuditLog) {
        await this.logAuditEvent('CREATE', result.id, validatedData, context)
      }

      return this.transformResult(result)
    }, `Creating ${this.model}`)
  }

  /**
   * Find record by ID
   */
  async findById(id: string, context?: TransactionContext): Promise<T | null> {
    return withErrorHandling(async () => {
      const client = context?.tx || prisma

      const result = await client[this.model].findUnique({
        where: { id },
        ...this.getIncludeOptions()
      })

      return result ? this.transformResult(result) : null
    }, `Finding ${this.model} by ID`)
  }

  /**
   * Find multiple records
   */
  async findMany(query?: QueryInput, context?: TransactionContext): Promise<T[]> {
    return withErrorHandling(async () => {
      const client = context?.tx || prisma
      const validatedQuery = query ? validateInput(this.querySchema, query) : {} as QueryInput

      const where = this.buildWhereClause(validatedQuery)
      const orderBy = this.buildOrderByClause(validatedQuery)

      const results = await client[this.model].findMany({
        where,
        orderBy,
        take: validatedQuery.limit,
        skip: validatedQuery.offset,
        ...this.getIncludeOptions()
      })

      return results.map(result => this.transformResult(result))
    }, `Finding multiple ${this.model}s`)
  }

  /**
   * Find first record matching query
   */
  async findFirst(query?: QueryInput, context?: TransactionContext): Promise<T | null> {
    return withErrorHandling(async () => {
      const client = context?.tx || prisma
      const validatedQuery = query ? validateInput(this.querySchema, query) : {} as QueryInput

      const where = this.buildWhereClause(validatedQuery)
      const orderBy = this.buildOrderByClause(validatedQuery)

      const result = await client[this.model].findFirst({
        where,
        orderBy,
        ...this.getIncludeOptions()
      })

      return result ? this.transformResult(result) : null
    }, `Finding first ${this.model}`)
  }

  /**
   * Update record by ID
   */
  async update(id: string, data: UpdateInput, context?: TransactionContext): Promise<T> {
    return withErrorHandling(async () => {
      const validatedData = validateInput(this.updateSchema, data)
      const client = context?.tx || prisma

      // Check if record exists
      const existing = await this.findById(id, context)
      if (!existing) {
        throw new Error(`${this.model} with ID ${id} not found`)
      }

      const result = await client[this.model].update({
        where: { id },
        data: this.prepareUpdateData(validatedData),
        ...this.getIncludeOptions()
      })

      if (this.options.enableAuditLog) {
        await this.logAuditEvent('UPDATE', id, validatedData, context)
      }

      return this.transformResult(result)
    }, `Updating ${this.model}`)
  }

  /**
   * Delete record by ID
   */
  async delete(id: string, context?: TransactionContext): Promise<T> {
    return withErrorHandling(async () => {
      const client = context?.tx || prisma

      // Check if record exists
      const existing = await this.findById(id, context)
      if (!existing) {
        throw new Error(`${this.model} with ID ${id} not found`)
      }

      let result: T

      if (this.options.enableSoftDelete) {
        // Soft delete - mark as deleted
        result = await client[this.model].update({
          where: { id },
          data: { deletedAt: new Date() },
          ...this.getIncludeOptions()
        })
      } else {
        // Hard delete
        result = await client[this.model].delete({
          where: { id },
          ...this.getIncludeOptions()
        })
      }

      if (this.options.enableAuditLog) {
        await this.logAuditEvent('DELETE', id, {}, context)
      }

      return this.transformResult(result)
    }, `Deleting ${this.model}`)
  }

  /**
   * Count records matching query
   */
  async count(query?: QueryInput, context?: TransactionContext): Promise<number> {
    return withErrorHandling(async () => {
      const client = context?.tx || prisma
      const validatedQuery = query ? validateInput(this.querySchema, query) : {} as QueryInput

      const where = this.buildWhereClause(validatedQuery)

      return await client[this.model].count({ where })
    }, `Counting ${this.model}s`)
  }

  /**
   * Check if record exists
   */
  async exists(id: string, context?: TransactionContext): Promise<boolean> {
    return withErrorHandling(async () => {
      const client = context?.tx || prisma

      const result = await client[this.model].findUnique({
        where: { id },
        select: { id: true }
      })

      return result !== null
    }, `Checking if ${this.model} exists`)
  }

  /**
   * Find with pagination
   */
  async findWithPagination(query?: QueryInput, context?: TransactionContext): Promise<PaginatedResult<T>> {
    return withErrorHandling(async () => {
      const validatedQuery = query ? validateInput(this.querySchema, query) : {} as QueryInput
      const limit = validatedQuery.limit || 20
      const offset = validatedQuery.offset || 0
      const page = Math.floor(offset / limit) + 1

      const [data, total] = await Promise.all([
        this.findMany(validatedQuery, context),
        this.count(validatedQuery, context)
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data,
        total,
        page,
        pageSize: limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }, `Finding paginated ${this.model}s`)
  }

  /**
   * Bulk create records
   */
  async createMany(data: CreateInput[], context?: TransactionContext): Promise<{ count: number }> {
    return withErrorHandling(async () => {
      const validatedData = data.map(item => validateInput(this.createSchema, item))
      const client = context?.tx || prisma

      const result = await client[this.model].createMany({
        data: validatedData.map(item => this.prepareCreateData(item))
      })

      if (this.options.enableAuditLog) {
        // Log bulk creation
        await this.logAuditEvent('BULK_CREATE', 'bulk', { count: result.count }, context)
      }

      return result
    }, `Bulk creating ${this.model}s`)
  }

  /**
   * Bulk update records
   */
  async updateMany(where: any, data: Partial<UpdateInput>, context?: TransactionContext): Promise<{ count: number }> {
    return withErrorHandling(async () => {
      const client = context?.tx || prisma

      const result = await client[this.model].updateMany({
        where,
        data: this.prepareUpdateData(data)
      })

      if (this.options.enableAuditLog) {
        await this.logAuditEvent('BULK_UPDATE', 'bulk', { count: result.count, where, data }, context)
      }

      return result
    }, `Bulk updating ${this.model}s`)
  }

  /**
   * Execute in transaction
   */
  async transaction<R>(
    operations: (context: TransactionContext) => Promise<R>
  ): Promise<R> {
    return withErrorHandling(async () => {
      return await prisma.$transaction(async (tx) => {
        return await operations({ tx })
      })
    }, `Executing ${this.model} transaction`)
  }

  // Abstract methods to be implemented by subclasses
  protected abstract buildWhereClause(query: QueryInput): any
  protected abstract buildOrderByClause(query: QueryInput): any

  // Optional methods that can be overridden
  protected getIncludeOptions(): any {
    return {}
  }

  protected prepareCreateData(data: CreateInput): any {
    return data
  }

  protected prepareUpdateData(data: Partial<UpdateInput>): any {
    return data
  }

  protected transformResult(result: any): T {
    return result as T
  }

  /**
   * Audit logging
   */
  protected async logAuditEvent(
    action: string,
    recordId: string,
    data: any,
    context?: TransactionContext
  ): Promise<void> {
    if (!this.options.enableAuditLog) return

    try {
      const client = context?.tx || prisma
      
      // This would typically log to an audit table
      // Implementation depends on your audit requirements
      console.log(`Audit: ${action} on ${this.model} ${recordId}`, { data })
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Don't throw - audit logging shouldn't break main operations
    }
  }
}

/**
 * Repository factory for creating repositories
 */
export class RepositoryFactory {
  private static repositories: Map<string, any> = new Map()

  static register<T extends BaseRepository<any, any, any, any>>(
    name: string,
    repository: new (...args: any[]) => T
  ): void {
    this.repositories.set(name, repository)
  }

  static create<T extends BaseRepository<any, any, any, any>>(
    name: string,
    ...args: any[]
  ): T {
    const Repository = this.repositories.get(name)
    if (!Repository) {
      throw new Error(`Repository ${name} not registered`)
    }
    return new Repository(...args)
  }

  static getRegistered(): string[] {
    return Array.from(this.repositories.keys())
  }
}

/**
 * Repository decorator for automatic registration
 */
export function Repository(name: string) {
  return function <T extends new (...args: any[]) => BaseRepository<any, any, any, any>>(
    constructor: T
  ) {
    RepositoryFactory.register(name, constructor)
    return constructor
  }
}