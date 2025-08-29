"use client"

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/date-utils';
import {
  Menu,
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Zap,
  Star,
  Award,
  ChevronDown,
  Target,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface AppHeaderProps {
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
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  isMobile?: boolean;
  currentPage?: string;
  className?: string;
}

/**
 * Responsive application header with user profile, notifications, and search
 * Features:
 * - Mobile: Back navigation, page title, user avatar
 * - Desktop: Menu toggle, search, notifications, user profile with gamification
 * - Adaptive content based on screen size
 * - Dark mode toggle
 * - Notification center with real-time updates
 * - User profile with XP and achievements
 */
export function AppHeader({
  user,
  notifications = [],
  onMenuClick,
  isSidebarOpen,
  isMobile,
  currentPage = 'dashboard',
  className
}: AppHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);
  const hasUnreadNotifications = unreadNotifications.length > 0;

  const getPageTitle = (page: string) => {
    const titles = {
      dashboard: 'Dashboard',
      goals: 'Goals',
      progress: 'Progress',
      analytics: 'Analytics',
      calendar: 'Calendar',
      modules: 'Modules',
      settings: 'Settings',
      profile: 'Profile'
    };
    return titles[page as keyof typeof titles] || 'Goal Assistant';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    // Mark notification as read
    console.log('Mark notification as read:', notificationId);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border",
        className
      )}
    >
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back Button / Menu */}
          <div className="flex items-center">
            {currentPage !== 'dashboard' ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Go back</span>
              </Button>
            ) : (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <h1 className="text-lg font-semibold">
              {getPageTitle(currentPage)}
            </h1>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {hasUnreadNotifications && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {unreadNotifications.length}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <MobileNotificationPanel 
                  notifications={notifications}
                  onNotificationClick={handleNotificationClick}
                />
              </PopoverContent>
            </Popover>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1 h-auto">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <MobileUserMenu user={user} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="hidden md:flex"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>

            {/* Search Bar */}
            <div className="relative">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search goals, modules, achievements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={cn(
                    "pl-10 w-64 transition-all duration-200",
                    isSearchFocused && "w-80"
                  )}
                />
              </form>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Gamification Status */}
            {user && (
              <div className="hidden lg:flex items-center space-x-3 px-3 py-2 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Level {user.level || 1}</span>
                </div>
                <div className="w-24">
                  <Progress value={65} className="h-2" />
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3" />
                  <span>{user.xp || 0} XP</span>
                </div>
              </div>
            )}

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {hasUnreadNotifications && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {unreadNotifications.length}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <DesktopNotificationPanel 
                  notifications={notifications}
                  onNotificationClick={handleNotificationClick}
                />
              </PopoverContent>
            </Popover>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden xl:block text-left">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DesktopUserMenu user={user} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </header>
  );
}

// Mobile Notification Panel Component
function MobileNotificationPanel({ 
  notifications, 
  onNotificationClick 
}: { 
  notifications: AppHeaderProps['notifications'];
  onNotificationClick: (id: string) => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Notifications</h3>
        <Button variant="ghost" size="sm">
          Mark all read
        </Button>
      </div>
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {notifications?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notifications
            </p>
          ) : (
            notifications?.map((notification) => (
              <div
                key={notification.id}
                onClick={() => onNotificationClick(notification.id)}
                className={cn(
                  "p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-primary/5 border-primary/20"
                )}
              >
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(notification.timestamp)}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Desktop Notification Panel Component
function DesktopNotificationPanel({ 
  notifications, 
  onNotificationClick 
}: { 
  notifications: AppHeaderProps['notifications'];
  onNotificationClick: (id: string) => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            Settings
          </Button>
          <Button variant="ghost" size="sm">
            Mark all read
          </Button>
        </div>
      </div>
      <ScrollArea className="h-80">
        <div className="space-y-3">
          {notifications?.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            notifications?.map((notification) => (
              <div
                key={notification.id}
                onClick={() => onNotificationClick(notification.id)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-primary/5 border-primary/20"
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    notification.type === 'error' && "bg-red-500",
                    notification.type === 'warning' && "bg-yellow-500",
                    notification.type === 'success' && "bg-green-500",
                    notification.type === 'info' && "bg-blue-500"
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="flex justify-end mt-4">
        <Link href="/notifications">
          <Button variant="outline" size="sm">
            View all notifications
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Mobile User Menu Component
function MobileUserMenu({ user }: { user: AppHeaderProps['user'] }) {
  return (
    <>
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" />
        <span>Profile</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Award className="mr-2 h-4 w-4" />
        <span>Achievements</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );
}

// Desktop User Menu Component
function DesktopUserMenu({ user }: { user: AppHeaderProps['user'] }) {
  return (
    <>
      <DropdownMenuLabel>
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {user?.email || 'user@example.com'}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      {/* Gamification Stats */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Level {user?.level || 1}</span>
          <span className="text-xs text-muted-foreground">{user?.xp || 0} XP</span>
        </div>
        <Progress value={65} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          153 XP to next level
        </p>
      </div>
      
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" />
        <span>Profile</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Award className="mr-2 h-4 w-4" />
        <span>Achievements</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <Moon className="mr-2 h-4 w-4" />
        <span>Dark mode</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );
}

export default AppHeader;