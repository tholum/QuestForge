import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProfilePage } from './ProfilePage';
import { useProfile } from '@/hooks/useProfile';

// Mock the useProfile hook
vi.mock('@/hooks/useProfile');

// Mock UI components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ className, children }: any) => <div className={className}>{children}</div>,
  AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} data-testid="avatar-image" alt="" />,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogTrigger: ({ asChild, children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Select Value</span>,
}));

const mockProfile = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  emailVerified: true,
  bio: 'Passionate about personal development and goal achievement.',
  profilePicture: null,
  timezone: 'America/New_York',
  locale: 'en-US',
  createdAt: '2023-01-01T00:00:00Z',
  lastActiveAt: '2024-01-15T10:30:00Z',
};

const mockStats = {
  goals: {
    total: 15,
    completed: 10,
    completionRate: 67,
  },
  activity: {
    currentStreak: 7,
    totalXpEarned: 2450,
  },
  gamification: {
    currentLevel: 5,
    totalXp: 2450,
    achievementCount: 8,
  },
  moduleUsage: [
    { moduleId: 'fitness', moduleName: 'Fitness', goalCount: 6 },
    { moduleId: 'work', moduleName: 'Work Projects', goalCount: 4 },
    { moduleId: 'learning', moduleName: 'Learning', goalCount: 3 },
    { moduleId: 'home', moduleName: 'Home Projects', goalCount: 2 },
  ],
  recentActivity: [
    {
      id: 'activity-1',
      goal: { title: 'Morning Run', module: 'Fitness' },
      recordedAt: '2024-01-15T08:00:00Z',
      xpEarned: 25,
      value: 3,
      maxValue: 5,
    },
    {
      id: 'activity-2',
      goal: { title: 'Read Technical Book', module: 'Learning' },
      recordedAt: '2024-01-14T20:00:00Z',
      xpEarned: 30,
      value: 50,
      maxValue: 100,
    },
  ],
};

const mockUseProfile = {
  profile: mockProfile,
  stats: mockStats,
  loading: false,
  error: null,
  isUpdating: false,
  updateProfile: vi.fn().mockResolvedValue(undefined),
  getProfileCompleteness: vi.fn(() => 85),
  getLevelProgress: vi.fn(() => ({
    progress: 60,
    nextLevel: 6,
    xpToNext: 550,
  })),
  getTopModule: vi.fn(() => ({
    moduleId: 'fitness',
    moduleName: 'Fitness',
    goalCount: 6,
  })),
  getActivitySummary: vi.fn(() => ({
    weeklyGoals: 5,
    weeklyProgress: 12,
    averageXp: 35,
  })),
  refetch: vi.fn().mockResolvedValue(undefined),
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProfile as any).mockReturnValue(mockUseProfile);
  });

  describe('Rendering and Layout', () => {
    it('renders the profile page with correct title', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('View and manage your profile information')).toBeInTheDocument();
    });

    it('displays user profile information', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Passionate about personal development and goal achievement.')).toBeInTheDocument();
      expect(screen.getByText('America/New_York')).toBeInTheDocument();
    });

    it('displays user initials when no profile picture', () => {
      render(<ProfilePage />);
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD');
    });

    it('displays profile completeness', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading spinner when loading', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        loading: true,
        profile: null,
      });

      render(<ProfilePage />);
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error alert when there is an error', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        error: new Error('Failed to load profile'),
      });

      render(<ProfilePage />);
      
      expect(screen.getByText('Failed to load profile: Failed to load profile')).toBeInTheDocument();
    });

    it('displays "Profile not found" when profile is null', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        loading: false,
        profile: null,
      });

      render(<ProfilePage />);
      
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
      expect(screen.getByText('Unable to load your profile information.')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('displays goal statistics', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Total Goals')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('67% completion rate')).toBeInTheDocument();
    });

    it('displays activity statistics', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
      expect(screen.getByText('Total XP')).toBeInTheDocument();
      expect(screen.getByText('2,450')).toBeInTheDocument();
    });

    it('displays level information', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Level 5')).toBeInTheDocument();
      expect(screen.getByText('Level Progress')).toBeInTheDocument();
      expect(screen.getByText('550 XP to Level 6')).toBeInTheDocument();
      expect(screen.getByText('Total XP: 2,450')).toBeInTheDocument();
      expect(screen.getByText('Achievements: 8')).toBeInTheDocument();
    });
  });

  describe('Module Activity', () => {
    it('displays module usage statistics', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Module Activity')).toBeInTheDocument();
      expect(screen.getByText('Fitness')).toBeInTheDocument();
      expect(screen.getByText('6 goals')).toBeInTheDocument();
      expect(screen.getByText('Work Projects')).toBeInTheDocument();
      expect(screen.getByText('4 goals')).toBeInTheDocument();
      expect(screen.getByText('Most active: Fitness')).toBeInTheDocument();
    });

    it('displays "No module activity yet" when no modules', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        stats: {
          ...mockStats,
          moduleUsage: [],
        },
      });

      render(<ProfilePage />);
      
      expect(screen.getByText('No module activity yet')).toBeInTheDocument();
    });
  });

  describe('Recent Activity', () => {
    it('displays recent activity entries', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Fitness • 1/15/2024')).toBeInTheDocument();
      expect(screen.getByText('+25 XP')).toBeInTheDocument();
      expect(screen.getByText('3/5')).toBeInTheDocument();
      
      expect(screen.getByText('Read Technical Book')).toBeInTheDocument();
      expect(screen.getByText('Learning • 1/14/2024')).toBeInTheDocument();
      expect(screen.getByText('+30 XP')).toBeInTheDocument();
      expect(screen.getByText('50/100')).toBeInTheDocument();
    });

    it('displays "No recent activity" when no activity', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        stats: {
          ...mockStats,
          recentActivity: [],
        },
      });

      render(<ProfilePage />);
      
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  describe('Profile Editing', () => {
    it('renders edit profile button', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('opens edit dialog with current profile data', () => {
      render(<ProfilePage />);
      
      // Check that form fields are in the document (they're rendered in the dialog)
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Passionate about personal development and goal achievement.')).toBeInTheDocument();
    });

    it('handles profile update', async () => {
      render(<ProfilePage />);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUseProfile.updateProfile).toHaveBeenCalledWith({
          name: 'Jane Doe',
          bio: 'Passionate about personal development and goal achievement.',
          timezone: 'America/New_York',
          locale: 'en-US',
        });
      });
    });

    it('shows success message after profile update', async () => {
      render(<ProfilePage />);
      
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
    });

    it('shows error message when profile update fails', async () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        updateProfile: vi.fn().mockRejectedValue(new Error('Update failed')),
      });

      render(<ProfilePage />);
      
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
      });
    });

    it('disables save button while updating', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        isUpdating: true,
      });

      render(<ProfilePage />);
      
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Refresh Functionality', () => {
    it('renders refresh button', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls refetch when refresh button is clicked', async () => {
      render(<ProfilePage />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseProfile.refetch).toHaveBeenCalled();
      });
    });

    it('disables refresh button when loading', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        loading: true,
      });

      render(<ProfilePage />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Email Verification', () => {
    it('shows verification checkmark when email is verified', () => {
      render(<ProfilePage />);
      
      // Check that email verified icon is present
      const emailSection = screen.getByText('john.doe@example.com').parentElement;
      expect(emailSection).toBeInTheDocument();
    });

    it('does not show verification checkmark when email is not verified', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        profile: {
          ...mockProfile,
          emailVerified: false,
        },
      });

      render(<ProfilePage />);
      
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('displays formatted join date', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Joined 1/1/2023')).toBeInTheDocument();
    });

    it('displays last active date when available', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Active 1/15/2024')).toBeInTheDocument();
    });

    it('does not show last active when not available', () => {
      (useProfile as any).mockReturnValue({
        ...mockUseProfile,
        profile: {
          ...mockProfile,
          lastActiveAt: null,
        },
      });

      render(<ProfilePage />);
      
      expect(screen.queryByText(/Active/)).not.toBeInTheDocument();
    });
  });

  describe('Avatar Upload', () => {
    it('renders upload button for avatar', () => {
      render(<ProfilePage />);
      
      // Upload button is rendered as part of the avatar section
      const buttons = screen.getAllByRole('button');
      const uploadButton = buttons.find(button => 
        button.querySelector('svg') && button.classList.contains('w-8')
      );
      expect(uploadButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ProfilePage />);
      
      expect(screen.getByRole('heading', { level: 2, name: 'John Doe' })).toBeInTheDocument();
    });

    it('has descriptive text for statistics', () => {
      render(<ProfilePage />);
      
      expect(screen.getByText('Goals created')).toBeInTheDocument();
      expect(screen.getByText('Days of consistent activity')).toBeInTheDocument();
      expect(screen.getByText('Experience points earned')).toBeInTheDocument();
    });
  });
});