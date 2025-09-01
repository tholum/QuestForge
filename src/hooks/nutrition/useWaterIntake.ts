/**
 * Hook for water intake tracking
 * 
 * Provides functionality to log, update, and track daily water consumption.
 */

import { useState, useCallback, useEffect } from 'react'

export interface WaterIntakeEntry {
  id: string
  userId: string
  amountMl: number
  source?: string
  temperature?: 'cold' | 'room' | 'warm' | 'hot'
  notes?: string
  consumedAt: string
  createdAt: string
}

export interface WaterIntakeData {
  entries: WaterIntakeEntry[]
  totalMl: number
  totalOz: number
}

interface LogWaterParams {
  amountMl: number
  source?: string
  temperature?: 'cold' | 'room' | 'warm' | 'hot'
  notes?: string
}

interface UseWaterIntakeReturn {
  waterData: WaterIntakeData | null
  loading: boolean
  logging: boolean
  deleting: boolean
  error: string | null
  logWater: (params: LogWaterParams) => Promise<WaterIntakeEntry | null>
  deleteWaterEntry: (id: string) => Promise<boolean>
  refreshWaterData: () => Promise<void>
  quickAddWater: (amountMl: number) => Promise<WaterIntakeEntry | null>
}

export function useWaterIntake(date?: Date): UseWaterIntakeReturn {
  const [waterData, setWaterData] = useState<WaterIntakeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [logging, setLogging] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWaterData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const targetDate = date || new Date()
      const dateString = targetDate.toISOString().split('T')[0]
      
      const response = await fetch(
        `/api/v1/modules/fitness?type=water-intake&date=${dateString}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch water intake: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load water data')
      }
      
      setWaterData(result.data)
    } catch (err) {
      console.error('Error fetching water intake:', err)
      setError(err instanceof Error ? err.message : 'Failed to load water data')
    } finally {
      setLoading(false)
    }
  }, [date])

  const logWater = useCallback(async (params: LogWaterParams): Promise<WaterIntakeEntry | null> => {
    setLogging(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/modules/fitness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'water-intake',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to log water intake: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to log water intake')
      }

      // Refresh water data to get updated totals
      await fetchWaterData()

      return result.data
    } catch (err) {
      console.error('Error logging water intake:', err)
      setError(err instanceof Error ? err.message : 'Failed to log water intake')
      return null
    } finally {
      setLogging(false)
    }
  }, [fetchWaterData])

  const deleteWaterEntry = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/modules/fitness?type=water-intake&id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete water entry: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete water entry')
      }

      // Refresh water data to get updated totals
      await fetchWaterData()

      return true
    } catch (err) {
      console.error('Error deleting water entry:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete water entry')
      return false
    } finally {
      setDeleting(false)
    }
  }, [fetchWaterData])

  const quickAddWater = useCallback(async (amountMl: number): Promise<WaterIntakeEntry | null> => {
    return await logWater({ amountMl })
  }, [logWater])

  const refreshWaterData = useCallback(async () => {
    await fetchWaterData()
  }, [fetchWaterData])

  useEffect(() => {
    fetchWaterData()
  }, [fetchWaterData])

  return {
    waterData,
    loading,
    logging,
    deleting,
    error,
    logWater,
    deleteWaterEntry,
    refreshWaterData,
    quickAddWater
  }
}