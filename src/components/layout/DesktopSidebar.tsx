"use client"

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Target,
  TrendingUp,
  Settings,
  Users,
  Calendar,
  BarChart3,
  Plus,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  BookOpen,
  Wrench,
  Heart,
  Briefcase,
  Award,
  Bell,
  HelpCircle,
  Zap,
  Star,
  Trophy
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface DesktopSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage?: string;
  currentModule?: string;
  className?: string;
}

// Module configuration
const moduleConfig = {
  fitness: { 
    icon: Dumbbell, 
    label: 'Fitness & Health', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    items: ['Workouts', 'Nutrition', 'Progress', 'Goals']
  },
  learning: { 
    icon: BookOpen, 
    label: 'Learning & Growth', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    items: ['Courses', 'Skills', 'Certifications', 'Reading']
  },
  home: { 
    icon: Wrench, 
    label: 'Home Projects', 
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    items: ['Tasks', 'Maintenance', 'Improvements', 'Budget']
  },
  bible: { 
    icon: Heart, 
    label: 'Bible Study', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    items: ['Reading Plan', 'Study Notes', 'Prayer', 'Reflection']
  },
  work: { 
    icon: Briefcase, 
    label: 'Work & Career', 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    items: ['Projects', 'Tasks', 'Goals', 'Skills']
  }
} as const;

// Main navigation items
const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/', badge: null },
  { id: 'goals', label: 'Goals', icon: Target, href: '/goals', badge: 5 },
  { id: 'progress', label: 'Progress', icon: TrendingUp, href: '/progress', badge: null },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics', badge: null },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar', badge: 2 }
];

// Bottom navigation items
const bottomNavItems = [
  { id: 'achievements', label: 'Achievements', icon: Award, href: '/achievements' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, href: '/help' }
];

/**
 * Desktop sidebar navigation with expandable modules
 * Features:
 * - Collapsible design with mini and full modes
 * - Module grouping with expandable sections
 * - Gamification elements (XP, level, achievements)
 * - Quick actions and create buttons
 * - Responsive tooltips for collapsed state
 * - Keyboard navigation support
 */
export function DesktopSidebar({ 
  isOpen,
  onToggle,
  currentPage = 'dashboard',
  currentModule,
  className 
}: DesktopSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
    new Set([currentModule].filter(Boolean))
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const isNavItemActive = (itemId: string, href: string) => {
    return currentPage === itemId || pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col bg-background border-r border-border",
          "transition-all duration-300 ease-in-out",
          isOpen ? "w-72" : "w-16",
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo and Brand */}
        <div className={cn(
          "flex items-center px-4 py-4 border-b border-border",
          !isOpen && "justify-center"
        )}>
          {isOpen ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">Goal Assistant</h1>
                <p className="text-xs text-muted-foreground">Life Management</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Gamification Status - Only show when expanded */}
        {isOpen && (
          <div className="px-4 py-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Level 12</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3" />
                <span>2,847 XP</span>
              </div>
            </div>
            <Progress value={65} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              153 XP to next level
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className={cn("px-2 py-3", !isOpen && "px-1")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className={cn(
                  "w-full justify-start",
                  !isOpen && "px-0 justify-center"
                )}
                onClick={() => router.push('/quick-add')}
              >
                <Plus className="w-4 h-4" />
                {isOpen && <span className="ml-2">Quick Add</span>}
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right">
                <p>Quick Add</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1">
          <nav className="px-2 py-2">
            {/* Core Navigation */}
            <div className="space-y-1 mb-6">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.id, item.href);

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                          "hover:bg-muted focus:bg-muted focus:outline-none",
                          isActive && "bg-primary/10 text-primary font-medium",
                          !isActive && "text-muted-foreground",
                          !isOpen && "justify-center"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {isOpen && (
                          <>
                            <span className="ml-3 flex-1">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-2">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {!isOpen && (
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>

            {/* Modules Section */}
            {isOpen && (
              <>
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Modules
                  </h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(moduleConfig).map(([moduleId, config]) => {
                    const Icon = config.icon;
                    const isExpanded = expandedModules.has(moduleId);
                    const isModuleActive = currentModule === moduleId;

                    return (
                      <Collapsible 
                        key={moduleId} 
                        open={isExpanded}
                        onOpenChange={() => toggleModule(moduleId)}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            className={cn(
                              "flex items-center w-full rounded-lg px-3 py-2 text-sm",
                              "hover:bg-muted transition-colors text-left",
                              "focus:outline-none focus:bg-muted",
                              isModuleActive && [
                                "bg-muted font-medium",
                                config.color
                              ]
                            )}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            <span className="flex-1">{config.label}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-7 mt-1 space-y-1">
                          {config.items.map((item) => (
                            <Link
                              key={item}
                              href={`/modules/${moduleId}/${item.toLowerCase().replace(/\s+/g, '-')}`}
                              className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
                            >
                              {item}
                            </Link>
                          ))}
                          <Link
                            href={`/modules/${moduleId}/settings`}
                            className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
                          >
                            Settings
                          </Link>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </>
            )}

            {/* Collapsed Modules */}
            {!isOpen && (
              <div className="space-y-1 mb-6">
                <div className="px-1">
                  <Separator className="mb-2" />
                </div>
                {Object.entries(moduleConfig).map(([moduleId, config]) => {
                  const Icon = config.icon;
                  const isModuleActive = currentModule === moduleId;

                  return (
                    <Tooltip key={moduleId}>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/modules/${moduleId}`}
                          className={cn(
                            "flex items-center justify-center rounded-lg px-3 py-2 text-sm transition-colors",
                            "hover:bg-muted focus:bg-muted focus:outline-none",
                            isModuleActive && [
                              "bg-muted font-medium",
                              config.color
                            ]
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{config.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className={cn("border-t border-border px-2 py-2", !isOpen && "px-1")}>
          <div className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item.id, item.href);

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                        "hover:bg-muted focus:bg-muted focus:outline-none",
                        isActive && "bg-primary/10 text-primary font-medium",
                        !isActive && "text-muted-foreground",
                        !isOpen && "justify-center"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {isOpen && <span className="ml-3">{item.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  {!isOpen && (
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>

          {/* Achievement Showcase - Only when expanded */}
          {isOpen && (
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Recent Achievement
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Fitness Enthusiast - Completed 7 day workout streak!
              </p>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default DesktopSidebar;