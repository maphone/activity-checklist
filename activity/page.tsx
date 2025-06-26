// DailyActivityTracker.tsx - Updated with Checklist Integration
'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Calendar,
  Target,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  User,
  Plus,
  Activity as ActivityIcon,
  ClipboardCheck,
} from 'lucide-react'

// Import types and hooks
import { DecodedToken, getDecodedToken } from '@/hooks/use-decoded-token'
import { getToken } from '@/hooks/secureStore'
import { useSimpleToast } from './hooks/useToastContext'
import { useChecklist } from './hooks/useChecklists'
import {
  TabConfig,
  ViewType,
  Activity,
  CreateActivityData,
  UpdateActivityData,
} from './types/types'

// Import real activity service
import { activityService } from './services/activityService'

// Import components
import ActivityListPage from './components/ActivityListPage'
import MainChecklistPage from './components/MainChecklistPage '
import SummaryPage from './components/SummaryPage'
import ActivityForm from './components/activityFrom'

// Import new checklist components
import { DailyChecklist, ApprovalList } from './components/ChecklistComponents'

// Enhanced Types
type ExtendedViewType = ViewType | 'checklist-approval' | 'checklist-analytics'

interface ExtendedTabConfig extends Omit<TabConfig, 'id'> {
  id: ExtendedViewType
  description?: string
  requiresRole?: string[]
}

// 🔧 Fixed useActivities Hook (same as before)
const useActivities = (initialParams: any = {}) => {
  const [activities, setActivities] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [pagination, setPagination] = React.useState(null)
  const paramsRef = useRef(initialParams)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    paramsRef.current = initialParams
  }, [initialParams.startDate, initialParams.endDate])

  const fetchActivities = React.useCallback(async (forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const response = await activityService.getActivities(paramsRef.current, {
        signal: abortControllerRef.current.signal,
      })

      if (response.success) {
        setActivities(response.data || [])
        setPagination(response.pagination || null)
      } else {
        throw new Error(response.message || 'Failed to fetch activities')
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('❌ [useActivities] Error:', err)
        setError(err.message || 'ไม่สามารถโหลดกิจกรรมได้')
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  const createActivity = React.useCallback(
    async (data: any) => {
      try {
        const response = await activityService.createActivity(data)
        if (response.success && response.data) {
          await fetchActivities(true)
        }
        return response
      } catch (err: any) {
        return { success: false, message: err.message }
      }
    },
    [fetchActivities]
  )

  const updateActivity = React.useCallback(
    async (id: string, data: any) => {
      try {
        const response = await activityService.updateActivity(id, data)
        if (response.success) {
          await fetchActivities(true)
        }
        return response
      } catch (err: any) {
        return { success: false, message: err.message }
      }
    },
    [fetchActivities]
  )

  const deleteActivity = React.useCallback(
    async (id: string) => {
      try {
        const response = await activityService.deleteActivity(id)
        if (response.success) {
          await fetchActivities(true)
        }
        return response
      } catch (err: any) {
        return { success: false, message: err.message }
      }
    },
    [fetchActivities]
  )

  const refetch = React.useCallback(
    (newParams?: any) => {
      if (newParams) {
        paramsRef.current = { ...paramsRef.current, ...newParams }
      }
      return fetchActivities(true)
    },
    [fetchActivities]
  )

  return {
    activities,
    loading,
    error,
    pagination,
    refetch,
    setActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    clearError: () => setError(null),
    cacheStats: { size: 0, maxSize: 0, usage: '0%' },
  }
}

// 🔧 Fixed useCategories and useTeamMembers Hooks (same as before)
const useCategories = () => {
  const [categories, setCategories] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [fetched, setFetched] = React.useState(false)

  const fetchCategories = React.useCallback(async () => {
    if (fetched) return

    setLoading(true)
    setError(null)

    try {
      const response = await activityService.getCategories()
      if (response.success) {
        setCategories(response.data || [])
        setFetched(true)
      } else {
        throw new Error(response.message || 'Failed to fetch categories')
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดหมวดหมู่ได้')
    } finally {
      setLoading(false)
    }
  }, [fetched])

  React.useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    refetch: () => {
      setFetched(false)
      fetchCategories()
    },
    clearError: () => setError(null),
  }
}

const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [fetched, setFetched] = React.useState(false)

  const fetchTeamMembers = React.useCallback(async () => {
    if (fetched) return

    setLoading(true)
    setError(null)

    try {
      const response = await activityService.getTeamMembers()
      if (response.success) {
        setTeamMembers(response.data || [])
        setFetched(true)
      } else {
        throw new Error(response.message || 'Failed to fetch team members')
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดสมาชิกทีมได้')
    } finally {
      setLoading(false)
    }
  }, [fetched])

  React.useEffect(() => {
    fetchTeamMembers()
  }, [])

  return {
    teamMembers,
    loading,
    error,
    refetch: () => {
      setFetched(false)
      fetchTeamMembers()
    },
    clearError: () => setError(null),
  }
}

// Enhanced Error Component
const ErrorDisplay: React.FC<{
  error: string
  onRetry?: () => void
  type?: 'error' | 'warning' | 'info'
  retryCount?: number
  maxRetries?: number
}> = ({ error, onRetry, type = 'error', retryCount = 0, maxRetries = 3 }) => {
  const getConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertCircle,
          title: 'ຄໍາເຕືອນ',
          colors: 'text-yellow-600 border-yellow-200 bg-yellow-50',
          iconColor: 'text-yellow-500',
        }
      case 'info':
        return {
          icon: AlertCircle,
          title: 'ຂໍ້ມູນ',
          colors: 'text-blue-600 border-blue-200 bg-blue-50',
          iconColor: 'text-blue-500',
        }
      default:
        return {
          icon: AlertCircle,
          title: 'ເກີດຂໍ້ຜິດພາດ',
          colors: 'text-red-600 border-red-200 bg-red-50',
          iconColor: 'text-red-500',
        }
    }
  }

  const config = getConfig()
  const IconComponent = config.icon

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className={`max-w-md rounded-2xl border-2 p-8 text-center shadow-lg ${config.colors}`}>
        <IconComponent className={`h-16 w-16 ${config.iconColor} mx-auto mb-4`} />
        <h2 className="mt-4 mb-2 text-xl font-semibold text-gray-900">{config.title}</h2>
        <p className="mb-4 text-gray-600">{error}</p>

        {retryCount > 0 && (
          <p className="mb-4 text-sm text-gray-500">
            ພະຍາຍາມແລ້ວ {retryCount}/{maxRetries} ເທື່ອ
          </p>
        )}

        {onRetry && retryCount < maxRetries && (
          <button
            onClick={onRetry}
            className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            {retryCount > 0 ? `ລອງໃໝ່ (${retryCount + 1}/${maxRetries})` : 'ລອງໃໝ່'}
          </button>
        )}
      </div>
    </div>
  )
}

// ========= MAIN COMPONENT =========
const DailyActivityTracker: React.FC = () => {
  // ========= Core State =========
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentView, setCurrentView] = useState<ExtendedViewType>('activities')
  const [currentUser, setCurrentUser] = useState<DecodedToken | null>(null)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  // ========= Loading and Error States =========
  const [isInitializing, setIsInitializing] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // ========= Custom Hooks with fixed dependencies =========
  const { success, error: showError } = useSimpleToast()

  // Create stable params object
  const activitiesParams = useMemo(
    () => ({
      startDate: selectedDate,
      endDate: selectedDate,
      autoFetch: true,
    }),
    [selectedDate]
  )

  const activitiesHook = useActivities(activitiesParams)
  const categoriesHook = useCategories()
  const teamMembersHook = useTeamMembers()

  const checklistHook = useChecklist({
    initialDate: selectedDate,
    autoFetch: false,
    enableOptimisticUpdates: true,
  })

  // ========= Refs =========
  const initializationRef = useRef(false)

  // ========= Enhanced Initialization =========
  useEffect(() => {
    const initializeApp = async () => {
      if (initializationRef.current) return
      initializationRef.current = true

      try {
        setGlobalError(null)
        console.log('🚀 Starting app initialization...')

        // Load user token
        const token = await getToken()
        if (token) {
          const decoded = await getDecodedToken()
          setCurrentUser(decoded)
        }

        // Initial data fetch
        await Promise.all([
          activitiesHook.refetch(),
          categoriesHook.refetch(),
          teamMembersHook.refetch(),
        ])

        // Initialize checklist data
        checklistHook.loadTemplates?.()
        checklistHook.loadCategories?.()
        checklistHook.loadDailyRecord?.(selectedDate)

        setGlobalError(null)
        setRetryCount(0)
        console.log('✅ App initialization completed')
      } catch (error: any) {
        console.error('❌ Failed to initialize app:', error)
        setGlobalError(error.message || 'ບໍ່ສາມາດເລີ່ມຕົ້ນແອັບພລິເຄຊັນໄດ້')
        setRetryCount((prev) => prev + 1)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeApp()
  }, []) // Empty dependency array - run once

  // Update activities when date changes
  useEffect(() => {
    if (!isInitializing) {
      activitiesHook.refetch()

      // Reload checklist for new date if on checklist view
      if (currentView.startsWith('checklist')) {
        checklistHook.loadDailyRecord?.(selectedDate)
      }
    }
  }, [selectedDate])

  // ========= Event Handlers =========
  const handleViewChange = useCallback(
    (view: ExtendedViewType) => {
      if (view === currentView || isInitializing) return

      console.log('🔄 Changing view to:', view)
      setCurrentView(view)

      // Load specific data based on view
      if (view === 'checklist' && !checklistHook.dailyRecord) {
        checklistHook.loadTemplates?.()
        checklistHook.loadDailyRecord?.(selectedDate)
      } else if (view === 'checklist-approval') {
        checklistHook.loadPendingApprovals?.()
      } else if (view === 'checklist-analytics') {
        checklistHook.loadAnalytics?.()
      }
    },
    [currentView, isInitializing, checklistHook, selectedDate]
  )

  const handleDateChange = useCallback(
    (date: string) => {
      console.log('📅 Date changed to:', date)
      setSelectedDate(date)

      // Reload checklist for new date
      if (currentView.startsWith('checklist')) {
        checklistHook.loadDailyRecord?.(date)
      }
    },
    [currentView, checklistHook]
  )

  const handleRetryInitialization = useCallback(() => {
    console.log('🔄 Retrying initialization')
    setGlobalError(null)
    setIsInitializing(true)
    initializationRef.current = false
    window.location.reload()
  }, [])

  // Activity handlers (same as before)
  const handleAddActivity = useCallback(() => {
    setShowAddActivity(true)
    setEditingActivity(null)
  }, [])

  const handleEditActivity = useCallback((activity: Activity) => {
    setEditingActivity(activity)
    setShowAddActivity(false)
  }, [])

  const handleActivitySubmit = useCallback(
    async (formData: CreateActivityData | UpdateActivityData) => {
      try {
        let result
        if (editingActivity) {
          const activityId =
            editingActivity.ACTIVITY_CODE ||
            editingActivity.code ||
            editingActivity.ACTIVITY_ID?.toString() ||
            editingActivity.id?.toString()

          result = await activitiesHook.updateActivity(activityId!, formData as UpdateActivityData)
          if (result.success) {
            success('ອັບເດດກິດຈະກຳສຳເລັດແລ້ວ')
            setEditingActivity(null)
          }
        } else {
          result = await activitiesHook.createActivity(formData as CreateActivityData)
          if (result.success) {
            success('ສ້າງກິດຈະກຳສຳເລັດແລ້ວ')
            setShowAddActivity(false)
          }
        }

        if (!result.success) {
          throw new Error(result.message || 'ການດຳເນີນການບໍ່ສຳເລັດ')
        }

        return result
      } catch (error: any) {
        showError(error.message || 'ການດຳເນີນການບໍ່ສຳເລັດ')
        throw error
      }
    },
    [activitiesHook, editingActivity, success, showError]
  )

  const handleDeleteActivity = useCallback(
    async (activityId: string) => {
      try {
        const result = await activitiesHook.deleteActivity(activityId)
        if (result.success) {
          success('ລົບກິດຈະກຳສຳເລັດແລ້ວ')
        } else {
          throw new Error(result.message || 'ລົບກິດຈະກຳບໍ່ສຳເລັດ')
        }
        return result
      } catch (error: any) {
        showError(error.message || 'ລົບກິດຈະກຳບໍ່ສຳເລັດ')
        throw error
      }
    },
    [activitiesHook, success, showError]
  )

  const handleQuickStatusUpdate = useCallback(
    async (activityId: string, newStatus: string) => {
      try {
        const result = await activitiesHook.updateActivity(activityId, { status: newStatus })
        if (result.success) {
          success('ອັບເດດສະຖານະສຳເລັດແລ້ວ')
        } else {
          throw new Error(result.message || 'ອັບເດດສະຖານະບໍ່ສຳເລັດ')
        }
        return result
      } catch (error: any) {
        showError(error.message || 'ອັບເດດສະຖານະບໍ່ສຳເລັດ')
        throw error
      }
    },
    [activitiesHook, success, showError]
  )

  const handleCancelForm = useCallback(() => {
    setShowAddActivity(false)
    setEditingActivity(null)
  }, [])

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    try {
      await activitiesHook.refetch()
      success('ໂຫຼດຂໍ້ມູນໃໝ່ສຳເລັດແລ້ວ')
    } catch (error: any) {
      showError('ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໃໝ່ໄດ້')
    }
  }, [activitiesHook, success, showError])

  // ========= Role-based access =========
  const canApprove = useMemo(() => {
    if (!currentUser) return false
    const position = currentUser.positionname?.toLowerCase() || ''
    return (
      position.includes('manager') ||
      position.includes('supervisor') ||
      position.includes('head') ||
      position.includes('director')
    )
  }, [currentUser])

  // ========= Computed Values =========
  const tabs: ExtendedTabConfig[] = useMemo(() => {
    const baseTabs: ExtendedTabConfig[] = [
      {
        id: 'activities',
        label: 'ກິດຈະກຳ',
        icon: Target,
        count: activitiesHook.activities?.length || 0,
        badge: activitiesHook.error ? 'error' : undefined,
        description: 'ຈັດການກິດຈະກຳປະຈຳວັນ',
      },
      {
        id: 'checklist',
        label: 'Checklist',
        icon: CheckSquare,
        count: checklistHook.dailyRecord?.checklistItems?.length || undefined,
        badge: checklistHook.error ? 'error' : undefined,
        description: 'Checklist ປະຈຳວັນຂອງທ່ານ',
      },
    ]

    if (canApprove) {
      baseTabs.push({
        id: 'checklist-approval',
        label: 'ການອະນຸມັດ',
        icon: ClipboardCheck,
        count: checklistHook.pendingApprovals?.length || 0,
        badge: (checklistHook.pendingApprovals?.length || 0) > 0 ? 'warning' : undefined,
        description: 'ອະນຸມັດ checklist ຂອງພະນັກງານ',
        requiresRole: ['manager', 'supervisor', 'head'],
      })
    }

    baseTabs.push({
      id: 'summary',
      label: 'ສະຫຼຸບ',
      icon: TrendingUp,
      description: 'ສະຫຼຸບແລະສະຖິຕິ',
    })

    return baseTabs
  }, [
    activitiesHook.activities?.length,
    activitiesHook.error,
    checklistHook.dailyRecord?.checklistItems?.length,
    checklistHook.error,
    checklistHook.pendingApprovals?.length,
    canApprove,
  ])

  const isAnyLoading =
    isInitializing ||
    activitiesHook.loading ||
    categoriesHook.loading ||
    teamMembersHook.loading ||
    checklistHook.isLoading

  // ========= Error Boundary =========
  if (globalError && !isInitializing && retryCount >= 3) {
    return (
      <ErrorDisplay
        error={globalError}
        onRetry={handleRetryInitialization}
        type="error"
        retryCount={retryCount}
        maxRetries={3}
      />
    )
  }

  // ========= Main Render =========
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-16">
      <div className="mx-auto p-4 sm:p-8">
        {/* Date Selector */}
        <div className="mb-8">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex-1">
                <h1 className="mb-2 text-2xl font-bold text-gray-900 lg:text-3xl">
                  ການຈັດການກິດຈະກຳແລະ Checklist
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {currentUser && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {currentUser.firstName} {currentUser.lastName}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span>{currentUser.positionname}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedDate).toLocaleDateString('lo-LA')}</span>
                  </div>
                  {currentView === 'activities' && (
                    <div className="flex items-center gap-2 rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                      <ActivityIcon className="h-4 w-4" />
                      <span className="font-medium">
                        {activitiesHook.activities?.length || 0} ກິດຈະກຳ
                      </span>
                    </div>
                  )}
                  {currentView === 'checklist' && checklistHook.dailyRecord && (
                    <div className="flex items-center gap-2 rounded-full bg-green-100 px-2 py-1 text-green-700">
                      <CheckSquare className="h-4 w-4" />
                      <span className="font-medium">
                        {checklistHook.dailyRecord.checklistItems?.length || 0} ລາຍການ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={isInitializing}
                />

                {currentView === 'activities' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleManualRefresh}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md disabled:opacity-50"
                      disabled={isInitializing || activitiesHook.loading}
                      title="ໂຫຼດຂໍ້ມູນໃໝ່"
                    >
                      <RefreshCw
                        className={`h-5 w-5 ${activitiesHook.loading ? 'animate-spin' : ''}`}
                      />
                    </button>

                    <button
                      onClick={handleAddActivity}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
                      disabled={isInitializing}
                    >
                      <Plus className="h-5 w-5" />
                      <span className="hidden sm:inline">ເພີ່ມກິດຈະກຳ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentView === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleViewChange(tab.id)}
                    disabled={isInitializing}
                    className={`relative flex items-center gap-2 border-b-2 px-2 py-4 text-sm font-medium whitespace-nowrap transition-all disabled:opacity-50 ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/30 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50/30 hover:text-gray-700'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isActive ? 'scale-110' : ''
                      } transition-transform duration-200`}
                    />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                          isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                    {tab.badge === 'error' && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
                    )}
                    {tab.badge === 'warning' && tab.count! > 0 && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-yellow-500"></div>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div className="bg-gray-50 px-6 py-3">
            <p className="text-sm text-gray-600">
              {tabs.find((tab) => tab.id === currentView)?.description || ''}
            </p>
          </div>
        </div>

        {/* Global Error Display */}
        {globalError && retryCount < 3 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-700">{globalError}</span>
              </div>
              <button
                onClick={handleRetryInitialization}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                ລອງໃໝ່
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="min-h-[60vh]">
          {currentView === 'activities' && (
            <ActivityListPage
              activities={activitiesHook.activities || []}
              categories={categoriesHook.categories || []}
              teamMembers={teamMembersHook.teamMembers || []}
              isLoading={activitiesHook.loading}
              error={activitiesHook.error}
              pagination={activitiesHook.pagination}
              onShowAddActivityChange={setShowAddActivity}
              onRefresh={handleManualRefresh}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onQuickStatusUpdate={handleQuickStatusUpdate}
              currentUser={currentUser}
            />
          )}

          {(currentView === 'checklist' ||
            currentView === 'checklist-approval' ||
            currentView === 'checklist-analytics') && (
            <MainChecklistPage selectedDate={selectedDate} currentUser={currentUser} />
          )}

          {currentView === 'summary' && (
            <SummaryPage
              selectedDate={selectedDate}
              activities={activitiesHook.activities || []}
              currentUser={currentUser}
              checklistRecord={checklistHook.dailyRecord || undefined}
            />
          )}
        </div>
      </div>

      {/* Activity Form Modal */}
      {(showAddActivity || editingActivity) && (
        <ActivityForm
          mode={editingActivity ? 'edit' : 'create'}
          initialData={editingActivity}
          onSubmit={handleActivitySubmit}
          onCancel={handleCancelForm}
          categories={categoriesHook.categories || []}
          teamMembers={teamMembersHook.teamMembers || []}
          currentUser={currentUser}
          isSubmitting={activitiesHook.loading}
        />
      )}

      {/* Floating Action Button */}
      {currentView === 'activities' && !showAddActivity && !editingActivity && (
        <button
          onClick={handleAddActivity}
          className="fixed right-6 bottom-20 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all duration-200 hover:scale-110 hover:bg-blue-700 md:hidden"
          title="ເພີ່ມກິດຈະກຳໃໝ່"
        >
          <Plus className="h-8 w-8" />
        </button>
      )}

      {/* Notification Badge for Pending Approvals */}
      {canApprove &&
        currentView !== 'checklist-approval' &&
        (checklistHook.pendingApprovals?.length || 0) > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <div className="rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white shadow-lg">
              {checklistHook.pendingApprovals?.length} ລາຍການລໍຖ້າອະນຸມັດ
            </div>
          </div>
        )}
    </div>
  )
}

export default DailyActivityTracker
