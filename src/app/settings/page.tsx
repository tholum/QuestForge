/**
 * Settings Page Route
 * 
 * Next.js 15 App Router page for user settings management.
 * Provides comprehensive settings interface with authentication protection.
 */

import { SettingsPage } from '@/components/pages/SettingsPage';
import { requireAuth } from '@/lib/auth/server';

/**
 * Settings page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  return <SettingsPage />;
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Settings - Goal Assistant',
  description: 'Manage your account settings, notifications, privacy, and display preferences.',
};