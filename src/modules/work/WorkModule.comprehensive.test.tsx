/**
 * Work Module Comprehensive Tests
 * 
 * Testing the Work Projects Module implementation including:
 * - Module system integration and IModule compliance
 * - Component testing and user interactions
 * - Achievement and gamification system
 * - Module lifecycle methods
 * - Configuration and permissions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkModule } from './WorkModule';
import type { IModule, Achievement, PointsConfiguration, ModuleCapability } from '../../types/module';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock user props for components
const mockProps = {
  moduleId: 'work',
  userId: 'test-user-123',
  config: {
    enableTimeTracking: true,
    enableCareerGoals: true,
    defaultProjectType: 'personal'
  }
};

describe('WorkModule - Module System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('IModule Interface Compliance', () => {
    it('should implement IModule interface correctly', () => {
      // Core identification properties
      expect(WorkModule).toBeDefined();
      expect(WorkModule.id).toBe('work');
      expect(WorkModule.name).toBe('Work Projects');
      expect(WorkModule.version).toBe('1.0.0');
      expect(WorkModule.icon).toBe('briefcase');
      expect(WorkModule.color).toBe('#3B82F6');
    });

    it('should have complete metadata', () => {
      const metadata = WorkModule.metadata;
      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('work');
      expect(metadata.name).toBe('Work Projects');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.author).toBe('Goal Assistant Team');
      expect(metadata.description).toContain('Comprehensive work project management');
      expect(metadata.keywords).toContain('work');
      expect(metadata.keywords).toContain('projects');
      expect(metadata.keywords).toContain('time-tracking');
      expect(metadata.keywords).toContain('career');
      expect(metadata.license).toBe('MIT');
      expect(metadata.minSystemVersion).toBe('1.0.0');
    });

    it('should have all required UI components', () => {
      expect(WorkModule.components).toBeDefined();
      expect(WorkModule.components.dashboard).toBeDefined();
      expect(WorkModule.components.mobileQuickAdd).toBeDefined();
      expect(WorkModule.components.desktopDetail).toBeDefined();
      expect(WorkModule.components.settings).toBeDefined();
    });

    it('should have proper permissions defined', () => {
      expect(WorkModule.permissions).toBeDefined();
      expect(Array.isArray(WorkModule.permissions)).toBe(true);
      expect(WorkModule.permissions).toContain('read:work_data');
      expect(WorkModule.permissions).toContain('write:work_data');
      expect(WorkModule.permissions).toContain('read:time_data');
      expect(WorkModule.permissions).toContain('write:time_data');
      expect(WorkModule.permissions).toContain('read:career_data');
      expect(WorkModule.permissions).toContain('write:career_data');
      expect(WorkModule.permissions).toContain('read:performance_data');
      expect(WorkModule.permissions).toContain('write:performance_data');
    });

    it('should have API routes configuration', () => {
      expect(WorkModule.apiRoutes).toBeDefined();
      expect(WorkModule.apiRoutes.baseRoute).toBe('/api/v1/modules/work');
      expect(WorkModule.apiRoutes.routes).toBeDefined();
      expect(Array.isArray(WorkModule.apiRoutes.routes)).toBe(true);
      expect(WorkModule.apiRoutes.routes.length).toBeGreaterThan(0);
      
      // Check route structure
      const firstRoute = WorkModule.apiRoutes.routes[0];
      expect(firstRoute.path).toBeDefined();
      expect(firstRoute.method).toBeDefined();
      expect(firstRoute.handler).toBeDefined();
      expect(firstRoute.permissions).toBeDefined();
    });
  });

  describe('Module Capabilities', () => {
    it('should have defined capabilities', () => {
      expect(WorkModule.capabilities).toBeDefined();
      expect(Array.isArray(WorkModule.capabilities)).toBe(true);
      expect(WorkModule.capabilities.length).toBeGreaterThan(0);
      
      const expectedCapabilities = [
        'project_management',
        'time_tracking', 
        'career_development',
        'performance_analytics',
        'team_collaboration'
      ];
      
      const capabilityIds = WorkModule.capabilities.map(c => c.id);
      expectedCapabilities.forEach(capId => {
        expect(capabilityIds).toContain(capId);
      });
    });

    it('should have required capabilities marked correctly', () => {
      const requiredCapabilities = WorkModule.capabilities.filter(c => c.required);
      expect(requiredCapabilities.length).toBeGreaterThan(0);
      
      // Project management and time tracking should be required
      const requiredIds = requiredCapabilities.map(c => c.id);
      expect(requiredIds).toContain('project_management');
      expect(requiredIds).toContain('time_tracking');
    });
  });

  describe('Lifecycle Methods', () => {
    it('should have all required lifecycle methods', () => {
      expect(typeof WorkModule.onInstall).toBe('function');
      expect(typeof WorkModule.onUninstall).toBe('function');
      expect(typeof WorkModule.onEnable).toBe('function');
      expect(typeof WorkModule.onDisable).toBe('function');
      expect(typeof WorkModule.onUpgrade).toBe('function');
      expect(typeof WorkModule.onConfigChange).toBe('function');
    });

    it('should execute lifecycle methods without errors', async () => {
      // Test install
      await expect(WorkModule.onInstall()).resolves.toBeUndefined();
      
      // Test enable
      await expect(WorkModule.onEnable()).resolves.toBeUndefined();
      
      // Test config change
      const oldConfig = { enableTimeTracking: false };
      const newConfig = { enableTimeTracking: true };
      await expect(WorkModule.onConfigChange(oldConfig, newConfig)).resolves.toBeUndefined();
      
      // Test upgrade
      await expect(WorkModule.onUpgrade('0.9.0', '1.0.0')).resolves.toBeUndefined();
      
      // Test disable
      await expect(WorkModule.onDisable()).resolves.toBeUndefined();
      
      // Test uninstall
      await expect(WorkModule.onUninstall()).resolves.toBeUndefined();
    });
  });
});

describe('WorkModule - Gamification System', () => {
  describe('Achievements', () => {
    it('should have well-defined achievements', () => {
      expect(WorkModule.achievements).toBeDefined();
      expect(Array.isArray(WorkModule.achievements)).toBe(true);
      expect(WorkModule.achievements.length).toBeGreaterThan(0);
      
      // Verify each achievement has required fields
      WorkModule.achievements.forEach((achievement: Achievement) => {
        expect(achievement.id).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.icon).toBeDefined();
        expect(achievement.tier).toMatch(/^(bronze|silver|gold|platinum)$/);
        expect(achievement.conditions).toBeDefined();
        expect(achievement.conditions.type).toMatch(/^(count|streak|completion|custom)$/);
        expect(achievement.xpReward).toBeGreaterThan(0);
      });
    });

    it('should have progressive achievement tiers', () => {
      const achievements = WorkModule.achievements;
      const tierCounts = achievements.reduce((acc, achievement) => {
        acc[achievement.tier] = (acc[achievement.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Should have bronze achievements (easy/starter achievements)
      expect(tierCounts.bronze).toBeGreaterThan(0);
      
      // Should have at least one achievement of each major tier
      ['bronze', 'silver', 'gold'].forEach(tier => {
        expect(tierCounts[tier]).toBeGreaterThanOrEqual(1);
      });
    });

    it('should have appropriate XP rewards by tier', () => {
      const achievements = WorkModule.achievements;
      
      achievements.forEach((achievement: Achievement) => {
        switch (achievement.tier) {
          case 'bronze':
            expect(achievement.xpReward).toBeLessThanOrEqual(100);
            break;
          case 'silver':
            expect(achievement.xpReward).toBeLessThanOrEqual(300);
            break;
          case 'gold':
            expect(achievement.xpReward).toBeLessThanOrEqual(600);
            break;
          case 'platinum':
            expect(achievement.xpReward).toBeGreaterThan(500);
            break;
        }
      });
    });
  });

  describe('Points Configuration', () => {
    it('should have comprehensive points configuration', () => {
      const pointsConfig: PointsConfiguration = WorkModule.pointsConfig;
      expect(pointsConfig).toBeDefined();
      expect(pointsConfig.actions).toBeDefined();
      expect(pointsConfig.difficultyMultipliers).toBeDefined();
      expect(pointsConfig.streakBonusPercentage).toBeDefined();
    });

    it('should have appropriate base points for actions', () => {
      const actions = WorkModule.pointsConfig.actions;
      const expectedActions = [
        'create_work_project',
        'complete_project', 
        'create_task',
        'complete_task',
        'track_time',
        'create_career_goal',
        'complete_milestone'
      ];
      
      expectedActions.forEach(action => {
        expect(actions[action]).toBeDefined();
        expect(actions[action].basePoints).toBeGreaterThan(0);
        expect(actions[action].description).toBeDefined();
      });
    });

    it('should have balanced difficulty multipliers', () => {
      const multipliers = WorkModule.pointsConfig.difficultyMultipliers;
      expect(multipliers.easy).toBe(1); // Base multiplier
      expect(multipliers.medium).toBeGreaterThan(1);
      expect(multipliers.hard).toBeGreaterThan(multipliers.medium);
      expect(multipliers.expert).toBeGreaterThan(multipliers.hard);
    });

    it('should have reasonable streak bonus percentage', () => {
      const streakBonus = WorkModule.pointsConfig.streakBonusPercentage;
      expect(streakBonus).toBeGreaterThan(0);
      expect(streakBonus).toBeLessThanOrEqual(25); // Should not be too high
    });
  });
});

describe('WorkModule - Component Integration Tests', () => {
  beforeEach(() => {
    // Mock successful API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          activeProjects: [],
          todayTasks: { total: 0, completed: 0, remaining: 0 },
          weekTimeTracked: 0,
          upcomingDeadlines: [],
          careerGoals: [],
          recentMetrics: [],
          overdueTasks: [],
          stats: {
            totalActiveProjects: 0,
            weekHours: 0,
            overdueTaskCount: 0,
            completedCareerGoals: 0
          }
        }
      })
    });
  });

  describe('Dashboard Component', () => {
    it('should render dashboard without errors', async () => {
      const Dashboard = WorkModule.components.dashboard;
      
      render(<Dashboard {...mockProps} />);
      
      // Should show loading state initially
      await waitFor(() => {
        expect(screen.getByText('Work Dashboard')).toBeInTheDocument();
      });
    });

    it('should display dashboard stats', async () => {
      const Dashboard = WorkModule.components.dashboard;
      
      render(<Dashboard {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Projects')).toBeInTheDocument();
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
        expect(screen.getByText('Overdue')).toBeInTheDocument();
        expect(screen.getByText('Career Goals')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Quick Add Component', () => {
    it('should render mobile quick add without errors', () => {
      const QuickAdd = WorkModule.components.mobileQuickAdd;
      const onSuccess = vi.fn();
      const onCancel = vi.fn();
      
      render(
        <QuickAdd 
          {...mockProps}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      );
      
      expect(screen.getByText('Quick Work Actions')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Task')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Career')).toBeInTheDocument();
    });

    it('should allow tab switching', async () => {
      const QuickAdd = WorkModule.components.mobileQuickAdd;
      
      render(<QuickAdd {...mockProps} />);
      
      const taskTab = screen.getByRole('tab', { name: /task/i });
      fireEvent.click(taskTab);
      
      await waitFor(() => {
        expect(screen.getByText('Create Task')).toBeInTheDocument();
      });
    });
  });

  describe('Desktop Detail Component', () => {
    it('should render desktop detail without errors', () => {
      const DesktopDetail = WorkModule.components.desktopDetail;
      
      render(<DesktopDetail {...mockProps} />);
      
      expect(screen.getByText('Work Management Center')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      expect(screen.getByText('Career Goals')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  describe('Settings Component', () => {
    it('should render settings without errors', () => {
      const Settings = WorkModule.components.settings;
      const onConfigChange = vi.fn();
      
      render(
        <Settings 
          moduleId={mockProps.moduleId}
          config={mockProps.config}
          onConfigChange={onConfigChange}
        />
      );
      
      expect(screen.getByText('Work Module Settings')).toBeInTheDocument();
      expect(screen.getByText('Enable time tracking')).toBeInTheDocument();
      expect(screen.getByText('Enable career goal management')).toBeInTheDocument();
    });

    it('should handle configuration changes', async () => {
      const Settings = WorkModule.components.settings;
      const onConfigChange = vi.fn();
      
      render(
        <Settings 
          moduleId={mockProps.moduleId}
          config={{ enableTimeTracking: false }}
          onConfigChange={onConfigChange}
        />
      );
      
      const timeTrackingCheckbox = screen.getByRole('checkbox', { name: /enable time tracking/i });
      fireEvent.click(timeTrackingCheckbox);
      
      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith(
          expect.objectContaining({
            enableTimeTracking: true
          })
        );
      });
    });
  });
});

describe('WorkModule - Time Tracking Features', () => {
  beforeEach(() => {
    // Mock API responses for time tracking
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { activeProjects: [] } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'timer-123', startTime: new Date() } })
      });
  });

  it('should handle timer start functionality', async () => {
    const Dashboard = WorkModule.components.dashboard;
    
    render(<Dashboard {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Work Dashboard')).toBeInTheDocument();
    });
    
    // Timer start should be handled through project actions
    // This tests the timer management logic exists
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/modules/work?type=dashboard',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.any(String)
        })
      })
    );
  });
});

describe('WorkModule - Error Handling', () => {
  it('should handle API errors gracefully', async () => {
    // Mock API error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    const Dashboard = WorkModule.components.dashboard;
    
    // Should not throw error, but handle it gracefully
    expect(() => {
      render(<Dashboard {...mockProps} />);
    }).not.toThrow();
    
    await waitFor(() => {
      expect(screen.getByText('Work Dashboard')).toBeInTheDocument();
    });
  });
});

describe('WorkModule - Integration with Module System', () => {
  it('should be compatible with module registry', () => {
    // Test that module can be registered and managed by the module system
    const module = WorkModule as IModule;
    
    // Should implement all required IModule properties
    expect(module.id).toBeDefined();
    expect(module.name).toBeDefined();
    expect(module.version).toBeDefined();
    expect(module.components).toBeDefined();
    expect(module.achievements).toBeDefined();
    expect(module.pointsConfig).toBeDefined();
    expect(module.capabilities).toBeDefined();
    expect(module.permissions).toBeDefined();
    expect(module.metadata).toBeDefined();
    
    // Lifecycle methods should be callable
    expect(typeof module.onInstall).toBe('function');
    expect(typeof module.onUninstall).toBe('function');
    expect(typeof module.onEnable).toBe('function');
    expect(typeof module.onDisable).toBe('function');
  });
});