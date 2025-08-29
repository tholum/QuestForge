import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSettings } from './useSettings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

const mockSettingsData = {
  success: true,
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
};

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Data Fetching', () => {
    it('fetches settings successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.settings).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.settings).toEqual(mockSettingsData.settings);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('handles fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.settings).toBeNull();
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          message: 'Internal server error',
        }),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.settings).toBeNull();
    });
  });

  describe('Setting Updates', () => {
    it('updates single setting successfully', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      // Update request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Setting updated successfully',
        }),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSetting('notification', 'emailNotifications', false, 'boolean');
      });

      expect(result.current.isUpdating).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'notification',
          key: 'emailNotifications',
          value: false,
          dataType: 'boolean',
        }),
      });
    });

    it('updates multiple settings successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Settings updated successfully',
          updatedCount: 2,
        }),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const settingsToUpdate = [
        { category: 'display', key: 'theme', value: 'dark', dataType: 'string' as const },
        { category: 'notification', key: 'emailNotifications', value: false, dataType: 'boolean' as const },
      ];

      await act(async () => {
        await result.current.updateMultipleSettings(settingsToUpdate);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: settingsToUpdate,
        }),
      });
    });

    it('handles update errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          message: 'Invalid setting value',
        }),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateSetting('notification', 'emailNotifications', 'invalid', 'boolean');
        })
      ).rejects.toThrow();
    });

    it('shows loading state during updates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      mockFetch.mockImplementationOnce(() => updatePromise.then(() => ({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateSetting('notification', 'emailNotifications', false);
      });

      expect(result.current.isUpdating).toBe(true);

      act(() => {
        resolveUpdate!(null);
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });

  describe('Settings Getters', () => {
    it('returns notification settings with defaults', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const notificationSettings = result.current.getNotificationSettings();
      expect(notificationSettings).toEqual({
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: true,
        achievementAlerts: true,
        goalReminders: false,
      });
    });

    it('returns privacy settings with defaults', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const privacySettings = result.current.getPrivacySettings();
      expect(privacySettings).toEqual({
        profileVisibility: 'private',
        analyticsSharing: false,
        dataExport: true,
      });
    });

    it('returns display settings with defaults', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const displaySettings = result.current.getDisplaySettings();
      expect(displaySettings).toEqual({
        theme: 'light',
        density: 'comfortable',
        animations: true,
        language: 'en-US',
        dateFormat: 'MM/dd/yyyy',
      });
    });

    it('returns account settings with defaults', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const accountSettings = result.current.getAccountSettings();
      expect(accountSettings).toEqual({
        twoFactorAuth: false,
        sessionTimeout: 60,
        loginHistory: true,
      });
    });

    it('returns defaults when settings are empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          settings: {},
        }),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const notificationSettings = result.current.getNotificationSettings();
      expect(notificationSettings.emailNotifications).toBe(true); // Default value
      expect(notificationSettings.pushNotifications).toBe(false); // Default value
    });
  });

  describe('Cache Management', () => {
    it('refetches settings data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('invalidates cache after updates', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSettingsData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockSettingsData,
            settings: {
              ...mockSettingsData.settings,
              notification: {
                ...mockSettingsData.settings.notification,
                emailNotifications: false,
              },
            },
          }),
        });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getNotificationSettings().emailNotifications).toBe(true);

      await act(async () => {
        await result.current.updateSetting('notification', 'emailNotifications', false);
      });

      // Should refetch after update
      await waitFor(() => {
        expect(result.current.getNotificationSettings().emailNotifications).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.settings).toBeNull();
    });

    it('handles authentication errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          message: 'Authentication required',
        }),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('retries failed requests', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: 10,
            gcTime: 0,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(QueryClientProvider, { client: queryClient }, children)
      );

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSettingsData),
        });

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
          expect(result.current.settings).toEqual(mockSettingsData.settings);
        },
        { timeout: 1000 }
      );

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Optimistic Updates', () => {
    it('provides optimistic updates for better UX', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock slow update
      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      mockFetch.mockImplementationOnce(() =>
        updatePromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        }))
      );

      act(() => {
        result.current.updateSetting('notification', 'emailNotifications', false);
      });

      // Should show optimistic update immediately
      expect(result.current.isUpdating).toBe(true);

      act(() => {
        resolveUpdate!(null);
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });

  describe('Type Safety', () => {
    it('enforces correct category types', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // TypeScript should enforce valid categories
      expect(() => {
        result.current.updateSetting('account', 'twoFactorAuth', true);
      }).not.toThrow();
    });

    it('enforces correct data types', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSettingsData),
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle different data types
      await act(async () => {
        await result.current.updateSetting('account', 'sessionTimeout', 120, 'number');
      });

      await act(async () => {
        await result.current.updateSetting('display', 'theme', 'dark', 'string');
      });

      await act(async () => {
        await result.current.updateSetting('notification', 'emailNotifications', false, 'boolean');
      });

      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 updates
    });
  });
});