/**
 * Fitness Module Page Route
 * 
 * Next.js 15 App Router page for the Fitness module.
 */

import { requireAuth } from '@/lib/auth/server';
import { FitnessModule } from '@/modules/fitness/FitnessModule';
import { MainContent } from '@/components/layout/MainContent';

/**
 * Fitness module page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  // Render the module's desktop detail view
  const DesktopDetail = FitnessModule.ui.DesktopDetail;
  
  return (
    <MainContent
      currentPage="modules"
      pageTitle="Fitness Module"
      pageSubtitle="Track your fitness goals and workouts"
    >
      <DesktopDetail />
    </MainContent>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Fitness Module - Goal Assistant',
  description: 'Track your fitness goals, workouts, and health metrics.',
};