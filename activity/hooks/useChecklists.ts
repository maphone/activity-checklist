import { useState, useCallback, useRef, useEffect } from 'react'
import { checklistService } from '../services/checklistServices'
import {
  DailyChecklistRecord,
  ChecklistTemplate,
  ChecklistCategory,
  ChecklistResponse,
  ChecklistAnalytics,
  UpdateChecklistItemData,
  SubmitDailyRecordData,
  ProcessApprovalData,
  ChecklistFilters,
  UseChecklistOptions,
  UseChecklistReturn,
} from '../types/checklist-types'

// Cache implementation for checklist data
class ChecklistCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Global cache instance
const checklistCache = new ChecklistCache()

export const useChecklist = (options: UseChecklistOptions = {}): UseChecklistReturn => {
  const {
    initialDate = new Date().toISOString().split('T')[0],
    autoFetch = true,
    enableOptimisticUpdates = true,
  } = options

  // ===== STATE =====
  const [dailyRecord, setDailyRecord] = useState<DailyChecklistRecord | null>(null)
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [categories, setCategories] = useState<ChecklistCategory[]>([])
  const [responses, setResponses] = useState<ChecklistResponse[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<DailyChecklistRecord[]>([])
  const [analytics, setAnalytics] = useState<ChecklistAnalytics | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ===== REFS =====
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentDateRef = useRef(initialDate)

  // ===== UTILITY FUNCTIONS =====
  const clearError = useCallback(() => setError(null), [])

  const handleError = useCallback((error: any, operation: string) => {
    const message = error.message || `Failed to ${operation}`
    console.error(`❌ [useChecklist.${operation}] Error:`, error)
    setError(message)
    return message
  }, [])

  const createCacheKey = useCallback((operation: string, params?: any) => {
    const paramStr = params ? JSON.stringify(params) : ''
    return `checklist:${operation}:${paramStr}`
  }, [])

  // ===== CORE METHODS =====

  const loadDailyRecord = useCallback(
    async (date: string) => {
      const cacheKey = createCacheKey('dailyRecord', { date })
      const cached = checklistCache.get(cacheKey)

      if (cached && !enableOptimisticUpdates) {
        setDailyRecord(cached)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await checklistService.getDailyRecord(date)

        if (response.success && response.data) {
          setDailyRecord(response.data)
          checklistCache.set(cacheKey, response.data)
          currentDateRef.current = date
        } else {
          throw new Error(response.message || 'Failed to load daily record')
        }
      } catch (error: any) {
        handleError(error, 'loadDailyRecord')
        setDailyRecord(null)
      } finally {
        setIsLoading(false)
      }
    },
    [createCacheKey, enableOptimisticUpdates, handleError]
  )

  const loadTemplates = useCallback(
    async (filters?: ChecklistFilters) => {
      const cacheKey = createCacheKey('templates', filters)
      const cached = checklistCache.get(cacheKey)

      if (cached) {
        setTemplates(cached)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await checklistService.getTemplates(filters)

        if (response.success && response.data) {
          setTemplates(response.data)
          checklistCache.set(cacheKey, response.data)
        } else {
          throw new Error(response.message || 'Failed to load templates')
        }
      } catch (error: any) {
        handleError(error, 'loadTemplates')
        setTemplates([])
      } finally {
        setIsLoading(false)
      }
    },
    [createCacheKey, handleError]
  )

  const loadCategories = useCallback(async () => {
    const cacheKey = createCacheKey('categories')
    const cached = checklistCache.get(cacheKey)

    if (cached) {
      setCategories(cached)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await checklistService.getCategories()

      if (response.success && response.data) {
        setCategories(response.data)
        checklistCache.set(cacheKey, response.data, 10 * 60 * 1000) // Cache for 10 minutes
      } else {
        throw new Error(response.message || 'Failed to load categories')
      }
    } catch (error: any) {
      handleError(error, 'loadCategories')
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [createCacheKey, handleError])

  const updateChecklistItem = useCallback(
    async (checklistId: string, data: UpdateChecklistItemData) => {
      if (!dailyRecord) {
        throw new Error('No daily record loaded')
      }

      setIsSubmitting(true)
      setError(null)

      // Optimistic update
      if (enableOptimisticUpdates && dailyRecord.checklistItems) {
        const optimisticRecord = {
          ...dailyRecord,
          checklistItems: dailyRecord.checklistItems.map((item) =>
            item.CHECKLIST_ID === checklistId
              ? {
                  ...item,
                  IS_COMPLETED: data.is_completed,
                  NOTES: data.notes || item.NOTES,
                  COMPLETION_TIME: data.is_completed ? new Date().toISOString() : undefined,
                }
              : item
          ),
        }
        setDailyRecord(optimisticRecord)
      }

      try {
        const response = await checklistService.updateChecklistItem(
          dailyRecord.ID,
          checklistId,
          data
        )

        if (!response.success) {
          throw new Error(response.message || 'Failed to update checklist item')
        }

        // Clear cache and reload to ensure data consistency
        checklistCache.clear('dailyRecord')
        await loadDailyRecord(currentDateRef.current)
      } catch (error: any) {
        // Revert optimistic update on error
        if (enableOptimisticUpdates) {
          await loadDailyRecord(currentDateRef.current)
        }
        handleError(error, 'updateChecklistItem')
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [dailyRecord, enableOptimisticUpdates, handleError, loadDailyRecord]
  )

  const submitDailyRecord = useCallback(
    async (data: SubmitDailyRecordData) => {
      if (!dailyRecord) {
        throw new Error('No daily record to submit')
      }

      setIsSubmitting(true)
      setError(null)

      // Optimistic update
      if (enableOptimisticUpdates) {
        const optimisticRecord = {
          ...dailyRecord,
          STATUS: 'submitted' as const,
          SUBMITTED_AT: new Date().toISOString(),
          TOTAL_WORKING_HOURS: data.total_working_hours || dailyRecord.TOTAL_WORKING_HOURS,
          NOTES: data.notes || dailyRecord.NOTES,
        }
        setDailyRecord(optimisticRecord)
      }

      try {
        const response = await checklistService.submitDailyRecord(dailyRecord.ID, data)

        if (!response.success) {
          throw new Error(response.message || 'Failed to submit daily record')
        }

        // Clear cache and reload
        checklistCache.clear('dailyRecord')
        await loadDailyRecord(currentDateRef.current)
      } catch (error: any) {
        // Revert optimistic update on error
        if (enableOptimisticUpdates) {
          await loadDailyRecord(currentDateRef.current)
        }
        handleError(error, 'submitDailyRecord')
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [dailyRecord, enableOptimisticUpdates, handleError, loadDailyRecord]
  )

  const loadPendingApprovals = useCallback(
    async (filters?: { page?: number; limit?: number }) => {
      const cacheKey = createCacheKey('pendingApprovals', filters)
      const cached = checklistCache.get(cacheKey)

      if (cached) {
        setPendingApprovals(cached)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await checklistService.getPendingApprovals(filters)

        if (response.success && response.data) {
          setPendingApprovals(response.data)
          checklistCache.set(cacheKey, response.data, 2 * 60 * 1000) // Cache for 2 minutes
        } else {
          throw new Error(response.message || 'Failed to load pending approvals')
        }
      } catch (error: any) {
        handleError(error, 'loadPendingApprovals')
        setPendingApprovals([])
      } finally {
        setIsLoading(false)
      }
    },
    [createCacheKey, handleError]
  )

  const processApproval = useCallback(
    async (recordId: string, data: ProcessApprovalData) => {
      setIsSubmitting(true)
      setError(null)

      // Optimistic update
      if (enableOptimisticUpdates) {
        setPendingApprovals((prev) => prev.filter((record) => record.ID !== recordId))
      }

      try {
        const response = await checklistService.processApproval(recordId, data)

        if (!response.success) {
          throw new Error(response.message || 'Failed to process approval')
        }

        // Clear cache and reload
        checklistCache.clear('pendingApprovals')
        await loadPendingApprovals()
      } catch (error: any) {
        // Revert optimistic update on error
        if (enableOptimisticUpdates) {
          await loadPendingApprovals()
        }
        handleError(error, 'processApproval')
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [enableOptimisticUpdates, handleError, loadPendingApprovals]
  )

  const loadAnalytics = useCallback(
    async (filters?: ChecklistFilters) => {
      const cacheKey = createCacheKey('analytics', filters)
      const cached = checklistCache.get(cacheKey)

      if (cached) {
        setAnalytics(cached)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await checklistService.getAnalytics(filters)

        if (response.success && response.data) {
          setAnalytics(response.data)
          checklistCache.set(cacheKey, response.data, 5 * 60 * 1000) // Cache for 5 minutes
        } else {
          throw new Error(response.message || 'Failed to load analytics')
        }
      } catch (error: any) {
        handleError(error, 'loadAnalytics')
        setAnalytics(null)
      } finally {
        setIsLoading(false)
      }
    },
    [createCacheKey, handleError]
  )

  const loadResponses = useCallback(
    async (filters?: ChecklistFilters & { page?: number; limit?: number }) => {
      const cacheKey = createCacheKey('responses', filters)
      const cached = checklistCache.get(cacheKey)

      if (cached) {
        setResponses(cached)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await checklistService.getResponses(filters)

        if (response.success && response.data) {
          setResponses(response.data)
          checklistCache.set(cacheKey, response.data)
        } else {
          throw new Error(response.message || 'Failed to load responses')
        }
      } catch (error: any) {
        handleError(error, 'loadResponses')
        setResponses([])
      } finally {
        setIsLoading(false)
      }
    },
    [createCacheKey, handleError]
  )

  // ===== UTILITY METHODS =====

  const refresh = useCallback(async () => {
    checklistCache.clear()
    await Promise.all([loadDailyRecord(currentDateRef.current), loadTemplates(), loadCategories()])
  }, [loadDailyRecord, loadTemplates, loadCategories])

  const batchUpdateItems = useCallback(
    async (updates: Array<{ checklistId: string; data: UpdateChecklistItemData }>) => {
      if (!dailyRecord) {
        throw new Error('No daily record loaded')
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const response = await checklistService.batchUpdateItems(dailyRecord.ID, updates)

        if (!response.success) {
          throw new Error(response.message || 'Failed to batch update items')
        }

        // Clear cache and reload
        checklistCache.clear('dailyRecord')
        await loadDailyRecord(currentDateRef.current)
      } catch (error: any) {
        handleError(error, 'batchUpdateItems')
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [dailyRecord, handleError, loadDailyRecord]
  )

  const getCompletionStats = useCallback(() => {
    if (!dailyRecord?.checklistItems) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
        estimatedTime: 0,
        completedTime: 0,
      }
    }

    const total = dailyRecord.checklistItems.length
    const completed = dailyRecord.checklistItems.filter((item) => item.IS_COMPLETED).length
    const pending = total - completed
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    const estimatedTime = dailyRecord.checklistItems.reduce(
      (sum, item) => sum + (item.ESTIMATED_TIME || 0),
      0
    )

    const completedTime = dailyRecord.checklistItems
      .filter((item) => item.IS_COMPLETED)
      .reduce((sum, item) => sum + (item.ESTIMATED_TIME || 0), 0)

    return {
      total,
      completed,
      pending,
      completionRate: Math.round(completionRate * 100) / 100,
      estimatedTime,
      completedTime,
    }
  }, [dailyRecord])

  // ===== EFFECTS =====

  useEffect(() => {
    if (autoFetch) {
      loadCategories()
      loadTemplates()
      loadDailyRecord(initialDate)
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [autoFetch]) // Only depend on autoFetch

  // ===== RETURN =====

  return {
    // Data
    dailyRecord,
    templates,
    categories,
    responses,
    pendingApprovals,
    analytics,

    // Loading states
    isLoading,
    isSubmitting,

    // Error states
    error,

    // Core methods
    loadDailyRecord,
    loadTemplates,
    loadCategories,
    updateChecklistItem,
    submitDailyRecord,
    loadPendingApprovals,
    processApproval,
    loadAnalytics,

    // Additional methods
    loadResponses,
    batchUpdateItems,
    getCompletionStats,

    // Utility methods
    refresh,
    clearError,

    // Cache utilities
    clearCache: (pattern?: string) => checklistCache.clear(pattern),
    getCacheStats: () => checklistCache.getStats(),
  }
}
