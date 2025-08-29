/**
 * Achievements Page Route
 * 
 * Next.js 15 App Router page for viewing achievements and progress.
 * Displays unlocked achievements and progress towards new ones.
 */

import { AchievementsPage } from '@/components/pages/AchievementsPage';
import { requireAuth } from '@/lib/auth/server';

/**
 * Achievements page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  return <AchievementsPage />;
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Achievements - Goal Assistant',
  description: 'View your unlocked achievements and track progress towards new milestones.',
};