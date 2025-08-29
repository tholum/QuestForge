/**
 * Calendar Page Route
 * 
 * Next.js 15 App Router page for calendar view and event management.
 * Shows goal deadlines, milestones, and custom events.
 */

import { CalendarPage } from '@/components/pages/CalendarPage';
import { requireAuth } from '@/lib/auth/server';

/**
 * Calendar page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  return <CalendarPage />;
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Calendar - Goal Assistant',
  description: 'View your calendar with goal deadlines, milestones, and important events.',
};