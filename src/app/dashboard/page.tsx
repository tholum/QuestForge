"use client"

import { Dashboard } from "@/components/pages/Dashboard"
import { useAuthContext } from "@/components/providers/AuthProvider"

export default function DashboardPage() {
  const { user } = useAuthContext()

  // The AuthProvider will handle redirects if user is not authenticated
  // So we can safely assume user exists here
  return <Dashboard />
}