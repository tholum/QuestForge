"use client"

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Target,
  TrendingUp,
  User,
  Settings,
  Plus,
  Dumbbell,
  BookOpen,
  Wrench,
  Heart,
  Briefcase,
  MoreHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export interface MobileNavigationProps {
  currentPage?: string;
  currentModule?: string;
  className?: string;
}

// Module configuration with icons and colors
const moduleConfig = {
  fitness: { icon: Dumbbell, label: 'Fitness', color: 'bg-orange-500' },
  learning: { icon: BookOpen, label: 'Learning', color: 'bg-blue-500' },
  home: { icon: Wrench, label: 'Home', color: 'bg-green-500' },
  bible: { icon: Heart, label: 'Bible', color: 'bg-purple-500' },
  work: { icon: Briefcase, label: 'Work', color: 'bg-indigo-500' }
} as const;

// Main navigation tabs
const mainTabs = [
  { 
    id: 'dashboard', 
    label: 'Home', 
    icon: Home, 
    href: '/',
    badge: null
  },
  { 
    id: 'goals', 
    label: 'Goals', 
    icon: Target, 
    href: '/goals',
    badge: null
  },
  { 
    id: 'quick-add', 
    label: '', 
    icon: Plus, 
    href: '/quick-add',
    badge: null,
    isAction: true
  },
  { 
    id: 'progress', 
    label: 'Progress', 
    icon: TrendingUp, 
    href: '/progress',
    badge: '3' // Example notification badge
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: User, 
    href: '/profile',
    badge: null
  }
];

/**
 * Mobile bottom navigation with module tabs and quick actions
 * Features:
 * - Fixed bottom positioning with safe area support
 * - Quick add button in center with special styling
 * - Module-specific navigation when in module context
 * - Haptic feedback for touch interactions
 * - Accessibility with proper ARIA labels
 */
export function MobileNavigation({ 
  currentPage = 'dashboard',
  currentModule,
  className 
}: MobileNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeQuickAdd, setActiveQuickAdd] = React.useState(false);

  // Show module tabs when in module context
  const isModuleContext = currentModule && Object.keys(moduleConfig).includes(currentModule);

  const handleNavigation = (href: string, isAction?: boolean) => {
    if (isAction) {
      setActiveQuickAdd(true);
      return;
    }
    
    // Add haptic feedback on supported devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    router.push(href);
  };

  const handleQuickAdd = () => {
    setActiveQuickAdd(false);
    // Open quick add modal or sheet
    // This would be handled by the modal context
  };

  return (
    <>
      {/* Main Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-background/95 backdrop-blur-sm border-t border-border",
          "pb-safe-area-inset-bottom", // Safe area support for iOS
          className
        )}
        role="tablist"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.id || pathname === tab.href;
            const isQuickAdd = tab.isAction;

            return (
              <button
                key={tab.id}
                onClick={() => handleNavigation(tab.href, isQuickAdd)}
                className={cn(
                  "relative flex flex-col items-center justify-center",
                  "min-w-0 flex-1 py-2 px-1",
                  "rounded-lg transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  isQuickAdd && [
                    "bg-primary text-primary-foreground shadow-lg",
                    "scale-110 -mt-2 mx-2 min-h-[56px] min-w-[56px]",
                    "rounded-full flex-initial"
                  ],
                  !isQuickAdd && isActive && [
                    "text-primary bg-primary/10"
                  ],
                  !isQuickAdd && !isActive && [
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  ]
                )}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label || 'Quick add'}
              >
                <div className="relative">
                  <Icon 
                    size={isQuickAdd ? 28 : 22} 
                    className={cn(
                      "transition-transform duration-200",
                      isActive && !isQuickAdd && "scale-110"
                    )}
                  />
                  {tab.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </div>
                {tab.label && !isQuickAdd && (
                  <span className={cn(
                    "text-xs font-medium mt-1 truncate max-w-[60px]",
                    "transition-colors duration-200"
                  )}>
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Module Context Navigation */}
      {isModuleContext && (
        <div
          className={cn(
            "fixed bottom-16 left-0 right-0 z-40",
            "bg-background/90 backdrop-blur-sm border-t border-border",
            "pb-2"
          )}
          role="navigation"
          aria-label="Module navigation"
        >
          <div className="flex items-center justify-center px-4 py-2">
            <div className="flex items-center space-x-4">
              {Object.entries(moduleConfig).map(([moduleId, config]) => {
                const Icon = config.icon;
                const isActive = currentModule === moduleId;

                return (
                  <Link
                    key={moduleId}
                    href={`/modules/${moduleId}`}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg",
                      "transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50",
                      isActive && [
                        "text-white shadow-lg",
                        config.color
                      ],
                      !isActive && [
                        "text-muted-foreground hover:text-foreground",
                        "hover:bg-muted/50"
                      ]
                    )}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">
                      {config.label}
                    </span>
                  </Link>
                );
              })}
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <MoreHorizontal size={18} />
                    <span className="sr-only">More modules</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[300px]">
                  <SheetHeader>
                    <SheetTitle>All Modules</SheetTitle>
                    <SheetDescription>
                      Access all available modules and settings
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <Link
                      href="/modules"
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Settings size={20} />
                      <span>Manage Modules</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Settings size={20} />
                      <span>Settings</span>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Sheet */}
      <Sheet open={activeQuickAdd} onOpenChange={setActiveQuickAdd}>
        <SheetContent side="bottom" className="h-[400px]">
          <SheetHeader>
            <SheetTitle>Quick Add</SheetTitle>
            <SheetDescription>
              Quickly add new items to any module
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {Object.entries(moduleConfig).map(([moduleId, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={moduleId}
                  variant="outline"
                  className="h-16 flex-col space-y-2"
                  onClick={() => {
                    handleQuickAdd();
                    router.push(`/modules/${moduleId}/quick-add`);
                  }}
                >
                  <Icon size={24} />
                  <span className="text-sm">{config.label}</span>
                </Button>
              );
            })}
            <Button
              variant="outline"
              className="h-16 flex-col space-y-2"
              onClick={() => {
                handleQuickAdd();
                router.push('/goals/new');
              }}
            >
              <Target size={24} />
              <span className="text-sm">New Goal</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default MobileNavigation;