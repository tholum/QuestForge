"use client"

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowUp
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface MainContentProps {
  children: React.ReactNode;
  id?: string;
  currentPage?: string;
  currentModule?: string;
  isMobile?: boolean;
  className?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  pageTitle?: string;
  pageSubtitle?: string;
  pageActions?: React.ReactNode;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/**
 * Main content area with responsive layout and page management
 * Features:
 * - Responsive padding and spacing
 * - Breadcrumb navigation
 * - Page header with title, subtitle, and actions
 * - Loading states and error handling
 * - Offline detection and sync status
 * - Scroll-to-top functionality
 * - ADHD-friendly content organization
 */
export function MainContent({
  children,
  id,
  currentPage = 'dashboard',
  currentModule,
  isMobile,
  className,
  breadcrumbs,
  pageTitle,
  pageSubtitle,
  pageActions,
  isLoading,
  error,
  onRetry
}: MainContentProps) {
  const [isOnline, setIsOnline] = React.useState(true);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Online/offline detection
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Scroll to top functionality
  const handleScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    setShowScrollTop(scrollTop > 200);
  }, []);

  const scrollToTop = () => {
    scrollAreaRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Generate default breadcrumbs
  const defaultBreadcrumbs = React.useMemo(() => {
    const crumbs = [{ label: 'Dashboard', href: '/' }];
    
    if (currentModule) {
      crumbs.push({ 
        label: currentModule.charAt(0).toUpperCase() + currentModule.slice(1), 
        href: `/modules/${currentModule}` 
      });
    }
    
    if (currentPage && currentPage !== 'dashboard') {
      crumbs.push({ 
        label: currentPage.charAt(0).toUpperCase() + currentPage.slice(1) 
      });
    }
    
    return crumbs;
  }, [currentPage, currentModule]);

  const displayBreadcrumbs = breadcrumbs || defaultBreadcrumbs;
  const showBreadcrumbs = !isMobile && displayBreadcrumbs.length > 1;

  return (
    <main
      id={id}
      className={cn(
        "flex-1 flex flex-col overflow-hidden bg-background",
        className
      )}
      role="main"
      aria-label="Main content"
      tabIndex={-1}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="px-4 py-2 flex items-center justify-center">
            <WifiOff className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              You're offline. Changes will sync when connection is restored.
            </span>
          </div>
        </div>
      )}

      {/* Page Header */}
      {(showBreadcrumbs || pageTitle || pageActions) && (
        <div className={cn(
          "border-b border-border bg-background/95 backdrop-blur-sm",
          isMobile ? "px-4 py-3" : "px-6 py-4"
        )}>
          <div className="flex flex-col space-y-3">
            {/* Breadcrumbs */}
            {showBreadcrumbs && (
              <Breadcrumb>
                <BreadcrumbList>
                  {displayBreadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {crumb.href && index < displayBreadcrumbs.length - 1 ? (
                          <BreadcrumbLink href={crumb.href}>
                            {crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < displayBreadcrumbs.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}

            {/* Page Title and Actions */}
            {(pageTitle || pageActions) && (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {pageTitle && (
                    <h1 className={cn(
                      "font-semibold tracking-tight",
                      isMobile ? "text-xl" : "text-2xl"
                    )}>
                      {pageTitle}
                    </h1>
                  )}
                  {pageSubtitle && (
                    <p className="text-sm text-muted-foreground">
                      {pageSubtitle}
                    </p>
                  )}
                </div>
                {pageActions && (
                  <div className="flex items-center space-x-2">
                    {pageActions}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative">
        <ScrollArea 
          className="h-full"
          onScroll={handleScroll}
          ref={scrollAreaRef}
        >
          <div className={cn(
            "min-h-full",
            isMobile ? [
              "px-4 py-4",
              "pb-20" // Extra padding for mobile navigation
            ] : [
              "px-6 py-6"
            ]
          )}>
            {/* Error State */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Page Content */}
            {!isLoading && !error && (
              <div className={cn(
                "space-y-6",
                // ADHD-friendly spacing and organization
                isMobile && "space-y-4"
              )}>
                {children}
              </div>
            )}

            {/* Sync Status */}
            <div className="mt-8 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>Offline</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    Last synced: 2 min ago
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            size="icon"
            className={cn(
              "fixed z-30 shadow-lg",
              isMobile ? "bottom-24 right-4" : "bottom-8 right-8"
            )}
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </main>
  );
}

export default MainContent;