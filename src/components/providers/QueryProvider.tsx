/**
 * QueryProvider Component
 * 
 * TanStack Query provider with optimized configuration for the Goal Assistant app.
 * Handles caching, background updates, error handling, and retry logic.
 */

'use client'

import React from 'react'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

/**
 * Create query client with optimized settings
 */
function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error('Query error:', error, 'Query key:', query.queryKey)
        
        // Handle authentication errors globally
        if (error instanceof Error && error.message.includes('Authentication')) {
          // Redirect to login or refresh token
          // This can be enhanced based on your auth strategy
          console.warn('Authentication error detected, user may need to re-login')
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        console.error('Mutation error:', error, 'Mutation key:', mutation.options.mutationKey)
      },
    }),
    defaultOptions: {
      queries: {
        // Stale time: How long data stays fresh (5 minutes)
        staleTime: 5 * 60 * 1000,
        
        // GC time: How long inactive data stays in cache (10 minutes)
        gcTime: 10 * 60 * 1000,
        
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on authentication errors
          if (error instanceof Error && error.message.includes('Authentication')) {
            return false
          }
          
          // Don't retry on client errors (4xx)
          if (error instanceof Error && error.message.includes('400')) {
            return false
          }
          
          // Retry up to 3 times for server errors
          return failureCount < 3
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus (but not too aggressively)
        refetchOnWindowFocus: 'always',
        
        // Refetch on reconnect
        refetchOnReconnect: 'always',
        
        // Don't refetch on mount if data is still fresh
        refetchOnMount: 'always',
      },
      mutations: {
        // Global mutation retry configuration
        retry: (failureCount, error) => {
          // Don't retry on authentication or client errors
          if (error instanceof Error && 
              (error.message.includes('Authentication') || 
               error.message.includes('400') ||
               error.message.includes('403') ||
               error.message.includes('404'))) {
            return false
          }
          
          // Retry up to 2 times for server errors
          return failureCount < 2
        },
        
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  })
}

// Create a single instance to avoid recreating on every render
let clientInstance: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!clientInstance) clientInstance = createQueryClient()
    return clientInstance
  }
}

/**
 * QueryProvider Props
 */
interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * QueryProvider Component
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Hook to access query client outside of components
 */
export function useQueryClientInstance() {
  return getQueryClient()
}

/**
 * Helper function to prefetch goals data
 */
export async function prefetchGoalsData(queryClient: QueryClient, options: any = {}) {
  await queryClient.prefetchQuery({
    queryKey: ['goals', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      if (options.page) params.set('page', options.page.toString())
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.moduleId) params.set('moduleId', options.moduleId)
      if (options.filter && options.filter !== 'all') params.set('filter', options.filter)

      const response = await fetch(`/api/v1/goals?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch goals')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Helper function to invalidate all goals data
 */
export function invalidateGoalsData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['goals'] })
  queryClient.invalidateQueries({ queryKey: ['goal'] })
}

/**
 * Helper function to clear all goals cache
 */
export function clearGoalsCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: ['goals'] })
  queryClient.removeQueries({ queryKey: ['goal'] })
}