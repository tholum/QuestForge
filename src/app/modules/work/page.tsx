/**
 * Work Projects Module Page Route
 * 
 * Next.js 15 App Router page for the Work Projects module.
 */

import { WorkDesktopDetailComponent } from '@/modules/work/WorkModule';
import { MainContent } from '@/components/layout/MainContent';

/**
 * Work Projects module page - authentication handled by AuthProvider
 */
export default function Page() {
  // Server-side auth removed - handled by client-side AuthProvider
  
  return (
    <MainContent
      currentPage="modules"
      pageTitle="Work Projects Module"
      pageSubtitle="Manage your work projects, time tracking, and career development"
    >
      <WorkDesktopDetailComponent 
        moduleId="work"
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
  title: 'Work Projects Module - Goal Assistant',
  description: 'Track your work projects, time, tasks, and career development goals.',
};