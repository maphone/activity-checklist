import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  CheckSquare,
  ClipboardCheck,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
} from 'lucide-react'

import { useChecklist } from '../hooks/useChecklists'
import { useSimpleToast } from '../hooks/useToastContext'
import { DailyChecklist, ApprovalList, Badge, LoadingSpinner } from './ChecklistComponents'
import {
  DailyChecklistRecord,
  ChecklistAnalytics,
  UpdateChecklistItemData,
  SubmitDailyRecordData,
  ProcessApprovalData,
  ChecklistComponentProps,
} from '../types/checklist-types'

// ===== ANALYTICS DASHBOARD =====

interface AnalyticsDashboardProps {
  analytics: ChecklistAnalytics | null
  isLoading: boolean
  dateRange: { startDate: string; endDate: string }
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  isLoading,
  dateRange,
  onDateRangeChange,
}) => {
  const handleDateChange = useCallback(
    (field: 'startDate' | 'endDate', value: string) => {
      onDateRangeChange({
        ...dateRange,
        [field]: value,
      })
    },
    [dateRange, onDateRangeChange]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">ກຳລັງໂຫຼດຂໍ້ມູນ...</span>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="py-12 text-center">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">ບໍ່ມີຂໍ້ມູນສະຖິຕິ</h3>
        <p className="text-gray-600">ເລືອກຊ່ວງວັນທີ່ເພື່ອເບິ່ງສະຖິຕິ</p>
      </div>
    )
  }

  const { overall, categoryStats, dailyTrends } = analytics

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">ຊ່ວງວັນທີ່:</span>
          </div>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="rounded border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <span className="text-gray-500">ຫາ</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="rounded border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">ທັງໝົດ</p>
              <p className="text-2xl font-bold text-gray-900">{overall.total_records}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">ລໍຖ້າອະນຸມັດ</p>
              <p className="text-2xl font-bold text-yellow-600">{overall.pending_approvals}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">ອະນຸມັດແລ້ວ</p>
              <p className="text-2xl font-bold text-green-600">{overall.approved_records}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">ຊົ່ວໂມງເຉລີ່ຍ</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(overall.avg_working_hours * 100) / 100}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">ອັດຕາສຳເລັດຕາມໝວດໝູ່</h3>
        <div className="space-y-4">
          {categoryStats.map((category) => (
            <div key={category.CATEGORY} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {category.category_name_lo}
                  </span>
                  <span className="text-sm text-gray-600">
                    {category.completed_items}/{category.total_items} (
                    {Math.round(category.completion_rate)}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${category.completion_rate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Trends */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">ແນວໂນ້ມປະຈຳວັນ</h3>
        <div className="space-y-3">
          {dailyTrends.slice(0, 10).map((trend) => (
            <div
              key={trend.RECORD_DATE}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
            >
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(trend.RECORD_DATE).toLocaleDateString('lo-LA')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-gray-600">{trend.total_records} ລາຍການ</div>
                <div className="text-green-600">{trend.approved_count} ອະນຸມັດ</div>
                <div className="text-blue-600">{Math.round(trend.avg_completion_rate)}% ສຳເລັດ</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===== MAIN CHECKLIST PAGE =====

interface ChecklistTabProps {
  selectedDate: string
  currentUser: ChecklistComponentProps['currentUser']
}

// User Checklist Tab
const UserChecklistTab: React.FC<ChecklistTabProps> = ({ selectedDate, currentUser }) => {
  const checklistHook = useChecklist({
    initialDate: selectedDate,
    autoFetch: true,
    enableOptimisticUpdates: true,
  })

  const { success, error: showError } = useSimpleToast()

  // Load daily record when date changes
  useEffect(() => {
    checklistHook.loadDailyRecord(selectedDate)
  }, [selectedDate])

  const handleUpdateItem = useCallback(
    async (checklistId: string, data: UpdateChecklistItemData) => {
      try {
        await checklistHook.updateChecklistItem(checklistId, data)
        success('ອັບເດດລາຍການສຳເລັດ')
      } catch (error: any) {
        showError(error.message || 'ອັບເດດລາຍການບໍ່ສຳເລັດ')
      }
    },
    [checklistHook, success, showError]
  )

  const handleSubmit = useCallback(
    async (data: SubmitDailyRecordData) => {
      try {
        await checklistHook.submitDailyRecord(data)
        success('ສົ່ງ checklist ສຳເລັດແລ້ວ')
      } catch (error: any) {
        showError(error.message || 'ສົ່ງ checklist ບໍ່ສຳເລັດ')
      }
    },
    [checklistHook, success, showError]
  )

  if (checklistHook.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">ກຳລັງໂຫຼດ checklist...</span>
      </div>
    )
  }

  if (checklistHook.error) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">ເກີດຂໍ້ຜິດພາດ</h3>
        <p className="mb-4 text-gray-600">{checklistHook.error}</p>
        <button
          onClick={checklistHook.refresh}
          className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          ລອງໃໝ່
        </button>
      </div>
    )
  }

  if (!checklistHook.dailyRecord) {
    return (
      <div className="py-12 text-center">
        <CheckSquare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">ບໍ່ມີ checklist ສຳລັບວັນນີ້</h3>
        <p className="text-gray-600">ຍັງບໍ່ມີລາຍການ checklist ສຳລັບວັນທີ່ເລືອກ</p>
      </div>
    )
  }

  return (
    <DailyChecklist
      record={checklistHook.dailyRecord}
      onUpdateItem={handleUpdateItem}
      onSubmit={handleSubmit}
      isSubmitting={checklistHook.isSubmitting}
      disabled={false}
    />
  )
}

// Approval Tab
const ApprovalTab: React.FC<ChecklistTabProps> = ({ selectedDate, currentUser }) => {
  const checklistHook = useChecklist({
    autoFetch: false,
    enableOptimisticUpdates: true,
  })

  const { success, error: showError } = useSimpleToast()

  // Load pending approvals on mount and when needed
  useEffect(() => {
    checklistHook.loadPendingApprovals()
  }, [])

  const handleApprove = useCallback(
    async (recordId: string, comments?: string) => {
      try {
        const data: ProcessApprovalData = { action: 'approve', comments }
        await checklistHook.processApproval(recordId, data)
        success('ອະນຸມັດ checklist ສຳເລັດແລ້ວ')
      } catch (error: any) {
        showError(error.message || 'ອະນຸມັດ checklist ບໍ່ສຳເລັດ')
      }
    },
    [checklistHook, success, showError]
  )

  const handleReject = useCallback(
    async (recordId: string, comments?: string) => {
      try {
        const data: ProcessApprovalData = { action: 'reject', comments }
        await checklistHook.processApproval(recordId, data)
        success('ປະຕິເສດ checklist ສຳເລັດແລ້ວ')
      } catch (error: any) {
        showError(error.message || 'ປະຕິເສດ checklist ບໍ່ສຳເລັດ')
      }
    },
    [checklistHook, success, showError]
  )

  const handleRequestRevision = useCallback(
    async (recordId: string, comments?: string) => {
      try {
        const data: ProcessApprovalData = { action: 'request_revision', comments }
        await checklistHook.processApproval(recordId, data)
        success('ຂໍໃຫ້ແກ້ໄຂ checklist ສຳເລັດແລ້ວ')
      } catch (error: any) {
        showError(error.message || 'ຂໍໃຫ້ແກ້ໄຂ checklist ບໍ່ສຳເລັດ')
      }
    },
    [checklistHook, success, showError]
  )

  const handleRefresh = useCallback(() => {
    checklistHook.loadPendingApprovals()
  }, [checklistHook])

  return (
    <ApprovalList
      records={checklistHook.pendingApprovals}
      isLoading={checklistHook.isLoading}
      onApprove={handleApprove}
      onReject={handleReject}
      onRequestRevision={handleRequestRevision}
      onRefresh={handleRefresh}
    />
  )
}

// Analytics Tab
const AnalyticsTab: React.FC<ChecklistTabProps> = ({ selectedDate, currentUser }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0],
  })

  const checklistHook = useChecklist({
    autoFetch: false,
  })

  const { success, error: showError } = useSimpleToast()

  // Load analytics when date range changes
  useEffect(() => {
    const filters = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }
    checklistHook.loadAnalytics(filters)
  }, [dateRange])

  const handleDateRangeChange = useCallback((newRange: { startDate: string; endDate: string }) => {
    setDateRange(newRange)
  }, [])

  return (
    <AnalyticsDashboard
      analytics={checklistHook.analytics}
      isLoading={checklistHook.isLoading}
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
    />
  )
}

// ===== MAIN COMPONENT =====

const MainChecklistPage: React.FC<ChecklistComponentProps> = ({ selectedDate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'user' | 'approval' | 'analytics'>('user')

  // Check if user can access approval tab (you might want to add role-based logic here)
  const canApprove =
    currentUser?.positionname?.toLowerCase().includes('manager') ||
    currentUser?.positionname?.toLowerCase().includes('supervisor') ||
    currentUser?.positionname?.toLowerCase().includes('head')

  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: 'user' as const,
        label: 'Checklist ຂອງຂ້ອຍ',
        icon: CheckSquare,
        description: 'ຈັດການ checklist ປະຈຳວັນຂອງທ່ານ',
      },
    ]

    if (canApprove) {
      baseTabs.push({
        id: 'approval' as const,
        label: 'ການອະນຸມັດ',
        icon: ClipboardCheck,
        description: 'ອະນຸມັດ checklist ຂອງພະນັກງານ',
      })
    }

    baseTabs.push({
      id: 'analytics' as const,
      label: 'ສະຖິຕິ',
      icon: TrendingUp,
      description: 'ເບິ່ງສະຖິຕິແລະການວິເຄາະ',
    })

    return baseTabs
  }, [canApprove])

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">ລະບົບ Checklist</h1>
                <p className="text-gray-600">ຈັດການແລະຕິດຕາມ checklist ປະຈຳວັນ</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-sm text-gray-600">
                  <div className="mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedDate).toLocaleDateString('lo-LA')}</span>
                  </div>
                  {currentUser && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {currentUser.firstName} {currentUser.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 border-b-2 px-2 py-4 text-sm font-medium transition-all ${
                        isActive
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`}
                      />
                      <span>{tab.label}</span>
                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Description */}
            {activeTabConfig && (
              <div className="bg-gray-50 px-6 py-3">
                <p className="text-sm text-gray-600">{activeTabConfig.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          {activeTab === 'user' && (
            <UserChecklistTab selectedDate={selectedDate} currentUser={currentUser} />
          )}

          {activeTab === 'approval' && canApprove && (
            <ApprovalTab selectedDate={selectedDate} currentUser={currentUser} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab selectedDate={selectedDate} currentUser={currentUser} />
          )}
        </div>

        {/* Quick Actions Floating Button */}
        <div className="fixed right-6 bottom-6 z-40">
          <div className="relative">
            {/* Notification Badge */}
            {canApprove && activeTab !== 'approval' && (
              <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                3
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-700"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainChecklistPage
