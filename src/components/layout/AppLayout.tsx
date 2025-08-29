"use client"

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MobileNavigation } from './MobileNavigation';
import { DesktopSidebar } from './DesktopSidebar';
import { AppHeader } from './AppHeader';
import { MainContent } from './MainContent';
import { ModalProvider } from './ModalProvider';
import { SkipLinks } from '@/components/accessibility/SkipLinks';
import { useScreenReaderAnnouncement, useRouteFocusManagement } from '@/components/accessibility/FocusManagement';
import { KeyboardShortcuts } from '@/components/desktop/KeyboardShortcuts';

export interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  currentModule?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    level?: number;
    xp?: number;
  };
  notifications?: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
}

/**
 * Main application layout with responsive mobile-first design
 * - Mobile: Bottom navigation, full-width content
 * - Desktop: Sidebar navigation, header with user profile
 * - Tablet: Hybrid approach with collapsible sidebar
 */
export function AppLayout({ 
  children, 
  currentPage = 'dashboard',
  currentModule,
  user,
  notifications = []
}: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Accessibility features
  const { announcementElement } = useScreenReaderAnnouncement();
  useRouteFocusManagement();

  // Responsive detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ModalProvider>
      {/* Skip Links */}
      <SkipLinks />
      
      {/* Screen Reader Announcements */}
      {announcementElement}
      
      {/* Keyboard Shortcuts (Desktop) */}
      {!isMobile && <KeyboardShortcuts />}
      
      <div className="h-screen bg-background" role="application" aria-label="Goal Assistant">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-full">
          <DesktopSidebar
            id="main-navigation"
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            currentPage={currentPage}
            currentModule={currentModule}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <AppHeader
              user={user}
              notifications={notifications}
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />
            <MainContent 
              id="main-content"
              currentPage={currentPage} 
              currentModule={currentModule}
            >
              {children}
            </MainContent>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col h-full">
          <AppHeader
            user={user}
            notifications={notifications}
            isMobile={true}
            currentPage={currentPage}
          />
          <MainContent 
            id="main-content"
            currentPage={currentPage} 
            currentModule={currentModule}
            isMobile={true}
          >
            {children}
          </MainContent>
          <MobileNavigation 
            id="main-navigation"
            currentPage={currentPage}
            currentModule={currentModule}
          />
        </div>
      </div>
    </ModalProvider>
  );
}

export default AppLayout;