import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ModulesPage } from './ModulesPage';
import { useModules } from '@/hooks/useModules';

// Mock the useModules hook
vi.mock('@/hooks/useModules');

// Mock UI components
vi.mock('@/components/ui/switch', () => ({
  Switch: ({ id, checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      data-testid={`switch-${id}`}
    />
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      <div onClick={() => onValueChange?.('available')} data-testid="tab-available">
        Available Tab
      </div>
      <div onClick={() => onValueChange?.('installed')} data-testid="tab-installed">
        Installed Tab
      </div>
      {children}
    </div>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <div data-testid={`tab-trigger-${value}`}>{children}</div>
  ),
}));

const mockInstalledModules = [
  {
    id: 'fitness',
    name: 'Fitness & Health',
    description: 'Track workouts, health metrics, and fitness goals',
    version: '1.2.0',
    status: 'active',
    installed: true,
    enabled: true,
    author: 'Goal Assistant Team',
    category: 'health',
    tags: ['fitness', 'health', 'tracking'],
    stats: {
      goals: 15,
      completedGoals: 12,
      totalXp: 850,
      usage: 85,
    },
    config: {
      trackWorkouts: true,
      syncWithWearables: false,
      reminderFrequency: 'daily',
    },
    lastUpdated: '2024-01-10T10:00:00Z',
  },
  {
    id: 'work',
    name: 'Work Projects',
    description: 'Manage professional tasks and project milestones',
    version: '1.1.0',
    status: 'active',
    installed: true,
    enabled: true,
    author: 'Goal Assistant Team',
    category: 'productivity',
    tags: ['work', 'projects', 'productivity'],
    stats: {
      goals: 8,
      completedGoals: 5,
      totalXp: 425,
      usage: 62,
    },
    config: {
      projectCategories: ['client', 'internal'],
      timeTracking: true,
      teamIntegration: false,
    },
    lastUpdated: '2024-01-08T14:30:00Z',
  },
];

const mockAvailableModules = [
  {
    id: 'learning',
    name: 'Learning & Education',
    description: 'Track courses, reading goals, and skill development',
    version: '1.0.0',
    status: 'available',
    installed: false,
    enabled: false,
    author: 'Goal Assistant Team',
    category: 'education',
    tags: ['learning', 'education', 'skills'],
    rating: 4.8,
    downloads: 1250,
    size: '2.5 MB',
  },
  {
    id: 'finance',
    name: 'Financial Goals',
    description: 'Manage budgets, savings goals, and financial tracking',
    version: '0.9.0',
    status: 'beta',
    installed: false,
    enabled: false,
    author: 'Community',
    category: 'finance',
    tags: ['finance', 'budgeting', 'savings'],
    rating: 4.2,
    downloads: 890,
    size: '3.1 MB',
  },
];

const mockStats = {
  totalModules: 4,
  installedModules: 2,
  activeModules: 2,
  availableUpdates: 0,
  storageUsed: 15.7,
  totalStorage: 100,
};

const mockUseModules = {
  installedModules: mockInstalledModules,
  availableModules: mockAvailableModules,
  allModules: [...mockInstalledModules, ...mockAvailableModules],
  stats: mockStats,
  loading: false,
  error: null,
  isInstalling: false,
  isUninstalling: false,
  isUpdating: false,
  installModule: vi.fn().mockResolvedValue(undefined),
  uninstallModule: vi.fn().mockResolvedValue(undefined),
  updateModule: vi.fn().mockResolvedValue(undefined),
  enableModule: vi.fn().mockResolvedValue(undefined),
  disableModule: vi.fn().mockResolvedValue(undefined),
  configureModule: vi.fn().mockResolvedValue(undefined),
  getModuleConfig: vi.fn((id: string) => 
    mockInstalledModules.find(m => m.id === id)?.config || {}
  ),
  getModuleStats: vi.fn((id: string) => 
    mockInstalledModules.find(m => m.id === id)?.stats || null
  ),
  getModulesByCategory: vi.fn((category: string) => 
    [...mockInstalledModules, ...mockAvailableModules].filter(m => 
      category === 'all' || m.category === category
    )
  ),
  searchModules: vi.fn((query: string) => 
    [...mockInstalledModules, ...mockAvailableModules].filter(m =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.description.toLowerCase().includes(query.toLowerCase())
    )
  ),
  refetch: vi.fn().mockResolvedValue(undefined),
};

describe('ModulesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useModules as any).mockReturnValue(mockUseModules);
  });

  describe('Rendering and Layout', () => {
    it('renders the modules page with correct title', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('Modules')).toBeInTheDocument();
      expect(screen.getByText('Manage and configure your modules')).toBeInTheDocument();
    });

    it('renders tabs for installed and available modules', () => {
      render(<ModulesPage />);
      
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-installed')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-available')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading spinner when loading', () => {
      (useModules as any).mockReturnValue({
        ...mockUseModules,
        loading: true,
      });

      render(<ModulesPage />);
      
      expect(screen.getByText('Loading modules...')).toBeInTheDocument();
    });

    it('shows installing state', () => {
      (useModules as any).mockReturnValue({
        ...mockUseModules,
        isInstalling: true,
      });

      render(<ModulesPage />);
      
      expect(screen.getByText('Installing...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error alert when there is an error', () => {
      (useModules as any).mockReturnValue({
        ...mockUseModules,
        error: new Error('Failed to load modules'),
      });

      render(<ModulesPage />);
      
      expect(screen.getByText('Failed to load modules: Failed to load modules')).toBeInTheDocument();
    });
  });

  describe('Module Statistics', () => {
    it('displays module statistics overview', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('Total Modules')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      
      expect(screen.getByText('Installed')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      expect(screen.getByText('Storage Used')).toBeInTheDocument();
      expect(screen.getByText('15.7 MB of 100 MB')).toBeInTheDocument();
    });
  });

  describe('Installed Modules Tab', () => {
    it('displays installed modules by default', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('Fitness & Health')).toBeInTheDocument();
      expect(screen.getByText('Track workouts, health metrics, and fitness goals')).toBeInTheDocument();
      expect(screen.getByText('Work Projects')).toBeInTheDocument();
      expect(screen.getByText('Manage professional tasks and project milestones')).toBeInTheDocument();
    });

    it('shows module versions and status', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('v1.2.0')).toBeInTheDocument();
      expect(screen.getByText('v1.1.0')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays module statistics', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('15 goals')).toBeInTheDocument();
      expect(screen.getByText('12 completed')).toBeInTheDocument();
      expect(screen.getByText('850 XP')).toBeInTheDocument();
      expect(screen.getByText('85% usage')).toBeInTheDocument();
    });

    it('shows enable/disable switches', () => {
      render(<ModulesPage />);
      
      expect(screen.getByTestId('switch-fitness')).toBeInTheDocument();
      expect(screen.getByTestId('switch-work')).toBeInTheDocument();
      expect(screen.getByTestId('switch-fitness')).toBeChecked();
      expect(screen.getByTestId('switch-work')).toBeChecked();
    });

    it('handles module enable/disable', async () => {
      render(<ModulesPage />);
      
      const fitnessSwitch = screen.getByTestId('switch-fitness');
      fireEvent.click(fitnessSwitch);

      await waitFor(() => {
        expect(mockUseModules.disableModule).toHaveBeenCalledWith('fitness');
      });
    });

    it('shows configure and uninstall buttons', () => {
      render(<ModulesPage />);
      
      expect(screen.getAllByText('Configure')).toHaveLength(2);
      expect(screen.getAllByText('Uninstall')).toHaveLength(2);
    });

    it('handles module configuration', async () => {
      render(<ModulesPage />);
      
      const configureButtons = screen.getAllByText('Configure');
      fireEvent.click(configureButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(screen.getByText('Configure Module')).toBeInTheDocument();
      });
    });

    it('handles module uninstallation', async () => {
      render(<ModulesPage />);
      
      const uninstallButtons = screen.getAllByText('Uninstall');
      fireEvent.click(uninstallButtons[0]);

      await waitFor(() => {
        expect(mockUseModules.uninstallModule).toHaveBeenCalledWith('fitness');
      });
    });
  });

  describe('Available Modules Tab', () => {
    beforeEach(() => {
      render(<ModulesPage />);
      fireEvent.click(screen.getByTestId('tab-available'));
    });

    it('switches to available modules tab', () => {
      expect(screen.getByTestId('tab-content-available')).toBeInTheDocument();
    });

    it('displays available modules', () => {
      expect(screen.getByText('Learning & Education')).toBeInTheDocument();
      expect(screen.getByText('Track courses, reading goals, and skill development')).toBeInTheDocument();
      expect(screen.getByText('Financial Goals')).toBeInTheDocument();
      expect(screen.getByText('Manage budgets, savings goals, and financial tracking')).toBeInTheDocument();
    });

    it('shows module ratings and downloads', () => {
      expect(screen.getByText('4.8 stars')).toBeInTheDocument();
      expect(screen.getByText('1,250 downloads')).toBeInTheDocument();
      expect(screen.getByText('4.2 stars')).toBeInTheDocument();
      expect(screen.getByText('890 downloads')).toBeInTheDocument();
    });

    it('displays module sizes', () => {
      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
      expect(screen.getByText('3.1 MB')).toBeInTheDocument();
    });

    it('shows install buttons', () => {
      expect(screen.getAllByText('Install')).toHaveLength(2);
    });

    it('handles module installation', async () => {
      const installButtons = screen.getAllByText('Install');
      fireEvent.click(installButtons[0]);

      await waitFor(() => {
        expect(mockUseModules.installModule).toHaveBeenCalledWith('learning');
      });
    });

    it('shows beta status for beta modules', () => {
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
  });

  describe('Module Search and Filtering', () => {
    it('allows searching modules', async () => {
      render(<ModulesPage />);
      
      const searchInput = screen.getByPlaceholderText('Search modules...');
      fireEvent.change(searchInput, { target: { value: 'fitness' } });

      await waitFor(() => {
        expect(mockUseModules.searchModules).toHaveBeenCalledWith('fitness');
      });
    });

    it('allows filtering by category', async () => {
      render(<ModulesPage />);
      
      const categoryFilter = screen.getByLabelText('Category');
      fireEvent.change(categoryFilter, { target: { value: 'health' } });

      await waitFor(() => {
        expect(mockUseModules.getModulesByCategory).toHaveBeenCalledWith('health');
      });
    });

    it('shows all categories in filter', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('Productivity')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
    });
  });

  describe('Module Configuration Dialog', () => {
    beforeEach(async () => {
      render(<ModulesPage />);
      const configureButtons = screen.getAllByText('Configure');
      fireEvent.click(configureButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
    });

    it('displays module configuration options', () => {
      expect(screen.getByText('Configure Module')).toBeInTheDocument();
      expect(screen.getByText('Fitness & Health Configuration')).toBeInTheDocument();
    });

    it('shows current configuration values', () => {
      expect(screen.getByDisplayValue('daily')).toBeInTheDocument();
    });

    it('handles configuration updates', async () => {
      const saveButton = screen.getByText('Save Configuration');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUseModules.configureModule).toHaveBeenCalledWith('fitness', expect.any(Object));
      });
    });

    it('allows canceling configuration changes', async () => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Module Updates', () => {
    it('shows update available indicator', () => {
      (useModules as any).mockReturnValue({
        ...mockUseModules,
        stats: {
          ...mockStats,
          availableUpdates: 1,
        },
        installedModules: [
          {
            ...mockInstalledModules[0],
            hasUpdate: true,
            latestVersion: '1.3.0',
          },
        ],
      });

      render(<ModulesPage />);
      
      expect(screen.getByText('Update Available')).toBeInTheDocument();
      expect(screen.getByText('v1.3.0 available')).toBeInTheDocument();
    });

    it('handles module updates', async () => {
      (useModules as any).mockReturnValue({
        ...mockUseModules,
        installedModules: [
          {
            ...mockInstalledModules[0],
            hasUpdate: true,
            latestVersion: '1.3.0',
          },
        ],
      });

      render(<ModulesPage />);
      
      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockUseModules.updateModule).toHaveBeenCalledWith('fitness');
      });
    });
  });

  describe('Empty States', () => {
    it('displays empty state for no installed modules', () => {
      (useModules as any).mockReturnValue({
        ...mockUseModules,
        installedModules: [],
      });

      render(<ModulesPage />);
      
      expect(screen.getByText('No modules installed')).toBeInTheDocument();
      expect(screen.getByText('Browse available modules to get started')).toBeInTheDocument();
    });

    it('displays empty state for no available modules', () => {
      (useModules as any).mockReturnValue({
        ...mockUseModules,
        availableModules: [],
      });

      render(<ModulesPage />);
      
      fireEvent.click(screen.getByTestId('tab-available'));
      
      expect(screen.getByText('No modules available')).toBeInTheDocument();
      expect(screen.getByText('All available modules are already installed')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      render(<ModulesPage />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseModules.refetch).toHaveBeenCalled();
      });
    });

    it('disables refresh button when loading', () => {
      (useModules as any).mockReturnValue({
        ...mockUseModules,
        loading: true,
      });

      render(<ModulesPage />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Module Tags', () => {
    it('displays module tags', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('fitness')).toBeInTheDocument();
      expect(screen.getByText('health')).toBeInTheDocument();
      expect(screen.getByText('tracking')).toBeInTheDocument();
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('projects')).toBeInTheDocument();
      expect(screen.getByText('productivity')).toBeInTheDocument();
    });
  });

  describe('Module Authors', () => {
    it('displays module authors', () => {
      render(<ModulesPage />);
      
      expect(screen.getAllByText('Goal Assistant Team')).toHaveLength(2);
      
      fireEvent.click(screen.getByTestId('tab-available'));
      expect(screen.getByText('Community')).toBeInTheDocument();
    });
  });

  describe('Storage Management', () => {
    it('displays storage usage', () => {
      render(<ModulesPage />);
      
      expect(screen.getByText('Storage Used')).toBeInTheDocument();
      expect(screen.getByText('15.7 MB of 100 MB')).toBeInTheDocument();
    });

    it('shows storage progress bar', () => {
      render(<ModulesPage />);
      
      const storageProgress = screen.getByTestId('storage-progress');
      expect(storageProgress).toHaveAttribute('data-value', '15.7');
    });
  });

  describe('Module Dependencies', () => {
    it('handles modules with dependencies', () => {
      // This would test dependency checking during installation
      render(<ModulesPage />);
      
      fireEvent.click(screen.getByTestId('tab-available'));
      
      // Should show dependency information if applicable
      expect(screen.getByTestId('tab-content-available')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ModulesPage />);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Modules' })).toBeInTheDocument();
    });

    it('has proper tab navigation', () => {
      render(<ModulesPage />);
      
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('has accessible form controls', () => {
      render(<ModulesPage />);
      
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search modules...')).toBeInTheDocument();
    });

    it('has accessible switches with labels', () => {
      render(<ModulesPage />);
      
      expect(screen.getByLabelText('Enable Fitness & Health')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable Work Projects')).toBeInTheDocument();
    });
  });
});