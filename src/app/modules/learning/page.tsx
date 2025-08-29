/**
 * Learning Module Page Route
 * 
 * Next.js 15 App Router page for the Learning module.
 */

import { requireAuth } from '@/lib/auth/server';
import { LearningModule } from '@/modules/learning/LearningModule';
import { MainContent } from '@/components/layout/MainContent';

/**
 * Learning module page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  // Render the module's desktop detail view
  const DesktopDetail = LearningModule.ui.DesktopDetail;
  
  return (
    <MainContent
      currentPage="modules"
      pageTitle="Learning Module"
      pageSubtitle="Track your learning goals and educational progress"
    >
      <DesktopDetail />
    </MainContent>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Learning Module - Goal Assistant',
  description: 'Track your learning goals, courses, and educational achievements.',
};