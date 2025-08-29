import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { useSettings } from '@/hooks/useSettings';

// Mock the useSettings hook
vi.mock('@/hooks/useSettings');

// Mock UI components that might not render properly in tests
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

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      data-testid="select"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Select Value</span>,
}));

const mockUseSettings = {
  settings: {
    account: {
      twoFactorAuth: false,
      sessionTimeout: 60,
      loginHistory: true,
    },
    notification: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      achievementAlerts: true,
      goalReminders: false,
    },
    privacy: {
      profileVisibility: 'private',
      analyticsSharing: false,
      dataExport: true,
    },
    display: {
      theme: 'light',
      density: 'comfortable',
      animations: true,
      language: 'en-US',
      dateFormat: 'MM/dd/yyyy',
    },
  },
  loading: false,
  error: null,
  isUpdating: false,
  updateSetting: vi.fn().mockResolvedValue(undefined),
  updateMultipleSettings: vi.fn().mockResolvedValue(undefined),
  getNotificationSettings: vi.fn(() => ({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    achievementAlerts: true,
    goalReminders: false,
  })),
  getPrivacySettings: vi.fn(() => ({
    profileVisibility: 'private',
    analyticsSharing: false,
    dataExport: true,
  })),
  getDisplaySettings: vi.fn(() => ({
    theme: 'light',
    density: 'comfortable',
    animations: true,
    language: 'en-US',
    dateFormat: 'MM/dd/yyyy',
  })),
  getAccountSettings: vi.fn(() => ({
    twoFactorAuth: false,
    sessionTimeout: 60,
    loginHistory: true,
  })),
  refetch: vi.fn().mockResolvedValue(undefined),
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSettings as any).mockReturnValue(mockUseSettings);
  });

  describe('Rendering and Layout', () => {
    it('renders the settings page with correct title', () => {
      render(<SettingsPage />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your account and app preferences')).toBeInTheDocument();
    });

    it('renders all tab options', () => {
      render(<SettingsPage />);
      
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Display')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      render(<SettingsPage />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading spinner when loading', () => {
      (useSettings as any).mockReturnValue({
        ...mockUseSettings,
        loading: true,
      });

      render(<SettingsPage />);
      
      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
    });

    it('disables refresh button when loading', () => {
      (useSettings as any).mockReturnValue({
        ...mockUseSettings,
        loading: true,
      });

      render(<SettingsPage />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error alert when there is an error', () => {
      (useSettings as any).mockReturnValue({
        ...mockUseSettings,
        error: new Error('Failed to load settings'),
      });

      render(<SettingsPage />);
      
      expect(screen.getByText('Failed to load settings: Failed to load settings')).toBeInTheDocument();
    });
  });

  describe('Account Settings Tab', () => {
    it('displays account settings by default', () => {
      render(<SettingsPage />);
      
      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByText('Session Timeout')).toBeInTheDocument();
      expect(screen.getByText('Login History')).toBeInTheDocument();
    });

    it('handles two-factor auth toggle', async () => {
      render(<SettingsPage />);
      
      const twoFactorSwitch = screen.getByTestId('switch-two-factor-auth');
      fireEvent.click(twoFactorSwitch);

      await waitFor(() => {
        expect(mockUseSettings.updateSetting).toHaveBeenCalledWith(
          'account', 'twoFactorAuth', true, 'boolean'
        );
      });
    });

    it('handles session timeout change', async () => {
      render(<SettingsPage />);
      
      const sessionTimeoutSelect = screen.getAllByTestId('select')[0];
      fireEvent.change(sessionTimeoutSelect, { target: { value: '240' } });

      await waitFor(() => {
        expect(mockUseSettings.updateSetting).toHaveBeenCalledWith(
          'account', 'sessionTimeout', 240, 'number'
        );
      });
    });

    it('handles login history toggle', async () => {
      render(<SettingsPage />);
      
      const loginHistorySwitch = screen.getByTestId('switch-login-history');
      fireEvent.click(loginHistorySwitch);

      await waitFor(() => {
        expect(mockUseSettings.updateSetting).toHaveBeenCalledWith(
          'account', 'loginHistory', false, 'boolean'
        );
      });
    });
  });

  describe('Notifications Tab', () => {
    beforeEach(() => {
      render(<SettingsPage />);
      const notificationsTab = screen.getByText('Notifications');
      fireEvent.click(notificationsTab);
    });

    it('displays notification settings', async () => {
      await waitFor(() => {
        expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
        expect(screen.getByText('Email Notifications')).toBeInTheDocument();
        expect(screen.getByText('Push Notifications')).toBeInTheDocument();
        expect(screen.getByText('Weekly Progress Digest')).toBeInTheDocument();
        expect(screen.getByText('Achievement Alerts')).toBeInTheDocument();
        expect(screen.getByText('Goal Reminders')).toBeInTheDocument();
      });
    });

    it('handles email notifications toggle', async () => {
      await waitFor(() => {
        const emailSwitch = screen.getByTestId('switch-email-notifications');
        fireEvent.click(emailSwitch);
      });

      expect(mockUseSettings.updateSetting).toHaveBeenCalledWith(
        'notification', 'emailNotifications', false, 'boolean'
      );
    });

    it('handles push notifications toggle', async () => {
      await waitFor(() => {
        const pushSwitch = screen.getByTestId('switch-push-notifications');
        fireEvent.click(pushSwitch);
      });

      expect(mockUseSettings.updateSetting).toHaveBeenCalledWith(
        'notification', 'pushNotifications', true, 'boolean'
      );
    });
  });

  describe('Privacy Tab', () => {
    beforeEach(() => {
      render(<SettingsPage />);
      const privacyTab = screen.getByText('Privacy');
      fireEvent.click(privacyTab);
    });

    it('displays privacy settings', async () => {
      await waitFor(() => {
        expect(screen.getByText('Privacy & Data')).toBeInTheDocument();
        expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
        expect(screen.getByText('Analytics Sharing')).toBeInTheDocument();
        expect(screen.getByText('Data Export')).toBeInTheDocument();
      });
    });

    it('handles profile visibility change', async () => {
      await waitFor(() => {
        const visibilitySelect = screen.getAllByTestId('select')[0];
        fireEvent.change(visibilitySelect, { target: { value: 'public' } });
      });

      expect(mockUseSettings.updateSetting).toHaveBeenCalledWith(
        'privacy', 'profileVisibility', 'public'
      );
    });
  });

  describe('Display Tab', () => {
    beforeEach(() => {
      render(<SettingsPage />);
      const displayTab = screen.getByText('Display');
      fireEvent.click(displayTab);
    });

    it('displays display settings', async () => {
      await waitFor(() => {
        expect(screen.getByText('Display & Interface')).toBeInTheDocument();
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByText('Display Density')).toBeInTheDocument();
        expect(screen.getByText('Animations')).toBeInTheDocument();
        expect(screen.getByText('Language')).toBeInTheDocument();
        expect(screen.getByText('Date Format')).toBeInTheDocument();
      });
    });

    it('handles theme change', async () => {
      await waitFor(() => {
        const themeSelect = screen.getAllByTestId('select')[0];
        fireEvent.change(themeSelect, { target: { value: 'dark' } });
      });

      expect(mockUseSettings.updateSetting).toHaveBeenCalledWith(
        'display', 'theme', 'dark'
      );
    });

    it('handles animations toggle', async () => {
      await waitFor(() => {
        const animationsSwitch = screen.getByTestId('switch-animations');
        fireEvent.click(animationsSwitch);
      });

      expect(mockUseSettings.updateSetting).toHaveBeenCalledWith(
        'display', 'animations', false, 'boolean'
      );
    });
  });

  describe('Save Messages', () => {
    it('displays success message after successful update', async () => {
      render(<SettingsPage />);
      
      const twoFactorSwitch = screen.getByTestId('switch-two-factor-auth');
      fireEvent.click(twoFactorSwitch);

      await waitFor(() => {
        expect(screen.getByText('Setting updated successfully')).toBeInTheDocument();
      });
    });

    it('displays error message after failed update', async () => {
      (useSettings as any).mockReturnValue({
        ...mockUseSettings,
        updateSetting: vi.fn().mockRejectedValue(new Error('Update failed')),
      });

      render(<SettingsPage />);
      
      const twoFactorSwitch = screen.getByTestId('switch-two-factor-auth');
      fireEvent.click(twoFactorSwitch);

      await waitFor(() => {
        expect(screen.getByText('Failed to update setting')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      render(<SettingsPage />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseSettings.refetch).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('handles window resize events', () => {
      const mockAddEventListener = vi.spyOn(window, 'addEventListener');
      const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<SettingsPage />);

      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form controls', () => {
      render(<SettingsPage />);
      
      expect(screen.getByLabelText('Two-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByLabelText('Session Timeout')).toBeInTheDocument();
      expect(screen.getByLabelText('Login History')).toBeInTheDocument();
    });

    it('has proper descriptions for settings', () => {
      render(<SettingsPage />);
      
      expect(screen.getByText('Add an extra layer of security to your account')).toBeInTheDocument();
      expect(screen.getByText('How long to keep you logged in when inactive (minutes)')).toBeInTheDocument();
      expect(screen.getByText('Keep track of your login sessions')).toBeInTheDocument();
    });
  });

  describe('Settings Updates', () => {
    it('disables controls while updating', () => {
      (useSettings as any).mockReturnValue({
        ...mockUseSettings,
        isUpdating: true,
      });

      render(<SettingsPage />);
      
      const twoFactorSwitch = screen.getByTestId('switch-two-factor-auth');
      expect(twoFactorSwitch).toBeDisabled();
    });
  });
});