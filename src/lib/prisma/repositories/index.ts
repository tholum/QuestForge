/**
 * Repository Index
 * 
 * Exports all repositories and provides a factory for easy access.
 */

export { BaseRepository, RepositoryFactory, Repository } from '../base-repository'

// Repository exports
export { UserRepository } from './user-repository'
export { GoalRepository } from './goal-repository'
export { ProgressRepository } from './progress-repository'
export { ModuleRepository } from './module-repository'
export { AchievementRepository } from './achievement-repository'

// Bible Study repositories
export {
  BibleReadingPlanRepository,
  BibleReadingRepository,
  StudySessionRepository,
  PrayerRequestRepository,
  ScriptureBookmarkRepository,
  BibleDashboardRepository,
  bibleReadingPlanRepository,
  bibleReadingRepository,
  studySessionRepository,
  prayerRequestRepository,
  scriptureBookmarkRepository,
  bibleDashboardRepository
} from './bible-repository'

// Type exports
export type { 
  UserWithRelations,
} from './user-repository'
export type { 
  GoalWithRelations,
} from './goal-repository'
export type { 
  ProgressWithRelations,
  ProgressAnalytics
} from './progress-repository'
export type { 
  ModuleWithRelations,
} from './module-repository'
export type { 
  AchievementWithRelations,
  UserAchievementWithRelations
} from './achievement-repository'

/**
 * Repository service class for dependency injection
 */
export class RepositoryService {
  public readonly user: UserRepository
  public readonly goal: GoalRepository
  public readonly progress: ProgressRepository
  public readonly module: ModuleRepository
  public readonly achievement: AchievementRepository

  constructor() {
    this.user = new UserRepository()
    this.goal = new GoalRepository()
    this.progress = new ProgressRepository()
    this.module = new ModuleRepository()
    this.achievement = new AchievementRepository()
  }

  /**
   * Get all repositories
   */
  getAll() {
    return {
      user: this.user,
      goal: this.goal,
      progress: this.progress,
      module: this.module,
      achievement: this.achievement,
    }
  }

  /**
   * Get repository by name
   */
  get(name: string): any {
    return this.getAll()[name as keyof ReturnType<typeof this.getAll>]
  }
}

// Factory functions for creating repositories
export const createRepositoryService = () => new RepositoryService()
export const createUserRepository = () => new UserRepository()
export const createGoalRepository = () => new GoalRepository()
export const createProgressRepository = () => new ProgressRepository()
export const createModuleRepository = () => new ModuleRepository()
export const createAchievementRepository = () => new AchievementRepository()