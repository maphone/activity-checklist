import React, { useState, useCallback, useMemo } from 'react'
import {
  CheckSquare,
  Square,
  Clock,
  CheckCircle,
  MessageSquare,
  Calendar,
  User,
  Building,
  Send,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
} from 'lucide-react'

import {
  DailyChecklistRecord,
  DailyChecklistItem,
  ChecklistTemplate,
  ChecklistCategory,
  ProcessApprovalData,
  UpdateChecklistItemData,
  SubmitDailyRecordData,
} from '../types/checklist-types'

// ===== UTILITY COMPONENTS =====

interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizes[size]} ${className}`}
    />
  )
}

// ===== CHECKLIST ITEM COMPONENT =====

interface ChecklistItemCardProps {
  item: DailyChecklistItem
  onToggle: (checklistId: string, completed: boolean) => Promise<void>
  onUpdateNotes: (checklistId: string, notes: string) => Promise<void>
  isUpdating?: boolean
  disabled?: boolean
}

const ChecklistItemCard: React.FC<ChecklistItemCardProps> = ({
  item,
  onToggle,
  onUpdateNotes,
  isUpdating = false,
  disabled = false,
}) => {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(item.NOTES || '')
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false)

  const handleToggle = useCallback(async () => {
    if (disabled || isUpdating) return
    await onToggle(item.CHECKLIST_ID, !item.IS_COMPLETED)
  }, [item.CHECKLIST_ID, item.IS_COMPLETED, onToggle, disabled, isUpdating])

  const handleNotesSubmit = useCallback(async () => {
    if (notes.trim() === (item.NOTES || '').trim()) {
      setShowNotes(false)
      return
    }

    setIsSubmittingNotes(true)
    try {
      await onUpdateNotes(item.CHECKLIST_ID, notes.trim())
      setShowNotes(false)
    } catch (error) {
      // Reset notes on error
      setNotes(item.NOTES || '')
    } finally {
      setIsSubmittingNotes(false)
    }
  }, [item.CHECKLIST_ID, item.NOTES, notes, onUpdateNotes])

  const categoryColor = item.color || '#6B7280'
  const isRequired = item.IS_REQUIRED

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-200 ${
        item.IS_COMPLETED ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
      } ${disabled ? 'opacity-60' : 'hover:shadow-md'}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={disabled || isUpdating}
          className={`mt-1 rounded p-1 transition-colors ${
            disabled || isUpdating
              ? 'cursor-not-allowed'
              : 'hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'
          }`}
        >
          {isUpdating ? (
            <LoadingSpinner size="sm" />
          ) : item.IS_COMPLETED ? (
            <CheckSquare className="h-5 w-5 text-green-600" />
          ) : (
            <Square className="h-5 w-5 text-gray-400" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={`font-medium text-gray-900 ${item.IS_COMPLETED ? 'text-gray-500 line-through' : ''}`}
              >
                {item.TITLE}
                {isRequired && <span className="ml-1 text-red-500">*</span>}
              </h4>
              {item.DESCRIPTION && <p className="mt-1 text-sm text-gray-600">{item.DESCRIPTION}</p>}
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {item.ESTIMATED_TIME && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{item.ESTIMATED_TIME}ນາທີ</span>
                </div>
              )}
              {item.category_name_lo && (
                <Badge variant="default" className="text-xs">
                  <div
                    className="mr-1 h-2 w-2 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  {item.category_name_lo}
                </Badge>
              )}
            </div>
          </div>

          {/* Completion Info */}
          {item.IS_COMPLETED && item.COMPLETION_TIME && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>ສຳເລັດແລ້ວເມື່ອ: {new Date(item.COMPLETION_TIME).toLocaleString('lo-LA')}</span>
            </div>
          )}

          {/* Notes Section */}
          <div className="mt-3">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              disabled={disabled}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{item.NOTES ? 'ແກ້ໄຂໝາຍເຫດ' : 'ເພີ່ມໝາຍເຫດ'}</span>
              {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showNotes && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ເພີ່ມໝາຍເຫດ..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                  disabled={disabled || isSubmittingNotes}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setNotes(item.NOTES || '')
                      setShowNotes(false)
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                    disabled={isSubmittingNotes}
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    onClick={handleNotesSubmit}
                    disabled={isSubmittingNotes}
                    className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmittingNotes && <LoadingSpinner size="sm" />}
                    ບັນທຶກ
                  </button>
                </div>
              </div>
            )}

            {item.NOTES && !showNotes && (
              <div className="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-600">{item.NOTES}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== DAILY CHECKLIST COMPONENT =====

interface DailyChecklistProps {
  record: DailyChecklistRecord
  onUpdateItem: (checklistId: string, data: UpdateChecklistItemData) => Promise<void>
  onSubmit: (data: SubmitDailyRecordData) => Promise<void>
  isSubmitting?: boolean
  disabled?: boolean
}

const DailyChecklist: React.FC<DailyChecklistProps> = ({
  record,
  onUpdateItem,
  onSubmit,
  isSubmitting = false,
  disabled = false,
}) => {
  const [workingHours, setWorkingHours] = useState(record.TOTAL_WORKING_HOURS?.toString() || '8')
  const [generalNotes, setGeneralNotes] = useState(record.NOTES || '')
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  // Compute statistics
  const stats = useMemo(() => {
    if (!record.checklistItems) return { total: 0, completed: 0, completionRate: 0 }

    const total = record.checklistItems.length
    const completed = record.checklistItems.filter((item) => item.IS_COMPLETED).length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return { total, completed, completionRate }
  }, [record.checklistItems])

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!record.checklistItems) return []

    const groups = record.checklistItems.reduce(
      (acc, item) => {
        const category = item.category_name_lo || 'ອື່ນໆ'
        if (!acc[category]) {
          acc[category] = {
            name: category,
            color: item.color || '#6B7280',
            icon: item.icon,
            items: [],
          }
        }
        acc[category].items.push(item)
        return acc
      },
      {} as Record<
        string,
        { name: string; color: string; icon?: string; items: DailyChecklistItem[] }
      >
    )

    return Object.values(groups)
  }, [record.checklistItems])

  const handleToggleItem = useCallback(
    async (checklistId: string, completed: boolean) => {
      setUpdatingItems((prev) => new Set(prev).add(checklistId))
      try {
        await onUpdateItem(checklistId, { is_completed: completed })
      } finally {
        setUpdatingItems((prev) => {
          const newSet = new Set(prev)
          newSet.delete(checklistId)
          return newSet
        })
      }
    },
    [onUpdateItem]
  )

  const handleUpdateNotes = useCallback(
    async (checklistId: string, notes: string) => {
      setUpdatingItems((prev) => new Set(prev).add(checklistId))
      try {
        await onUpdateItem(checklistId, { is_completed: true, notes }) // Assume completing when adding notes
      } finally {
        setUpdatingItems((prev) => {
          const newSet = new Set(prev)
          newSet.delete(checklistId)
          return newSet
        })
      }
    },
    [onUpdateItem]
  )

  const handleSubmit = useCallback(async () => {
    const data: SubmitDailyRecordData = {
      total_working_hours: parseFloat(workingHours) || 0,
      notes: generalNotes.trim() || undefined,
    }

    await onSubmit(data)
    setShowSubmitForm(false)
  }, [workingHours, generalNotes, onSubmit])

  const canSubmit = record.STATUS === 'draft' && !disabled
  const isReadOnly = record.STATUS !== 'draft' || disabled

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Checklist ປະຈຳວັນ</h2>
            <p className="mt-1 text-sm text-gray-600">
              {new Date(record.RECORD_DATE).toLocaleDateString('lo-LA')} • {record.EMPLOYEE_NAME}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(stats.completionRate)}%
            </div>
            <div className="text-sm text-gray-500">
              {stats.completed}/{stats.total} ສຳເລັດ
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge
              variant={
                record.STATUS === 'approved'
                  ? 'success'
                  : record.STATUS === 'rejected'
                    ? 'error'
                    : record.STATUS === 'submitted'
                      ? 'warning'
                      : 'default'
              }
            >
              {record.STATUS === 'draft' && 'ແບບຮ່າງ'}
              {record.STATUS === 'submitted' && 'ສົ່ງແລ້ວ'}
              {record.STATUS === 'approved' && 'ອະນຸມັດແລ້ວ'}
              {record.STATUS === 'rejected' && 'ປະຕິເສດ'}
            </Badge>

            {record.TOTAL_WORKING_HOURS > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{record.TOTAL_WORKING_HOURS} ຊົ່ວໂມງ</span>
              </div>
            )}
          </div>

          {canSubmit && stats.total > 0 && (
            <button
              onClick={() => setShowSubmitForm(true)}
              disabled={isSubmitting || stats.completed === 0}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              ສົ່ງເພື່ອອະນຸມັດ
            </button>
          )}
        </div>
      </div>

      {/* Checklist Items by Category */}
      {groupedItems.map((group) => (
        <div key={group.name} className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
              <h3 className="font-medium text-gray-900">{group.name}</h3>
              <Badge variant="default" className="ml-auto">
                {group.items.filter((item) => item.IS_COMPLETED).length}/{group.items.length}
              </Badge>
            </div>
          </div>

          <div className="space-y-4 p-4">
            {group.items.map((item) => (
              <ChecklistItemCard
                key={item.ID}
                item={item}
                onToggle={handleToggleItem}
                onUpdateNotes={handleUpdateNotes}
                isUpdating={updatingItems.has(item.CHECKLIST_ID)}
                disabled={isReadOnly}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              ສົ່ງ Checklist ເພື່ອອະນຸມັດ
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ຊົ່ວໂມງການເຮັດວຽກທັງໝົດ
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ໝາຍເຫດທົ່ວໄປ (ຖ້າມີ)
                </label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="ໝາຍເຫດຫຼືຄຳອະທິບາຍເພີ່ມເຕີມ..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
                disabled={isSubmitting}
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting && <LoadingSpinner size="sm" />}
                ສົ່ງເພື່ອອະນຸມັດ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!record.checklistItems || record.checklistItems.length === 0) && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <CheckSquare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">ບໍ່ມີ Checklist ສຳລັບວັນນີ້</h3>
          <p className="text-gray-600">ຍັງບໍ່ມີລາຍການ checklist ສຳລັບວັນທີ່ເລືອກ</p>
        </div>
      )}
    </div>
  )
}

// ===== APPROVAL LIST COMPONENT =====

interface ApprovalCardProps {
  record: DailyChecklistRecord
  onApprove: (recordId: string, comments?: string) => Promise<void>
  onReject: (recordId: string, comments?: string) => Promise<void>
  onRequestRevision: (recordId: string, comments?: string) => Promise<void>
  isProcessing?: boolean
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({
  record,
  onApprove,
  onReject,
  onRequestRevision,
  isProcessing = false,
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [selectedAction, setSelectedAction] = useState<
    'approve' | 'reject' | 'request_revision' | null
  >(null)
  const [comments, setComments] = useState('')

  const handleAction = useCallback(async (action: 'approve' | 'reject' | 'request_revision') => {
    setSelectedAction(action)
    setShowCommentForm(true)
  }, [])

  const handleSubmitAction = useCallback(async () => {
    if (!selectedAction) return

    try {
      switch (selectedAction) {
        case 'approve':
          await onApprove(record.ID, comments.trim() || undefined)
          break
        case 'reject':
          await onReject(record.ID, comments.trim() || undefined)
          break
        case 'request_revision':
          await onRequestRevision(record.ID, comments.trim() || undefined)
          break
      }

      setShowCommentForm(false)
      setSelectedAction(null)
      setComments('')
    } catch (error) {
      // Error handling is done in parent component
    }
  }, [selectedAction, comments, record.ID, onApprove, onReject, onRequestRevision])

  const completionRate = record.total_items
    ? Math.round((record.completed_items! / record.total_items) * 100)
    : 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">{record.EMPLOYEE_NAME}</span>
            <Badge variant="default">{record.POSITION}</Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(record.RECORD_DATE).toLocaleDateString('lo-LA')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              <span>{record.BRANCH_NAME}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{record.TOTAL_WORKING_HOURS} ຊົ່ວໂມງ</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="mb-1 text-lg font-semibold text-blue-600">{completionRate}%</div>
          <div className="text-sm text-gray-500">
            {record.completed_items}/{record.total_items} ສຳເລັດ
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${completionRate}%` }} />
      </div>

      {/* Notes */}
      {record.NOTES && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="text-sm text-gray-700">{record.NOTES}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Eye className="h-4 w-4" />
          {showDetails ? 'ເຊື່ອງລາຍລະອຽດ' : 'ເບິ່ງລາຍລະອຽດ'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => handleAction('request_revision')}
            disabled={isProcessing}
            className="rounded border border-yellow-300 px-3 py-1 text-sm text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
          >
            ຂໍແກ້ໄຂ
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={isProcessing}
            className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            ປະຕິເສດ
          </button>
          <button
            onClick={() => handleAction('approve')}
            disabled={isProcessing}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            ອະນຸມັດ
          </button>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              ສົ່ງເມື່ອ:{' '}
              {record.SUBMITTED_AT ? new Date(record.SUBMITTED_AT).toLocaleString('lo-LA') : '-'}
            </div>
            <div>ສ້າງເມື່ອ: {new Date(record.CREATED_AT).toLocaleString('lo-LA')}</div>
            {record.UPDATED_AT !== record.CREATED_AT && (
              <div>ແກ້ໄຂຄັ້ງສຸດທ້າຍ: {new Date(record.UPDATED_AT).toLocaleString('lo-LA')}</div>
            )}
          </div>
        </div>
      )}

      {/* Comment Form Modal */}
      {showCommentForm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {selectedAction === 'approve' && 'ອະນຸມັດ Checklist'}
              {selectedAction === 'reject' && 'ປະຕິເສດ Checklist'}
              {selectedAction === 'request_revision' && 'ຂໍໃຫ້ແກ້ໄຂ Checklist'}
            </h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ຄຳຄິດເຫັນ {selectedAction !== 'approve' && '(ບັງຄັບ)'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={
                  selectedAction === 'approve'
                    ? 'ຄຳຄິດເຫັນເພີ່ມເຕີມ...'
                    : selectedAction === 'reject'
                      ? 'ເຫດຜົນການປະຕິເສດ...'
                      : 'ສິ່ງທີ່ຕ້ອງແກ້ໄຂ...'
                }
                required={selectedAction !== 'approve'}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCommentForm(false)
                  setSelectedAction(null)
                  setComments('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
                disabled={isProcessing}
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={isProcessing || (selectedAction !== 'approve' && !comments.trim())}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing && <LoadingSpinner size="sm" />}
                ຢືນຢັນ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ApprovalListProps {
  records: DailyChecklistRecord[]
  isLoading?: boolean
  onApprove: (recordId: string, comments?: string) => Promise<void>
  onReject: (recordId: string, comments?: string) => Promise<void>
  onRequestRevision: (recordId: string, comments?: string) => Promise<void>
  onRefresh?: () => void
}

const ApprovalList: React.FC<ApprovalListProps> = ({
  records,
  isLoading = false,
  onApprove,
  onReject,
  onRequestRevision,
  onRefresh,
}) => {
  const [processingRecords, setProcessingRecords] = useState<Set<string>>(new Set())

  const handleApprove = useCallback(
    async (recordId: string, comments?: string) => {
      setProcessingRecords((prev) => new Set(prev).add(recordId))
      try {
        await onApprove(recordId, comments)
      } finally {
        setProcessingRecords((prev) => {
          const newSet = new Set(prev)
          newSet.delete(recordId)
          return newSet
        })
      }
    },
    [onApprove]
  )

  const handleReject = useCallback(
    async (recordId: string, comments?: string) => {
      setProcessingRecords((prev) => new Set(prev).add(recordId))
      try {
        await onReject(recordId, comments)
      } finally {
        setProcessingRecords((prev) => {
          const newSet = new Set(prev)
          newSet.delete(recordId)
          return newSet
        })
      }
    },
    [onReject]
  )

  const handleRequestRevision = useCallback(
    async (recordId: string, comments?: string) => {
      setProcessingRecords((prev) => new Set(prev).add(recordId))
      try {
        await onRequestRevision(recordId, comments)
      } finally {
        setProcessingRecords((prev) => {
          const newSet = new Set(prev)
          newSet.delete(recordId)
          return newSet
        })
      }
    },
    [onRequestRevision]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">ກຳລັງໂຫຼດ...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">ລາຍການລໍຖ້າອະນຸມັດ</h2>
          <p className="mt-1 text-gray-600">{records.length} ລາຍການລໍຖ້າການອະນຸມັດ</p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            ອັບເດດ
          </button>
        )}
      </div>

      {/* Records */}
      <div className="space-y-4">
        {records.map((record) => (
          <ApprovalCard
            key={record.ID}
            record={record}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestRevision={handleRequestRevision}
            isProcessing={processingRecords.has(record.ID)}
          />
        ))}
      </div>

      {/* Empty State */}
      {records.length === 0 && (
        <div className="py-12 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">ບໍ່ມີລາຍການລໍຖ້າອະນຸມັດ</h3>
          <p className="text-gray-600">ທຸກລາຍການ checklist ໄດ້ຮັບການອະນຸມັດແລ້ວ</p>
        </div>
      )}
    </div>
  )
}

export { DailyChecklist, ApprovalList, ChecklistItemCard, Badge, LoadingSpinner }
