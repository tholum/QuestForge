/**
 * Analytics Page Route
 * 
 * Next.js 15 App Router page for analytics and data visualization.
 * Displays charts, metrics, and insights about user progress.
 */

import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { requireAuth } from '@/lib/auth/server';

/**
 * Analytics page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  return <AnalyticsPage />;
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Analytics - Goal Assistant',
  description: 'View detailed analytics, charts, and insights about your goal progress and achievements.',
};