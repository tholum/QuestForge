/**
 * Bible Study Module Page Route
 * 
 * Next.js 15 App Router page for the Bible Study module.
 */

import { requireAuth } from '@/lib/auth/server';
import { BibleModule } from '@/modules/bible/BibleModule';
import { MainContent } from '@/components/layout/MainContent';

/**
 * Bible Study module page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  // Render the module's desktop detail view
  const DesktopDetail = BibleModule.ui.DesktopDetail;
  
  return (
    <MainContent
      currentPage="modules"
      pageTitle="Bible Study Module"
      pageSubtitle="Track your Bible reading, study sessions, and spiritual growth"
    >
      <DesktopDetail />
    </MainContent>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Bible Study Module - Goal Assistant',
  description: 'Track your Bible reading plans, study sessions, prayer requests, and spiritual growth.',
};