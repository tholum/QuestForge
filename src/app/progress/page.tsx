/**
 * Progress Page Route
 * 
 * Next.js 15 App Router page for progress tracking and goal status.
 * Shows progress across all active goals with authentication protection.
 */

import { ProgressPage } from '@/components/pages/ProgressPage';
import { requireAuth } from '@/lib/auth/server';

/**
 * Progress page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  return <ProgressPage />;
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Progress - Goal Assistant',
  description: 'Track your progress across all active goals and see detailed completion metrics.',
};