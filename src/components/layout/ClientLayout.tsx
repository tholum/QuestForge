"use client"

import { usePathname } from 'next/navigation'
import { AppLayout } from "@/components/layout/AppLayout"
import { useAuthContext } from "@/components/providers/AuthProvider"

interface ClientLayoutProps {
  children: React.ReactNode
}

// Routes that should not use the AppLayout (auth pages)
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register', 
  '/auth/forgot-password',
  '/auth/reset-password'
]

/**
 * ClientLayout component that conditionally renders AppLayout
 * based on authentication state and current route
 */
export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuthContext()
  
  // Check if current route is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  
  // If user is not authenticated or on auth route, render children directly
  if (!user || isAuthRoute) {
    return <>{children}</>
  }

  // Mock notifications for now - in a real app, this would come from API
  const mockNotifications = [
    {
      id: "1",
      type: "success" as const,
      message: "Great job! You completed your fitness goal for today.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      read: false
    },
    {
      id: "2",
      type: "info" as const,
      message: "Your weekly home project review is ready.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: "3",
      type: "warning" as const,
      message: "Bible study streak at risk - don't forget today's reading!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      read: true
    }
  ]

  // Transform user data to match AppLayout expectations
  const appLayoutUser = {
    id: user.id,
    name: user.name || 'User',
    email: user.email,
    avatar: undefined, // TODO: Add avatar support
    level: user.currentLevel,
    xp: user.totalXp
  }

  // Determine current page and module from pathname
  const getCurrentPage = () => {
    if (pathname === '/' || pathname === '/dashboard') return 'dashboard'
    if (pathname.startsWith('/goals')) return 'goals' 
    if (pathname.startsWith('/modules')) return 'modules'
    if (pathname.startsWith('/achievements')) return 'achievements'
    if (pathname.startsWith('/profile')) return 'profile'
    return 'dashboard'
  }

  const getCurrentModule = () => {
    // Extract module from paths like /modules/fitness or /goals/fitness
    const moduleMatch = pathname.match(/\/(modules|goals)\/([^\/]+)/)
    return moduleMatch ? moduleMatch[2] : undefined
  }

  return (
    <AppLayout
      user={appLayoutUser}
      notifications={mockNotifications}
      currentPage={getCurrentPage()}
      currentModule={getCurrentModule()}
    >
      {children}
    </AppLayout>
  )
}