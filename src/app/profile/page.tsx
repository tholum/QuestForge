/**
 * Profile Page Route
 * 
 * Next.js 15 App Router page for user profile display and management.
 * Shows user information, statistics, and activity with authentication protection.
 */

import { ProfilePage } from '@/components/pages/ProfilePage';
import { requireAuth } from '@/lib/auth/server';

/**
 * Profile page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  return <ProfilePage />;
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Profile - Goal Assistant',
  description: 'View and manage your profile, track your progress, and see your activity statistics.',
};