// components/ActivityListPage.tsx - Enhanced with quick status update
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Clock,
  Edit3,
  Search,
  CheckCircle,
  XCircle,
  Target,
  Users,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  Calendar,
  Activity as ActivityIcon,
  Filter,
  Star,
  Timer,
  TrendingUp,
  Info,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'

// Enhanced interfaces
interface ActivityListPageProps {
  activities: any[]
  categories: any[]
  teamMembers?: any[]
  isLoading: boolean
  error?: string | null
  pagination?: any
  onShowAddActivityChange: (show: boolean) => void
  onRefresh?: () => void
  onEditActivity?: (activity: any) => void
  onDeleteActivity?: (id: string) => Promise<any>
  onQuickStatusUpdate?: (id: string, status: string) => Promise<any>
  currentUser?: any
}

interface ActivityStatsProps {
  activities: any[]
}

interface EnhancedFilterSectionProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterStatus: string
  onStatusChange: (status: string) => void
  filterPriority: string
  onPriorityChange: (priority: string) => void
  filterCategory: string
  onCategoryChange: (category: string) => void
  categories: any[]
  isLoading: boolean
  activitiesCount: number
  filteredCount: number
  onClearFilters?: () => void
}

interface EnhancedActivityItemProps {
  activity: any
  onEdit: () => void
  onDelete: () => void
  onQuickStatusUpdate?: (status: string) => Promise<any>
  isDeleting: boolean
  currentUser?: any
}

// Helper functions
const getActivityId = (activity: any): string => {
  return (
    activity.ACTIVITY_CODE ||
    activity.code ||
    activity.ACTIVITY_ID?.toString() ||
    activity.id?.toString() ||
    ''
  )
}

const getActivityTitle = (activity: any): string => {
  return activity.TITLE || activity.title || ''
}

const getActivityStatus = (activity: any): string => {
  return activity.STATUS || activity.status || 'pending'
}

const getActivityPriority = (activity: any): string => {
  return activity.PRIORITY || activity.priority || 'medium'
}

const getActivityDescription = (activity: any): string => {
  return activity.DESCRIPTION || activity.description || ''
}

const getActivityCategory = (activity: any): string => {
  return activity.CATEGORY_NAME_LAO || activity.CAT_NAME_LAO || activity.categoryName || ''
}

const getActivityAssigneeName = (activity: any): string => {
  if (activity.ASSIGNEE_FNAME && activity.ASSIGNEE_LNAME) {
    return `${activity.ASSIGNEE_FNAME} ${activity.ASSIGNEE_LNAME}`
  }
  return activity.assigneeName || activity.ASSIGNEE_NAME || ''
}

const getActivityCreatorName = (activity: any): string => {
  if (activity.CREATOR_FNAME && activity.CREATOR_LNAME) {
    return `${activity.CREATOR_FNAME} ${activity.CREATOR_LNAME}`
  }
  return activity.creatorName || activity.CREATOR_NAME || ''
}

// Quick Status Update Component
const QuickStatusDropdown: React.FC<{
  currentStatus: string
  onStatusChange: (status: string) => Promise<void>
  disabled?: boolean
}> = ({ currentStatus, onStatusChange, disabled = false }) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const statusOptions = [
    { value: 'pending', label: 'ລໍຖ້າ', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-100' },
    { value: 'in_progress', label: 'ກຳລັງເຮັດ', icon: Clock, color: 'text-blue-600 bg-blue-100' },
    {
      value: 'completed',
      label: 'ສຳເລັດ',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
    { value: 'cancelled', label: 'ຍົກເລີກ', icon: XCircle, color: 'text-red-600 bg-red-100' },
  ]

  const currentStatusConfig =
    statusOptions.find((s) => s.value === currentStatus) || statusOptions[0]
  const CurrentIcon = currentStatusConfig.icon

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setIsOpen(false)
      return
    }

    setIsUpdating(true)
    try {
      await onStatusChange(newStatus)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${currentStatusConfig.color} ${
          disabled || isUpdating
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:opacity-80'
        }`}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CurrentIcon className="h-4 w-4" />
        )}
        <span>{currentStatusConfig.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 z-50 mt-1 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {statusOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                    option.value === currentStatus ? 'bg-gray-50' : ''
                  }`}
                >
                  <Icon className={`h-4 w-4 ${option.color.split(' ')[0]}`} />
                  <span>{option.label}</span>
                  {option.value === currentStatus && (
                    <CheckCircle className="ml-auto h-3 w-3 text-green-600" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Enhanced stats component
const ActivityStats: React.FC<ActivityStatsProps> = ({ activities }) => {
  const stats = useMemo(() => {
    const total = activities.length
    const completed = activities.filter((a) => getActivityStatus(a) === 'completed').length
    const inProgress = activities.filter((a) => getActivityStatus(a) === 'in_progress').length
    const pending = activities.filter((a) => getActivityStatus(a) === 'pending').length
    const cancelled = activities.filter((a) => getActivityStatus(a) === 'cancelled').length

    const totalEstimated = activities.reduce((sum, a) => {
      const duration = a.ESTIMATED_DURATION || a.estimatedDuration || 0
      return sum + (typeof duration === 'string' ? parseInt(duration) : duration)
    }, 0)

    const totalActual = activities.reduce((sum, a) => {
      const duration = a.ACTUAL_DURATION || a.actualDuration || 0
      return sum + (typeof duration === 'string' ? parseInt(duration) : duration)
    }, 0)

    const highPriority = activities.filter((a) => {
      const priority = getActivityPriority(a)
      return priority === 'urgent' || priority === 'high'
    }).length

    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      totalEstimated,
      totalActual,
      highPriority,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      efficiency: totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0,
    }
  }, [activities])

  const statCards = [
    {
      label: 'ທັງໝົດ',
      value: stats.total,
      icon: Target,
      bgColor: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500',
    },
    {
      label: 'ສຳເລັດ',
      value: stats.completed,
      icon: CheckCircle,
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-600',
      iconColor: 'text-green-500',
    },
    {
      label: 'ກຳລັງເຮັດ',
      value: stats.inProgress,
      icon: Clock,
      bgColor: 'from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-600',
      iconColor: 'text-yellow-500',
    },
    {
      label: 'ລໍຖ້າ',
      value: stats.pending,
      icon: AlertCircle,
      bgColor: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-600',
      iconColor: 'text-orange-500',
    },
  ]

  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          ສະຖິຕິກິດຈະກຳ
        </h2>
        {stats.highPriority > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
            <Star className="h-4 w-4" />
            {stats.highPriority} ກິດຈະກຳສຳຄັນ
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, bgColor, textColor, iconColor }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${bgColor} rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md`}
          >
            <Icon className={`h-8 w-8 ${iconColor} mx-auto mb-2`} />
            <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
            <div className="text-sm text-gray-600">{label}</div>
          </div>
        ))}
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Completion Rate */}
        <div>
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span className="font-medium">ອັດຕາສຳເລັດ</span>
            <span className="font-semibold">{stats.completionRate}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                stats.completionRate >= 80
                  ? 'bg-green-500'
                  : stats.completionRate >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {stats.completed} ຈາກ {stats.total} ກິດຈະກຳ
          </div>
        </div>

        {/* Time Efficiency */}
        {stats.totalEstimated > 0 && (
          <div>
            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span className="font-medium">ປະສິດທິພາບເວລາ</span>
              <span className="font-semibold">
                {Math.round(stats.totalActual / 60)}h / {Math.round(stats.totalEstimated / 60)}h
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  stats.efficiency <= 100 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(stats.efficiency, 100)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.efficiency <= 100 ? 'ໃຊ້ເວລາຕາມແຜນ' : `ເກີນເວລາ ${stats.efficiency - 100}%`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced filter section
const EnhancedFilterSection: React.FC<EnhancedFilterSectionProps> = ({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterPriority,
  onPriorityChange,
  filterCategory,
  onCategoryChange,
  categories,
  isLoading,
  activitiesCount,
  filteredCount,
  onClearFilters,
}) => {
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
    )
  }, [searchQuery, filterStatus, filterPriority, filterCategory])

  const clearAllFilters = useCallback(() => {
    onSearchChange('')
    onStatusChange('all')
    onPriorityChange('all')
    onCategoryChange('all')
    onClearFilters?.()
  }, [onSearchChange, onStatusChange, onPriorityChange, onCategoryChange, onClearFilters])

  const statusOptions = [
    { value: 'all', label: 'ທຸກສະຖານະ' },
    { value: 'pending', label: 'ລໍຖ້າ' },
    { value: 'in_progress', label: 'ກຳລັງເຮັດ' },
    { value: 'completed', label: 'ສຳເລັດ' },
    { value: 'cancelled', label: 'ຍົກເລີກ' },
  ]

  const priorityOptions = [
    { value: 'all', label: 'ທຸກຄວາມສຳຄັນ' },
    { value: 'urgent', label: 'ດ່ວນ' },
    { value: 'high', label: 'ສູງ' },
    { value: 'medium', label: 'ປານກາງ' },
    { value: 'low', label: 'ຕ່ຳ' },
  ]

  // Process categories to ensure consistent format
  const processedCategories = useMemo(() => {
    return Array.isArray(categories)
      ? categories.map((cat) => ({
          id: cat.CAT_ID || cat.id,
          code: cat.CAT_CODE || cat.code,
          name: cat.CAT_NAME_LAO || cat.nameLao || cat.name || '',
        }))
      : []
  }, [categories])

  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Filter className="h-5 w-5 text-blue-600" />
            ຄົ້ນຫາ ແລະ ກອງຕົວ
          </h3>
          <div className="rounded-full bg-gray-50 px-3 py-1 text-sm text-gray-600">
            ສະແດງ <span className="font-semibold text-blue-600">{filteredCount}</span> ຈາກ{' '}
            <span className="font-semibold">{activitiesCount}</span> ກິດຈະກຳ
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາກິດຈະກຳ..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pr-12 pl-10 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">ສະຖານະ</label>
            <select
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isLoading}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">ຄວາມສຳຄັນ</label>
            <select
              value={filterPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isLoading}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">ປະເພດ</label>
            <select
              value={filterCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isLoading}
            >
              <option value="all">ທຸກປະເພດ</option>
              {processedCategories.map((cat) => (
                <option key={cat.code || cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">ກຳລັງໃຊ້ຕົວກອງ</span>
            </div>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700"
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4" />
              ລົບຕົວກອງທັງໝົດ
            </button>
          </div>
        )}

        {/* Search Results Info */}
        {searchQuery && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-700">
              ຜົນການຄົ້ນຫາສຳລັບ <span className="font-semibold">&quot;{searchQuery}&quot;</span>:
              ພົບ <span className="font-semibold">{filteredCount}</span> ກິດຈະກຳ
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced activity item component with quick status update
const EnhancedActivityItem: React.FC<EnhancedActivityItemProps> = ({
  activity,
  onEdit,
  onDelete,
  onQuickStatusUpdate,
  isDeleting,
  currentUser,
}) => {
  const [showDetails, setShowDetails] = useState(false)

  const getPriorityConfig = (priority: string) => {
    const configs = {
      urgent: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-500',
        label: 'ດ່ວນ',
      },
      high: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-500',
        label: 'ສູງ',
      },
      medium: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-500',
        label: 'ປານກາງ',
      },
      low: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-500',
        label: 'ຕ່ຳ',
      },
    } as const
    return configs[priority as keyof typeof configs] || configs.medium
  }

  const priority = getActivityPriority(activity)
  const status = getActivityStatus(activity)
  const title = getActivityTitle(activity)
  const description = getActivityDescription(activity)
  const category = getActivityCategory(activity)
  const assigneeName = getActivityAssigneeName(activity)
  const creatorName = getActivityCreatorName(activity)
  const activityId = getActivityId(activity)

  const priorityConfig = getPriorityConfig(priority)

  const isOverdue = useMemo(() => {
    const dueDate = activity.DUE_DATE || activity.dueDate
    if (!dueDate || status === 'completed' || status === 'cancelled') {
      return false
    }
    return new Date(dueDate) < new Date()
  }, [activity.DUE_DATE, activity.dueDate, status])

  const timeProgress = useMemo(() => {
    const estimated = activity.ESTIMATED_DURATION || activity.estimatedDuration
    const actual = activity.ACTUAL_DURATION || activity.actualDuration

    if (!estimated) return null

    const estimatedNum = typeof estimated === 'string' ? parseInt(estimated) : estimated
    const actualNum = typeof actual === 'string' ? parseInt(actual) : actual || 0

    return {
      percentage: Math.min((actualNum / estimatedNum) * 100, 100),
      isOvertime: actualNum > estimatedNum,
      actual: actualNum,
      estimated: estimatedNum,
    }
  }, [
    activity.ESTIMATED_DURATION,
    activity.estimatedDuration,
    activity.ACTUAL_DURATION,
    activity.actualDuration,
  ])

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes} ນາທີ`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ຊົ່ວໂມງ ${mins} ນາທີ` : `${hours} ຊົ່ວໂມງ`
  }, [])

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('lo-LA')
    } catch {
      return dateString
    }
  }, [])

  const formatDateTime = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('lo-LA')
    } catch {
      return dateString
    }
  }, [])

  // Handle quick status update
  const handleQuickStatusUpdate = async (newStatus: string) => {
    if (onQuickStatusUpdate) {
      await onQuickStatusUpdate(newStatus)
    }
  }

  // Extract time and date information
  const startTime = activity.START_TIME || activity.startTime
  const endTime = activity.END_TIME || activity.endTime
  const dueDate = activity.DUE_DATE || activity.dueDate
  const estimatedDuration = activity.ESTIMATED_DURATION || activity.estimatedDuration
  const createdDate = activity.CREATED_DATE || activity.createdDate
  const updatedDate = activity.UPDATED_DATE || activity.updatedDate
  const notes = activity.NOTES || activity.notes
  const assigneeNote = activity.ASSIGNEE_NOTE || activity.assigneeNote
  const progressPercentage = activity.PROGRESS_PERCENTAGE || activity.progress

  return (
    <div
      className={`rounded-2xl border-l-4 bg-white shadow-lg transition-all duration-300 hover:shadow-xl ${priorityConfig.border} overflow-hidden`}
    >
      {/* Main Header */}
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">{title}</h3>

              {/* Priority Badge */}
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}
              >
                {priorityConfig.label}
              </span>

              {/* Quick Status Update Dropdown */}
              <QuickStatusDropdown
                currentStatus={status}
                onStatusChange={(newStatus) => handleQuickStatusUpdate(newStatus)}
                disabled={isDeleting}
              />

              {/* Overdue Badge */}
              {isOverdue && (
                <span className="flex animate-pulse items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white">
                  <Timer className="h-3 w-3" />
                  ເກີນກຳນົດ
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="mb-3 line-clamp-2 leading-relaxed text-gray-600">{description}</p>
            )}

            {/* Activity Info */}
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
              {startTime && (
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    {startTime}
                    {endTime && ` - ${endTime}`}
                  </span>
                </div>
              )}

              {category && (
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{category}</span>
                </div>
              )}

              {dueDate && (
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className={`text-gray-700 ${isOverdue ? 'font-medium text-red-600' : ''}`}>
                    {formatDate(dueDate)}
                  </span>
                </div>
              )}

              {estimatedDuration && (
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    {formatDuration(
                      typeof estimatedDuration === 'string'
                        ? parseInt(estimatedDuration)
                        : estimatedDuration
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ml-4 flex items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600"
              title={showDetails ? 'ເຊື່ອງລາຍລະອຽດ' : 'ສະແດງລາຍລະອຽດ'}
            >
              <Info className="h-4 w-4" />
            </button>

            <button
              onClick={onEdit}
              className="rounded-lg p-2 text-blue-400 transition-all duration-200 hover:bg-blue-100 hover:text-blue-600"
              title="ແກ້ໄຂ"
              disabled={isDeleting}
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              onClick={onDelete}
              className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:bg-red-100 hover:text-red-600"
              title="ລົບ"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
            {/* User Information */}
            {(creatorName || assigneeName) && (
              <div className="rounded-lg bg-blue-50 p-3">
                <h4 className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                  <Users className="h-4 w-4" />
                  ຂໍ້ມູນຜູ້ໃຊ້
                </h4>
                <div className="space-y-1 text-sm">
                  {creatorName && creatorName !== assigneeName && (
                    <p className="text-blue-700">
                      <span className="font-medium">ມອບໝາຍໂດຍ:</span> {creatorName}
                    </p>
                  )}
                  {assigneeName && (
                    <p className="text-green-700">
                      <span className="font-medium">ຜູ້ຮັບຜິດຊອບ:</span> {assigneeName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(notes || assigneeNote) && (
              <div className="space-y-3">
                {notes && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h5 className="mb-1 text-sm font-medium text-gray-900">ໝາຍເຫດ</h5>
                    <p className="text-sm leading-relaxed text-gray-700">{notes}</p>
                  </div>
                )}
                {assigneeNote && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h5 className="mb-1 text-sm font-medium text-blue-900">ຂໍ້ຄວາມຈາກຜູ້ມອບໝາຍ</h5>
                    <p className="text-sm leading-relaxed text-blue-700">{assigneeNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            {progressPercentage && parseFloat(progressPercentage.toString()) > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
                  <span className="font-medium">ຄວາມຄືບໜ້າ</span>
                  <span className="font-semibold">
                    {parseFloat(progressPercentage.toString()).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${parseFloat(progressPercentage.toString())}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Time Tracking */}
            {timeProgress && (
              <div>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
                  <span className="font-medium">ເວລາທີ່ໃຊ້</span>
                  <span
                    className={`font-semibold ${
                      timeProgress.isOvertime ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatDuration(timeProgress.actual)} / {formatDuration(timeProgress.estimated)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      timeProgress.isOvertime ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${timeProgress.percentage}%` }}
                  />
                </div>
                {timeProgress.isOvertime && (
                  <div className="mt-1 text-xs font-medium text-red-600">
                    ເກີນເວລາ {formatDuration(timeProgress.actual - timeProgress.estimated)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with timestamps */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex justify-between text-xs text-gray-500">
          {createdDate && <span>ສ້າງ: {formatDateTime(createdDate)}</span>}
          {updatedDate && updatedDate !== createdDate && (
            <span>ອັບເດດ: {formatDateTime(updatedDate)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Main ActivityListPage Component
const ActivityListPage: React.FC<ActivityListPageProps> = ({
  activities,
  categories,
  teamMembers = [],
  isLoading,
  error,
  pagination,
  onShowAddActivityChange,
  onRefresh,
  onEditActivity,
  onDeleteActivity,
  onQuickStatusUpdate,
  currentUser,
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [deletingIds, setDeletingIds] = useState(new Set<string>())

  // Ensure activities is always an array
  const safeActivities = useMemo(() => {
    return Array.isArray(activities) ? activities : []
  }, [activities])

  // Ensure categories is always an array
  const safeCategories = useMemo(() => {
    return Array.isArray(categories) ? categories : []
  }, [categories])

  // Filtered activities
  const filteredActivities = useMemo(() => {
    if (safeActivities.length === 0) return []

    return safeActivities.filter((activity) => {
      const status = getActivityStatus(activity)
      const priority = getActivityPriority(activity)
      const category = getActivityCategory(activity)
      const title = getActivityTitle(activity)
      const description = getActivityDescription(activity)
      const assigneeName = getActivityAssigneeName(activity)
      const creatorName = getActivityCreatorName(activity)

      // Status filter
      if (filterStatus !== 'all' && status !== filterStatus) return false

      // Priority filter
      if (filterPriority !== 'all' && priority !== filterPriority) return false

      // Category filter
      if (filterCategory !== 'all' && category !== filterCategory) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          title.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query) ||
          assigneeName.toLowerCase().includes(query) ||
          creatorName.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [safeActivities, filterStatus, filterPriority, filterCategory, searchQuery])

  // Sorted activities
  const sortedActivities = useMemo(() => {
    return [...filteredActivities].sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const aPriority = getActivityPriority(a) as keyof typeof priorityOrder
      const bPriority = getActivityPriority(b) as keyof typeof priorityOrder
      const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority]

      if (priorityDiff !== 0) return priorityDiff

      // Sort by due date
      const aDueDate = a.DUE_DATE || a.dueDate
      const bDueDate = b.DUE_DATE || b.dueDate

      if (aDueDate && bDueDate) {
        return new Date(aDueDate).getTime() - new Date(bDueDate).getTime()
      }
      if (aDueDate) return -1
      if (bDueDate) return 1

      // Sort by created date
      const aCreatedDate = a.CREATED_DATE || a.createdDate
      const bCreatedDate = b.CREATED_DATE || b.createdDate

      if (aCreatedDate && bCreatedDate) {
        return new Date(bCreatedDate).getTime() - new Date(aCreatedDate).getTime()
      }

      return 0
    })
  }, [filteredActivities])

  // Handle delete activity
  const handleDeleteActivity = useCallback(
    async (activityId: string) => {
      if (!confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບກິດຈະກຳນີ້?')) return

      try {
        setDeletingIds((prev) => new Set(prev).add(activityId))

        if (onDeleteActivity) {
          const result = await onDeleteActivity(activityId)
          if (result?.success && onRefresh) {
            onRefresh()
          }
        } else {
          console.log('Deleting activity:', activityId)
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 1000))
          if (onRefresh) {
            onRefresh()
          }
        }
      } catch (error) {
        console.error('Failed to delete activity:', error)
      } finally {
        setDeletingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(activityId)
          return newSet
        })
      }
    },
    [onDeleteActivity, onRefresh]
  )

  // Handle edit activity
  const handleEditActivity = useCallback(
    (activity: any) => {
      if (onEditActivity) {
        onEditActivity(activity)
      } else {
        console.log('Edit activity:', getActivityId(activity))
      }
    },
    [onEditActivity]
  )

  // Handle quick status update
  const handleQuickStatusUpdate = useCallback(
    async (activityId: string, newStatus: string) => {
      if (onQuickStatusUpdate) {
        return await onQuickStatusUpdate(activityId, newStatus)
      }
    },
    [onQuickStatusUpdate]
  )

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterCategory('all')
  }, [])

  // Loading state
  if (isLoading && safeActivities.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">ກຳລັງໂຫລດກິດຈະກຳ...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && safeActivities.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-l-4 border-red-500 bg-white p-6 text-center shadow-lg">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">ເກີດຂໍ້ຜິດພາດ</h3>
          <p className="mb-4 text-gray-600">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all duration-200 hover:bg-blue-700"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              ລອງໃໝ່
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      {safeActivities.length > 0 && <ActivityStats activities={safeActivities} />}

      {/* Filter Section */}
      <EnhancedFilterSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterPriority={filterPriority}
        onPriorityChange={setFilterPriority}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        categories={safeCategories}
        isLoading={isLoading}
        activitiesCount={safeActivities.length}
        filteredCount={sortedActivities.length}
        onClearFilters={handleClearFilters}
      />

      {/* Activity List */}
      <div className="space-y-4">
        {sortedActivities.length > 0 ? (
          sortedActivities.map((activity) => {
            const activityId = getActivityId(activity)
            return (
              <EnhancedActivityItem
                key={activityId}
                activity={activity}
                onEdit={() => handleEditActivity(activity)}
                onDelete={() => handleDeleteActivity(activityId)}
                onQuickStatusUpdate={
                  onQuickStatusUpdate
                    ? (newStatus) => handleQuickStatusUpdate(activityId, newStatus)
                    : undefined
                }
                isDeleting={deletingIds.has(activityId)}
                currentUser={currentUser}
              />
            )
          })
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-lg">
            <ActivityIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">ບໍ່ມີກິດຈະກຳ</h3>
            <p className="mb-4 text-gray-500">
              {searchQuery ||
              filterStatus !== 'all' ||
              filterPriority !== 'all' ||
              filterCategory !== 'all'
                ? 'ບໍ່ພົບກິດຈະກຳທີ່ຕົງຕາມເງື່ອນໄຂການຄົ້ນຫາ'
                : 'ຍັງບໍ່ມີກິດຈະກຳໃນວັນທີ່ເລືອກ'}
            </p>
            <button
              onClick={() => onShowAddActivityChange(true)}
              className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              ເພີ່ມກິດຈະກຳໃໝ່
            </button>
          </div>
        )}
      </div>

      {/* Floating Add Button for Mobile */}
      <button
        onClick={() => onShowAddActivityChange(true)}
        className="fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-700 md:hidden"
        title="ເພີ່ມກິດຈະກຳໃໝ່"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Loading Overlay */}
      {isLoading && safeActivities.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-white p-3 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600">ກຳລັງອັບເດດ...</span>
        </div>
      )}
    </div>
  )
}

export default ActivityListPage
