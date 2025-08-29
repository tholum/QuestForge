/**
 * Home Projects Module Page Route
 * 
 * Next.js 15 App Router page for the Home Projects module.
 */

import { requireAuth } from '@/lib/auth/server';
import { HomeProjectsModule } from '@/modules/home/HomeProjectsModule';
import { MainContent } from '@/components/layout/MainContent';

/**
 * Home Projects module page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  // Render the module's desktop detail view
  const DesktopDetail = HomeProjectsModule.ui.DesktopDetail;
  
  return (
    <MainContent
      currentPage="modules"
      pageTitle="Home Projects Module"
      pageSubtitle="Manage your home improvement and maintenance projects"
    >
      <DesktopDetail />
    </MainContent>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Home Projects Module - Goal Assistant',
  description: 'Track your home improvement projects, maintenance tasks, and household goals.',
};