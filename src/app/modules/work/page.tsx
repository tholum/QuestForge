/**
 * Work Projects Module Page Route
 * 
 * Next.js 15 App Router page for the Work Projects module.
 */

import { requireAuth } from '@/lib/auth/server';
import { WorkModule } from '@/modules/work/WorkModule';
import { MainContent } from '@/components/layout/MainContent';

/**
 * Work Projects module page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  // Render the module's desktop detail view
  const DesktopDetail = WorkModule.ui.DesktopDetail;
  
  return (
    <MainContent
      currentPage="modules"
      pageTitle="Work Projects Module"
      pageSubtitle="Manage your work projects, time tracking, and career development"
    >
      <DesktopDetail />
    </MainContent>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Work Projects Module - Goal Assistant',
  description: 'Track your work projects, time, tasks, and career development goals.',
};