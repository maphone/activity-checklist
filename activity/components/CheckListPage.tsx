// components/CheckListPage.tsx - Fixed version with create functionality
'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  CheckSquare,
  Save,
  Send,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  User,
  Target,
  Search,
  Filter,
  CircleCheckBig,
  XCircle,
  Info,
  TrendingUp,
  Plus,
  Calendar,
  Building,
} from 'lucide-react'
import { useChecklist } from '../hooks/useCheckList'
import { checklistService } from '../services/checkListService'
import { v4 as uuidv4 } from 'uuid'

// Fixed interface - simplified
interface ChecklistPageProps {
  selectedDate: string
  currentUser?: any
}

// Loading Spinner Component
const LoadingSpinner: React.FC<{
  message?: string
  size?: 'small' | 'medium' | 'large'
  showProgress?: boolean
  progress?: number
}> = ({ message = 'ກຳລັງໂຫຼດ...', size = 'large', showProgress = false, progress = 0 }) => {
  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-16 h-16',
  }

  const textSizes = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-xl',
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md text-center">
        <Loader2 className={`${iconSizes[size]} mx-auto mb-4 animate-spin text-blue-500`} />
        <h2 className={`${textSizes[size]} mb-2 font-semibold text-gray-900`}>{message}</h2>
        {showProgress && (
          <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
        <p className="text-gray-600">ກະລຸນາລໍຖ້າ...</p>
      </div>
    </div>
  )
}

// Error Display Component
const ErrorDisplay: React.FC<{
  error: string
  onRetry?: () => void
  type?: 'error' | 'warning' | 'info'
  actionText?: string
}> = ({ error, onRetry, type = 'error', actionText = 'ລອງໃໝ່' }) => {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
        }
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
        }
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        }
    }
  }

  const styles = getStyles()
  const IconComponent = styles.icon

  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`max-w-md rounded-xl border-2 p-6 text-center ${styles.bgColor} ${styles.borderColor}`}
      >
        <IconComponent className={`h-16 w-16 ${styles.iconColor} mx-auto mb-4`} />
        <h2 className={`mb-2 text-xl font-semibold text-gray-900`}>
          {type === 'error' ? 'ເກີດຂໍ້ຜິດພາດ' : type === 'warning' ? 'ຄຳເຕືອນ' : 'ຂໍ້ມູນ'}
        </h2>
        <p className={`${styles.textColor} mb-4 leading-relaxed`}>{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`px-6 py-3 ${styles.buttonColor} mx-auto flex items-center gap-2 rounded-lg text-white shadow-md transition-all duration-200 hover:shadow-lg`}
          >
            <RefreshCw className="h-4 w-4" />
            {actionText}
          </button>
        )}
      </div>
    </div>
  )
}

// Empty State Component
const EmptyState: React.FC<{
  onReload?: () => void
  onCreateNew?: () => void
  title?: string
  description?: string
  actionText?: string
  showCreateButton?: boolean
  icon?: React.ComponentType<{ className?: string }>
}> = ({
  onReload,
  onCreateNew,
  title = 'ບໍ່ມີຂໍ້ມູນ',
  description = 'ກະລຸນາລອງໃໝ່ອີກຄັ້ງ',
  actionText = 'ໂຫຼດຂໍ້ມູນ',
  showCreateButton = false,
  icon: IconComponent = CheckSquare,
}) => (
  <div className="flex items-center justify-center py-12">
    <div className="max-w-md rounded-xl bg-gray-50 p-8 text-center">
      <IconComponent className="mx-auto mb-4 h-16 w-16 text-gray-400" />
      <h2 className="mb-2 text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mb-4 leading-relaxed text-gray-600">{description}</p>
      <div className="flex justify-center gap-3">
        {onReload && (
          <button
            onClick={onReload}
            className="rounded-lg bg-gray-600 px-6 py-3 text-white shadow-md transition-all duration-200 hover:bg-gray-700 hover:shadow-lg"
          >
            {actionText}
          </button>
        )}
        {showCreateButton && onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            ສ້າງ Checklist ໃໝ່
          </button>
        )}
      </div>
    </div>
  </div>
)

// Create Checklist Modal Component
const CreateChecklistModal: React.FC<{
  currentUser: any
  selectedDate: string
  onSuccess: (record: any) => void
  onCancel: () => void
}> = ({ currentUser, selectedDate, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    date: selectedDate,
    notes: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setIsCreating(true)
    setError(null)

    try {
      // Get user info
      const udid = currentUser?.udid || currentUser?.UDID || ''
      const employeeName =
        currentUser?.name ||
        (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : '') ||
        currentUser?.EMPLOYEE_NAME ||
        ''
      const position =
        currentUser?.position || currentUser?.positionname || currentUser?.POSITION || ''
      const branchCode =
        currentUser?.branchCode || currentUser?.branchcode || currentUser?.BRANCH_CODE || ''
      const branchName =
        currentUser?.branchName || currentUser?.branchname || currentUser?.BRANCH_NAME || ''

      console.log('🔧 Creating new checklist record:', {
        date: formData.date,
        udid,
        position,
      })

      // Step 1: Load templates for position
      const templatesResponse = await checklistService.getChecklistTemplates(position)

      if (!templatesResponse.success || !templatesResponse.data) {
        throw new Error('ບໍ່ສາມາດດຶງຂໍ້ມູນ templates ໄດ້')
      }

      const templates = templatesResponse.data
      console.log(`✅ Loaded ${templates.length} templates for position: ${position}`)

      // Step 2: Create checklist items from templates
      const checklistItems = templates.map((template: any) => ({
        ID: uuidv4(),
        RECORD_ID: '', // Will be set by backend
        CHECKLIST_ID: template.ID,
        IS_COMPLETED: false,
        COMPLETION_TIME: null,
        NOTES: '',
        CREATED_AT: new Date().toISOString(),
        UPDATED_AT: new Date().toISOString(),

        // Include template info for display
        TITLE: template.TITLE,
        DESCRIPTION: template.DESCRIPTION,
        CATEGORY: template.CATEGORY,
        POSITION: template.POSITION,
        IS_REQUIRED: template.IS_REQUIRED,
        FREQUENCY: template.FREQUENCY,
        ESTIMATED_TIME: template.ESTIMATED_TIME,
      }))

      // Step 3: Create record data
      const newRecord = {
        ID: uuidv4(),
        UDID: udid,
        RECORD_DATE: formData.date,
        EMPLOYEE_NAME: employeeName,
        POSITION: position,
        BRANCH_CODE: branchCode,
        BRANCH_NAME: branchName,
        TOTAL_WORKING_HOURS: 8,
        NOTES: formData.notes,
        STATUS: 'draft',
        CREATED_AT: new Date().toISOString(),
        UPDATED_AT: new Date().toISOString(),
        checklistItems: checklistItems,
        activities: [],
      }

      console.log('📝 Creating record with checklist items:', {
        recordId: newRecord.ID,
        itemCount: checklistItems.length,
        requiredCount: checklistItems.filter((item) => item.IS_REQUIRED).length,
      })

      // Step 4: Save record
      const createResponse = await checklistService.createOrUpdateDailyRecord(newRecord)

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.message || 'ບໍ່ສາມາດສ້າງບັນທຶກໄດ້')
      }

      console.log('✅ Successfully created checklist record:', createResponse.data.ID)

      setIsCreating(false)
      onSuccess(createResponse.data)
    } catch (err: any) {
      console.error('❌ Failed to create checklist record:', err)
      const errorMessage = err.message || 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງບັນທຶກ'
      setError(errorMessage)
      setIsCreating(false)
    }
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">ສ້າງ Checklist ໃໝ່</h2>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-1 text-sm text-red-600 hover:text-red-800"
              >
                ປິດຂໍ້ຄວາມ
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Calendar className="mr-1 inline h-4 w-4" />
              ວັນທີ່
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">ພະນັກງານ:</span>
              <span className="text-sm font-medium text-gray-900">
                {currentUser?.name ||
                  (currentUser?.firstName
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : '') ||
                  currentUser?.EMPLOYEE_NAME ||
                  'ບໍ່ລະບຸ'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">ສາຂາ:</span>
              <span className="text-sm font-medium text-gray-900">
                {currentUser?.branchName ||
                  currentUser?.branchname ||
                  currentUser?.BRANCH_NAME ||
                  'ບໍ່ລະບຸ'}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ໝາຍເຫດ (ທາງເລືອກ)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="ເພີ່ມໝາຍເຫດ..."
              disabled={isCreating}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-all duration-200 hover:bg-gray-300"
            disabled={isCreating}
          >
            ຍົກເລີກ
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                ກຳລັງສ້າງ...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                ສ້າງ Checklist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Progress Section Component
const ProgressSection: React.FC<{
  completionPercentage: number
  completedItems: number
  totalItems: number
  completedTime: number
  totalEstimatedTime: number
  requiredCompletion: { completed: number; total: number }
}> = ({
  completionPercentage,
  completedItems,
  totalItems,
  completedTime,
  totalEstimatedTime,
  requiredCompletion,
}) => {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusText = (percentage: number) => {
    if (percentage === 100) return 'ສຳເລັດແລ້ວ'
    if (percentage >= 75) return 'ໃກ້ສຳເລັດ'
    if (percentage >= 50) return 'ກຳລັງດຳເນີນ'
    if (percentage >= 25) return 'ເລີ່ມຕົ້ນ'
    return 'ຍັງບໍ່ເລີ່ມ'
  }

  const timeEfficiency = totalEstimatedTime > 0 ? (completedTime / totalEstimatedTime) * 100 : 0

  return (
    <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          ຄວາມຄືບໜ້າ
        </h2>
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              completionPercentage === 100
                ? 'bg-green-500'
                : completionPercentage >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            {getStatusText(completionPercentage)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* ລາຍການສຳເລັດ */}
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">ລາຍການສຳເລັດ</span>
            <CircleCheckBig className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mb-2 text-2xl font-bold text-blue-900">
            {completedItems}/{totalItems}
          </div>
          <div className="mb-2 h-3 w-full rounded-full bg-blue-200">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                completionPercentage
              )}`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm font-medium text-blue-700">{completionPercentage.toFixed(1)}%</p>
        </div>

        {/* ລາຍການຈຳເປັນ */}
        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-purple-700">ລາຍການຈຳເປັນ</span>
            <Target className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mb-2 text-2xl font-bold text-purple-900">
            {requiredCompletion.completed}/{requiredCompletion.total}
          </div>
          <div className="mb-2 h-3 w-full rounded-full bg-purple-200">
            <div
              className="h-3 rounded-full bg-purple-500 transition-all duration-500"
              style={{
                width: `${
                  requiredCompletion.total > 0
                    ? (requiredCompletion.completed / requiredCompletion.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="text-sm font-medium text-purple-700">
            {requiredCompletion.total > 0
              ? ((requiredCompletion.completed / requiredCompletion.total) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>

        {/* ເວລາທີ່ໃຊ້ */}
        <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">ເວລາທີ່ໃຊ້</span>
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <div className="mb-2 text-2xl font-bold text-green-900">
            {Math.round(completedTime)} ນາທີ
          </div>
          <div className="mb-2 text-sm text-green-600">
            ຈາກທັງໝົດ {Math.round(totalEstimatedTime)} ນາທີ
          </div>
          <div className="h-3 w-full rounded-full bg-green-200">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                timeEfficiency <= 100 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(timeEfficiency, 100)}%` }}
            />
          </div>
        </div>

        {/* ປະສິດທິພາບ */}
        <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-orange-700">ປະສິດທິພາບ</span>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <div className="mb-2 text-2xl font-bold text-orange-900">
            {timeEfficiency.toFixed(0)}%
          </div>
          <div className="mb-2 text-sm text-orange-600">
            {timeEfficiency <= 100 ? 'ຕາມແຜນ' : 'ເກີນແຜນ'}
          </div>
          <div
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              timeEfficiency <= 80
                ? 'bg-green-100 text-green-700'
                : timeEfficiency <= 100
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {timeEfficiency <= 80 ? 'ດີເລີດ' : timeEfficiency <= 100 ? 'ດີ' : 'ຕ້ອງປັບປຸງ'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Category Filter Component
const CategoryFilter: React.FC<{
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  totalItems: number
  filteredItems: number
}> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  totalItems,
  filteredItems,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null)

  const clearSearch = useCallback(() => {
    onSearchChange('')
    searchInputRef.current?.focus()
  }, [onSearchChange])

  const clearFilters = useCallback(() => {
    onSearchChange('')
    onCategoryChange('all')
  }, [onSearchChange, onCategoryChange])

  const hasActiveFilters = searchQuery || selectedCategory !== 'all'

  return (
    <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col space-y-4">
        {/* ຫົວຂໍ້ແລະສະຖິຕິ */}
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Filter className="h-5 w-5 text-blue-600" />
            ຄົ້ນຫາແລະກອງ
          </h3>
          <div className="text-sm text-gray-600">
            ສະແດງ <span className="font-semibold text-blue-600">{filteredItems}</span> ຈາກ{' '}
            <span className="font-semibold">{totalItems}</span> ລາຍການ
          </div>
        </div>

        {/* ຊ່ອງຄົ້ນຫາ */}
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="ຄົ້ນຫາລາຍການ checklist..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pr-12 pl-10 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ກອງຕົວແລະການຄວບຄຸມ */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">ປະເພດ:</span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="min-w-[200px] rounded-lg border border-gray-300 px-4 py-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'ທຸກໝວດ' : category}
                </option>
              ))}
            </select>
          </div>

          {/* ປຸ່ມລ້າງຕົວກອງ */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2 py-1 text-sm text-blue-600">
                ກຳລັງໃຊ້ຕົວກອງ
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-gray-700"
              >
                <XCircle className="h-4 w-4" />
                ລ້າງຕົວກອງ
              </button>
            </div>
          )}
        </div>

        {/* ຜົນການຄົ້ນຫາ */}
        {searchQuery && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-700">
              ຜົນການຄົ້ນຫາສຳລັບ <span className="font-semibold">{searchQuery}</span> ພົບ{' '}
              <span className="font-semibold">{filteredItems}</span> ລາຍການ
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Checklist Item Component
const ChecklistItem: React.FC<{
  item: any
  isReadOnly: boolean
  itemNotes: Record<string, string>
  onToggle: (id: string) => void
  onNotesChange: (id: string, notes: string) => void
  isUpdating?: boolean
}> = ({ item, isReadOnly, itemNotes, onToggle, onNotesChange, isUpdating = false }) => {
  const [localNotes, setLocalNotes] = useState(itemNotes[item.ID] || item.NOTES || '')
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // ອັບເດດ notes ແບບ debounce
  useEffect(() => {
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current)
    }

    notesTimeoutRef.current = setTimeout(() => {
      if (localNotes !== (itemNotes[item.ID] || item.NOTES || '')) {
        onNotesChange(item.ID, localNotes)
      }
    }, 500)

    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current)
      }
    }
  }, [localNotes, item.ID, item.NOTES, itemNotes, onNotesChange])

  const getPriorityColor = () => {
    if (item.IS_REQUIRED) return 'border-red-500 bg-red-50'
    if (item.IS_COMPLETED) return 'border-green-500 bg-green-50'
    return 'border-gray-300 bg-white'
  }

  const getFrequencyText = (frequency: string) => {
    const labels = {
      daily: 'ປະຈຳວັນ',
      weekly: 'ປະຈຳອາທິດ',
      monthly: 'ປະຈຳເດືອນ',
      yearly: 'ປະຈຳປີ',
    }
    return labels[frequency as keyof typeof labels] || frequency
  }

  return (
    <div
      className={`rounded-xl border-l-4 p-6 shadow-sm transition-all duration-200 hover:shadow-md ${getPriorityColor()}`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-1">
          <div className="relative">
            <input
              type="checkbox"
              checked={item.IS_COMPLETED || false}
              onChange={() => onToggle(item.ID)}
              disabled={isReadOnly || isUpdating}
              className="h-5 w-5 rounded text-blue-600 transition-all duration-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            {isUpdating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* ເນື້ອຫາ */}
        <div className="min-w-0 flex-1">
          {/* ຫົວຂໍ້ແລະປ້າຍ */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <h3
                className={`text-lg font-medium transition-all duration-200 ${
                  item.IS_COMPLETED ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {item.TITLE}
              </h3>

              {/* ປ້າຍລາຍການ */}
              <div className="mt-2 flex items-center gap-2">
                {item.IS_REQUIRED && (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                    ຈຳເປັນ
                  </span>
                )}
                {item.FREQUENCY && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {getFrequencyText(item.FREQUENCY)}
                  </span>
                )}
                {item.IS_COMPLETED && (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    <CircleCheckBig className="h-3 w-3" />
                    ສຳເລັດແລ້ວ
                  </span>
                )}
              </div>
            </div>

            {/* ຂໍ້ມູນເວລາແລະຕຳແໜ່ງ */}
            <div className="ml-4 flex items-center gap-4 text-sm text-gray-500">
              {item.ESTIMATED_TIME && (
                <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                  <Clock className="h-4 w-4" />
                  <span>{item.ESTIMATED_TIME} ນາທີ</span>
                </div>
              )}
              {item.POSITION && (
                <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                  <User className="h-4 w-4" />
                  <span>{item.POSITION}</span>
                </div>
              )}
            </div>
          </div>

          {/* ລາຍລະອຽດ */}
          {item.DESCRIPTION && (
            <p className="mb-4 text-sm leading-relaxed text-gray-600">{item.DESCRIPTION}</p>
          )}

          {/* ຂໍ້ມູນເພີ່ມເຕີມ */}
          <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
            {item.CATEGORY && (
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="rounded-full bg-gray-100 px-2 py-1">{item.CATEGORY}</span>
              </div>
            )}
          </div>

          {/* ໝາຍເຫດ */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ໝາຍເຫດ
              {localNotes !== (itemNotes[item.ID] || item.NOTES || '') && (
                <span className="ml-2 text-xs text-blue-600">(ກຳລັງບັນທຶກ...)</span>
              )}
            </label>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              rows={3}
              placeholder="ເພີ່ມໝາຍເຫດ..."
            />
            <div className="mt-1 text-xs text-gray-500">{localNotes.length}/500 ຕົວອັກສອນ</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ໂຄມໂປເນັນຫຼັກ - Fixed version with create functionality
const ChecklistPage: React.FC<ChecklistPageProps> = ({ selectedDate, currentUser }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 🔧 Use fixed checklist hook
  const checklistHook = useChecklist({
    initialDate: selectedDate,
    autoFetch: false, // Manual control
    enableOptimisticUpdates: true,
  })

  const {
    templates = [],
    dailyRecord,
    isLoading = false,
    isSubmitting = false,
    isUpdating = false,
    loadDailyRecord,
    loadTemplates,
    toggleChecklistItem,
    updateItemNotes,
    saveDraft,
    submitForApproval,
    completionPercentage = 0,
    requiredItemsCompletion = { completed: 0, total: 0 },
    totalEstimatedTime = 0,
    completedTime = 0,
    canSubmit = false,
    error,
    clearError,
  } = checklistHook || {}

  // 🔧 Manual initialization with better control
  useEffect(() => {
    if (isInitialized) return

    const initializeData = async () => {
      try {
        console.log('🔧 [ChecklistPage] Starting manual initialization...')

        // Load templates first
        if (loadTemplates) {
          await loadTemplates()
        }

        // Then load daily record for the selected date
        if (loadDailyRecord) {
          await loadDailyRecord(selectedDate)
        }

        setIsInitialized(true)
        setRetryCount(0)
        console.log('✅ [ChecklistPage] Manual initialization completed')
      } catch (error) {
        console.error('❌ [ChecklistPage] Failed to initialize:', error)
        setRetryCount((prev) => prev + 1)
      }
    }

    initializeData()
  }, [isInitialized, loadTemplates, loadDailyRecord, selectedDate, retryCount])

  // 🔧 Handle date changes
  useEffect(() => {
    if (isInitialized && loadDailyRecord) {
      console.log('📅 [ChecklistPage] Date changed, reloading record for:', selectedDate)
      loadDailyRecord(selectedDate)
    }
  }, [selectedDate, isInitialized, loadDailyRecord])

  // ໝວດຫມູ່
  const categories = useMemo(() => {
    const catSet = new Set<string>()
    templates.forEach((t: any) => catSet.add(t.CATEGORY))
    dailyRecord?.checklistItems?.forEach((item: any) => catSet.add(item.CATEGORY))
    return ['all', ...Array.from(catSet).filter(Boolean)]
  }, [templates, dailyRecord])

  // ລາຍການທີ່ຖືກກອງ
  const filteredChecklistItems = useMemo(() => {
    if (!dailyRecord?.checklistItems) return []

    return dailyRecord.checklistItems
      .filter((item: any) => {
        const categoryMatch = selectedCategory === 'all' || item.CATEGORY === selectedCategory

        const searchMatch =
          !searchQuery ||
          item.TITLE?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.DESCRIPTION?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.CATEGORY?.toLowerCase().includes(searchQuery.toLowerCase())

        return categoryMatch && searchMatch
      })
      .sort((a: any, b: any) => {
        // ຈັດລຳດັບ: ລາຍການຈຳເປັນກ່ອນ, ແລ້ວຕາມຊື່
        if (a.IS_REQUIRED && !b.IS_REQUIRED) return -1
        if (!a.IS_REQUIRED && b.IS_REQUIRED) return 1
        return (a.TITLE || '').localeCompare(b.TITLE || '')
      })
  }, [dailyRecord, selectedCategory, searchQuery])

  // ຈັດການໝາຍເຫດ
  const handleNotesChange = useCallback(
    (id: string, notes: string) => {
      setItemNotes((prev) => ({ ...prev, [id]: notes }))
      if (updateItemNotes) {
        updateItemNotes(id, notes)
      }
    },
    [updateItemNotes]
  )

  // ຈັດການ toggle checklist
  const handleChecklistToggle = useCallback(
    async (id: string) => {
      if (!dailyRecord || dailyRecord.STATUS !== 'draft' || !toggleChecklistItem) {
        return
      }
      await toggleChecklistItem(id)
    },
    [dailyRecord, toggleChecklistItem]
  )

  // ບັນທຶກຮ່າງ
  const handleSaveDraft = useCallback(async () => {
    try {
      if (saveDraft) {
        await saveDraft()
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [saveDraft])

  // ສົ່ງເພື່ອອະນຸມັດ
  const handleSubmit = useCallback(async () => {
    try {
      if (submitForApproval) {
        await submitForApproval()
      }
    } catch (error) {
      console.error('Failed to submit:', error)
    }
  }, [submitForApproval])

  // ລອງໃໝ່
  const handleRetry = useCallback(() => {
    if (clearError) {
      clearError()
    }
    setIsInitialized(false)
  }, [clearError])

  // ລົບການຄົ້ນຫາ
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('all')
  }, [])

  // Handle create success
  const handleCreateSuccess = useCallback(
    (newRecord: any) => {
      console.log('✅ New record created:', newRecord)
      setShowCreateModal(false)

      // Reload the daily record
      if (loadDailyRecord) {
        loadDailyRecord(newRecord.RECORD_DATE)
      }
    },
    [loadDailyRecord]
  )

  // ຄຳນວນສະຖິຕິ
  const totalItems = dailyRecord?.checklistItems?.length || 0
  const completedItems =
    dailyRecord?.checklistItems?.filter((item: any) => item.IS_COMPLETED)?.length || 0
  const isReadOnly = dailyRecord?.STATUS !== 'draft'

  // ເງື່ອນໄຂການສະແດງຜົນ
  if (!isInitialized && isLoading) {
    return (
      <LoadingSpinner
        message="ກຳລັງໂຫຼດ Checklist..."
        showProgress={true}
        progress={retryCount > 0 ? 50 : 30}
      />
    )
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={handleRetry}
        type={retryCount > 2 ? 'error' : 'warning'}
        actionText={retryCount > 2 ? 'ລອງໃໝ່' : `ລອງໃໝ່ (${retryCount + 1}/3)`}
      />
    )
  }

  if (isInitialized && !dailyRecord) {
    return (
      <>
        <EmptyState
          onReload={handleRetry}
          onCreateNew={() => setShowCreateModal(true)}
          title="ບໍ່ມີຂໍ້ມູນ Checklist"
          description={`ຍັງບໍ່ມີ checklist ສຳລັບວັນທີ່ ${new Date(selectedDate).toLocaleDateString('lo-LA')}`}
          actionText="ໂຫຼດຂໍ້ມູນໃໝ່"
          showCreateButton={true}
        />

        {showCreateModal && (
          <CreateChecklistModal
            currentUser={currentUser}
            selectedDate={selectedDate}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
      </>
    )
  }

  if (!isInitialized) {
    return (
      <EmptyState
        onReload={handleRetry}
        title="ກຳລັງເລີ່ມຕົ້ນ"
        description="ກະລຸນາລໍຖ້າໃນຂະນະທີ່ລະບົບກຳລັງເລີ່ມຕົ້ນ"
        actionText="ເລີ່ມຕົ້ນໃໝ່"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* เพิ่ม CSS animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        @keyframes pulse-success {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
          }
        }

        .animate-pulse-success {
          animation: pulse-success 1s ease-in-out;
        }
      `}</style>
      {/* ຫົວຂໍ້ */}
      <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckSquare className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Checklist ປະຈຳວັນ</h1>
                <p className="text-sm text-gray-500">
                  {dailyRecord?.RECORD_DATE
                    ? new Date(dailyRecord.RECORD_DATE).toLocaleDateString('lo-LA')
                    : new Date().toLocaleDateString('lo-LA')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {dailyRecord?.EMPLOYEE_NAME || 'ຜູ້ໃຊ້'}
                </p>
                <p className="text-sm text-gray-500">{dailyRecord?.POSITION || ''}</p>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  dailyRecord?.STATUS === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : dailyRecord?.STATUS === 'submitted'
                      ? 'bg-yellow-100 text-yellow-800'
                      : dailyRecord?.STATUS === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {dailyRecord?.STATUS === 'approved'
                  ? 'ອະນຸມັດແລ້ວ'
                  : dailyRecord?.STATUS === 'submitted'
                    ? 'ລໍຖ້າການອະນຸມັດ'
                    : dailyRecord?.STATUS === 'rejected'
                      ? 'ປະຕິເສດ'
                      : 'ຮ່າງ'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full py-8">
        {/* ພາກສ່ວນຄວາມຄືບໜ້າ */}
        <ProgressSection
          completionPercentage={completionPercentage}
          completedItems={completedItems}
          totalItems={totalItems}
          completedTime={completedTime}
          totalEstimatedTime={totalEstimatedTime}
          requiredCompletion={requiredItemsCompletion}
        />

        {/* ພາກສ່ວນກອງຕົວ */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalItems={totalItems}
          filteredItems={filteredChecklistItems.length}
        />

        {/* ລາຍການ Checklist */}
        <div className="space-y-6">
          {filteredChecklistItems.length > 0 ? (
            filteredChecklistItems.map((item: any) => (
              <ChecklistItem
                key={item.CHECKLIST_ID || item.ID}
                item={item}
                isReadOnly={isReadOnly}
                itemNotes={itemNotes}
                onToggle={handleChecklistToggle}
                onNotesChange={handleNotesChange}
                isUpdating={isUpdating}
              />
            ))
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <CheckSquare className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">ບໍ່ມີ Checklist</h3>
              <p className="mb-4 text-gray-500">
                {searchQuery || selectedCategory !== 'all'
                  ? 'ບໍ່ພົບລາຍການທີ່ຕົງຕາມເງື່ອນໄຂການຄົ້ນຫາ'
                  : 'ບໍ່ມີລາຍການ checklist ສຳລັບວັນທີ່ເລືອກ'}
              </p>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  onClick={handleClearSearch}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
                >
                  ລຶບການຄົ້ນຫາ
                </button>
              )}
            </div>
          )}
        </div>

        {/* ປຸ່ມການກະທຳ */}
        {!isReadOnly && (
          <div className="sticky bottom-4 z-20 mt-8 flex justify-end gap-4">
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting || isUpdating}
              className="flex items-center gap-2 rounded-xl bg-gray-600 px-6 py-3 text-white shadow-lg transition-all duration-200 hover:bg-gray-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              ບັນທຶກຮ່າງ
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUpdating || !canSubmit}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              ສົ່ງເພື່ອອະນຸມັດ
              {!canSubmit && requiredItemsCompletion.total > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-2 py-1 text-xs">ຍັງບໍ່ຄົບ</span>
              )}
            </button>
          </div>
        )}

        {/* ແຖບໂຫຼດ */}
        {(isSubmitting || isUpdating) && (
          <div className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">
              {isSubmitting ? 'ກຳລັງສົ່ງ...' : 'ກຳລັງອັບເດດ...'}
            </span>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateChecklistModal
          currentUser={currentUser}
          selectedDate={selectedDate}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}

export default ChecklistPage
