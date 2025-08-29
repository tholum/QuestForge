/**
 * Modules Page Route
 * 
 * Next.js 15 App Router page for module management and configuration.
 * Allows users to enable/disable modules and configure their settings.
 */

import { ModulesPage } from '@/components/pages/ModulesPage';
import { requireAuth } from '@/lib/auth/server';

/**
 * Modules page with authentication protection
 */
export default async function Page() {
  // Ensure user is authenticated
  await requireAuth();
  
  return <ModulesPage />;
}

/**
 * Page metadata
 */
export const metadata = {
  title: 'Modules - Goal Assistant',
  description: 'Manage and configure your modules to customize your goal tracking experience.',
};