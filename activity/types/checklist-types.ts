// ===== CHECKLIST TYPES =====

export interface ChecklistCategory {
  id: number
  category_code: string
  category_name_lo: string
  category_name_en?: string
  category_name_th?: string
  description?: string
  icon?: string
  color?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChecklistTemplate {
  ID: string
  TEMPATES_ID: string
  TITLE: string
  DESCRIPTION?: string
  CATEGORY: string
  POSITION: string
  IS_REQUIRED: boolean
  FREQUENCY: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ESTIMATED_TIME: number
  SERIES_NO: number
  STATUS: 'active' | 'inactive'
  CREATED_AT: string
  UPDATED_AT: string
  // Joined fields
  category_name_lo?: string
  category_name_en?: string
  icon?: string
  color?: string
}

export interface ChecklistSchedule {
  id: number
  template_id: string
  branch_id: number
  assigned_user_id?: number
  scheduled_date: string
  due_time: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  created_at: string
  updated_at: string
  // Joined fields
  template_title?: string
  template_description?: string
  CATEGORY?: string
  ESTIMATED_TIME?: number
  BRANCH_NAME?: string
  BRANCH_CODE?: string
  F_NAME?: string
  L_NAME?: string
  P_SITION?: string
  category_name_lo?: string
  icon?: string
  color?: string
}

export interface ChecklistResponse {
  id: number
  schedule_id: number
  template_id: string
  branch_id: number
  respondent_user_id: number
  response_date: string
  result: 'pass' | 'fail' | 'partial' | 'not_applicable'
  score?: number
  comments?: string
  issues_found?: string
  corrective_actions?: string
  evidence_files?: string[]
  review_status: 'pending' | 'approved' | 'rejected' | 'requires_revision'
  reviewed_by?: number
  reviewed_at?: string
  reviewer_comments?: string
  created_at: string
  updated_at: string
  // Joined fields
  template_title?: string
  CATEGORY?: string
  ESTIMATED_TIME?: number
  BRANCH_NAME?: string
  BRANCH_CODE?: string
  respondent_fname?: string
  respondent_lname?: string
  respondent_position?: string
  reviewer_fname?: string
  reviewer_lname?: string
  category_name_lo?: string
  icon?: string
  color?: string
}

export interface DailyChecklistRecord {
  ID: string
  UDID: string
  RECORD_DATE: string
  EMPLOYEE_NAME?: string
  POSITION?: string
  BRANCH_CODE?: string
  BRANCH_NAME?: string
  TOTAL_WORKING_HOURS: number
  NOTES?: string
  STATUS: 'draft' | 'submitted' | 'approved' | 'rejected'
  SUBMITTED_AT?: string
  APPROVED_AT?: string
  REJECTED_AT?: string
  REVIEWED_BY?: string
  CREATED_AT: string
  UPDATED_AT: string
  // Nested data
  checklistItems?: DailyChecklistItem[]
  // Summary fields
  total_items?: number
  completed_items?: number
  completion_percentage?: number
}

export interface DailyChecklistItem {
  ID: string
  RECORD_ID: string
  CHECKLIST_ID: string
  IS_COMPLETED: boolean
  COMPLETION_TIME?: string
  NOTES?: string
  CREATED_AT: string
  UPDATED_AT: string
  // Joined fields
  TITLE?: string
  DESCRIPTION?: string
  CATEGORY?: string
  IS_REQUIRED?: boolean
  ESTIMATED_TIME?: number
  category_name_lo?: string
  icon?: string
  color?: string
}

export interface ChecklistApproval {
  ID: string
  RECORD_ID: string
  APPROVER_UDID: string
  APPROVER_NAME?: string
  ACTION: 'approve' | 'reject' | 'request_revision'
  COMMENTS?: string
  ACTION_DATE: string
}

// ===== REQUEST/RESPONSE TYPES =====

export interface CreateChecklistResponseData {
  schedule_id: number
  template_id: string
  branch_id: number
  response_date?: string
  result: 'pass' | 'fail' | 'partial' | 'not_applicable'
  score?: number
  comments?: string
  issues_found?: string
  corrective_actions?: string
  evidence_files?: string[]
}

export interface UpdateChecklistItemData {
  is_completed: boolean
  notes?: string
}

export interface SubmitDailyRecordData {
  total_working_hours?: number
  notes?: string
}

export interface ProcessApprovalData {
  action: 'approve' | 'reject' | 'request_revision'
  comments?: string
}

export interface UpdateReviewStatusData {
  review_status: 'pending' | 'approved' | 'rejected' | 'requires_revision'
  reviewer_comments?: string
}

// ===== ANALYTICS TYPES =====

export interface ChecklistAnalytics {
  overall: {
    total_records: number
    pending_approvals: number
    approved_records: number
    rejected_records: number
    avg_working_hours: number
  }
  categoryStats: {
    CATEGORY: string
    category_name_lo: string
    total_items: number
    completed_items: number
    completion_rate: number
  }[]
  dailyTrends: {
    RECORD_DATE: string
    total_records: number
    approved_count: number
    avg_completion_rate: number
  }[]
}

// ===== FILTER TYPES =====

export interface ChecklistFilters {
  category?: string
  position?: string
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  date?: string
  branch_id?: number
  status?: string
  assigned_user_id?: number
  result?: 'pass' | 'fail' | 'partial' | 'not_applicable'
  review_status?: 'pending' | 'approved' | 'rejected' | 'requires_revision'
  respondent_user_id?: number
  startDate?: string
  endDate?: string
  branchId?: number
}

// ===== PAGINATION TYPES =====

export interface ChecklistPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ===== API RESPONSE TYPES =====

export interface ChecklistApiResponse<T> {
  success: boolean
  data?: T
  message: string
  pagination?: ChecklistPagination
}

// ===== COMPONENT PROPS TYPES =====

export interface ChecklistComponentProps {
  selectedDate: string
  currentUser?: {
    udid: string
    firstName: string
    lastName: string
    positionname: string
    branchCode: string
    branchName: string
  } | null
}

export interface ChecklistFormProps {
  template: ChecklistTemplate
  initialData?: Partial<CreateChecklistResponseData>
  onSubmit: (data: CreateChecklistResponseData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export interface ApprovalListProps {
  records: DailyChecklistRecord[]
  isLoading?: boolean
  onApprove: (recordId: string, comments?: string) => Promise<void>
  onReject: (recordId: string, comments?: string) => Promise<void>
  onRequestRevision: (recordId: string, comments?: string) => Promise<void>
  pagination?: ChecklistPagination
  onPageChange?: (page: number) => void
}

// ===== HOOK TYPES =====

export interface UseChecklistOptions {
  initialDate?: string
  autoFetch?: boolean
  enableOptimisticUpdates?: boolean
}

export interface UseChecklistReturn {
  // Data
  dailyRecord: DailyChecklistRecord | null
  templates: ChecklistTemplate[]
  categories: ChecklistCategory[]
  responses: ChecklistResponse[]
  pendingApprovals: DailyChecklistRecord[]
  analytics: ChecklistAnalytics | null

  // Loading states
  isLoading: boolean
  isSubmitting: boolean

  // Error states
  error: string | null

  // Methods
  loadDailyRecord: (date: string) => Promise<void>
  loadTemplates: () => Promise<void>
  loadCategories: () => Promise<void>
  updateChecklistItem: (checklistId: string, data: UpdateChecklistItemData) => Promise<void>
  submitDailyRecord: (data: SubmitDailyRecordData) => Promise<void>
  loadPendingApprovals: () => Promise<void>
  processApproval: (recordId: string, data: ProcessApprovalData) => Promise<void>
  loadAnalytics: (filters?: ChecklistFilters) => Promise<void>

  // Utility methods
  refresh: () => Promise<void>
  clearError: () => void
}

// ===== UTILITY TYPES =====

export type ChecklistItemStatus = 'pending' | 'completed' | 'skipped'
export type ChecklistPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ChecklistFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type ChecklistResult = 'pass' | 'fail' | 'partial' | 'not_applicable'
export type ChecklistReviewStatus = 'pending' | 'approved' | 'rejected' | 'requires_revision'
export type DailyRecordStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type ApprovalAction = 'approve' | 'reject' | 'request_revision'
