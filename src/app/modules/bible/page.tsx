/**
 * Bible Study Module Page Route
 * 
 * Next.js 15 App Router page for the Bible Study module.
 */

import { BibleDesktopDetailComponent } from '@/modules/bible/BibleModule';
import { MainContent } from '@/components/layout/MainContent';

/**
 * Bible Study module page - authentication handled by AuthProvider
 */
export default function Page() {
  // Server-side auth removed - handled by client-side AuthProvider
  
  return (
    <MainContent
      currentPage="modules"
      pageTitle="Bible Study Module"
      pageSubtitle="Track your Bible reading, study sessions, and spiritual growth"
    >
      <BibleDesktopDetailComponent 
        moduleId="bible"
        userId="test-user"
        config={{}}
      />
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