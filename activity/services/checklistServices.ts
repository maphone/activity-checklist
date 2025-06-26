import { getToken } from '@/hooks/secureStore'
import {
  ChecklistCategory,
  ChecklistTemplate,
  ChecklistSchedule,
  ChecklistResponse,
  DailyChecklistRecord,
  ChecklistAnalytics,
  CreateChecklistResponseData,
  UpdateChecklistItemData,
  SubmitDailyRecordData,
  ProcessApprovalData,
  UpdateReviewStatusData,
  ChecklistFilters,
  ChecklistApiResponse,
} from '../types/checklist-types'
import { API_PUBLIC_URL } from '@/hooks/use-api'

// API Configuration
const CHECKLIST_API_URL = `${API_PUBLIC_URL}/api/checklists`

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getToken()

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response
}

// Helper function to build query string
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  return searchParams.toString()
}

export const checklistService = {
  // ===== CATEGORIES =====

  /**
   * Get all checklist categories
   */
  async getCategories(): Promise<ChecklistApiResponse<ChecklistCategory[]>> {
    try {
      const response = await makeAuthenticatedRequest(`${CHECKLIST_API_URL}/categories`)
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.getCategories] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch categories',
      }
    }
  },

  // ===== TEMPLATES =====

  /**
   * Get checklist templates with optional filters
   */
  async getTemplates(
    filters?: ChecklistFilters
  ): Promise<ChecklistApiResponse<ChecklistTemplate[]>> {
    try {
      const queryString = filters ? buildQueryString(filters) : ''
      const url = `${CHECKLIST_API_URL}/templates${queryString ? `?${queryString}` : ''}`

      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.getTemplates] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch templates',
      }
    }
  },

  // ===== SCHEDULES =====

  /**
   * Get checklist schedules
   */
  async getSchedules(
    filters?: ChecklistFilters
  ): Promise<ChecklistApiResponse<ChecklistSchedule[]>> {
    try {
      const queryString = filters ? buildQueryString(filters) : ''
      const url = `${CHECKLIST_API_URL}/schedules${queryString ? `?${queryString}` : ''}`

      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.getSchedules] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch schedules',
      }
    }
  },

  // ===== RESPONSES =====

  /**
   * Get checklist responses with pagination
   */
  async getResponses(
    filters?: ChecklistFilters & { page?: number; limit?: number }
  ): Promise<ChecklistApiResponse<ChecklistResponse[]>> {
    try {
      const queryString = filters ? buildQueryString(filters) : ''
      const url = `${CHECKLIST_API_URL}/responses${queryString ? `?${queryString}` : ''}`

      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.getResponses] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch responses',
      }
    }
  },

  /**
   * Create new checklist response
   */
  async createResponse(
    data: CreateChecklistResponseData
  ): Promise<ChecklistApiResponse<{ id: number }>> {
    try {
      const response = await makeAuthenticatedRequest(`${CHECKLIST_API_URL}/responses`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.createResponse] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to create response',
      }
    }
  },

  /**
   * Update response review status (for approvers)
   */
  async updateReviewStatus(
    id: number,
    data: UpdateReviewStatusData
  ): Promise<ChecklistApiResponse<void>> {
    try {
      const response = await makeAuthenticatedRequest(
        `${CHECKLIST_API_URL}/responses/${id}/review`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      )
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.updateReviewStatus] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to update review status',
      }
    }
  },

  // ===== DAILY RECORDS =====

  /**
   * Get or create daily checklist record for user
   */
  async getDailyRecord(date: string): Promise<ChecklistApiResponse<DailyChecklistRecord>> {
    try {
      const response = await makeAuthenticatedRequest(`${CHECKLIST_API_URL}/daily/${date}`)
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.getDailyRecord] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch daily record',
      }
    }
  },

  /**
   * Update checklist item completion
   */
  async updateChecklistItem(
    recordId: string,
    checklistId: string,
    data: UpdateChecklistItemData
  ): Promise<ChecklistApiResponse<void>> {
    try {
      const response = await makeAuthenticatedRequest(
        `${CHECKLIST_API_URL}/daily/${recordId}/items/${checklistId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      )
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.updateChecklistItem] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to update checklist item',
      }
    }
  },

  /**
   * Submit daily record for approval
   */
  async submitDailyRecord(
    recordId: string,
    data: SubmitDailyRecordData
  ): Promise<ChecklistApiResponse<void>> {
    try {
      const response = await makeAuthenticatedRequest(
        `${CHECKLIST_API_URL}/daily/${recordId}/submit`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      )
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.submitDailyRecord] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to submit daily record',
      }
    }
  },

  // ===== APPROVALS =====

  /**
   * Get pending approval records (for managers)
   */
  async getPendingApprovals(filters?: {
    page?: number
    limit?: number
  }): Promise<ChecklistApiResponse<DailyChecklistRecord[]>> {
    try {
      const queryString = filters ? buildQueryString(filters) : ''
      const url = `${CHECKLIST_API_URL}/approvals/pending${queryString ? `?${queryString}` : ''}`

      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.getPendingApprovals] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch pending approvals',
      }
    }
  },

  /**
   * Process approval (approve/reject/request_revision)
   */
  async processApproval(
    recordId: string,
    data: ProcessApprovalData
  ): Promise<ChecklistApiResponse<void>> {
    try {
      const response = await makeAuthenticatedRequest(
        `${CHECKLIST_API_URL}/approvals/${recordId}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.processApproval] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to process approval',
      }
    }
  },

  // ===== ANALYTICS =====

  /**
   * Get checklist analytics and summary
   */
  async getAnalytics(
    filters?: ChecklistFilters
  ): Promise<ChecklistApiResponse<ChecklistAnalytics>> {
    try {
      const queryString = filters ? buildQueryString(filters) : ''
      const url = `${CHECKLIST_API_URL}/analytics${queryString ? `?${queryString}` : ''}`

      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error: any) {
      console.error('❌ [checklistService.getAnalytics] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch analytics',
      }
    }
  },

  // ===== UTILITY METHODS =====

  /**
   * Batch update multiple checklist items
   */
  async batchUpdateItems(
    recordId: string,
    updates: Array<{ checklistId: string; data: UpdateChecklistItemData }>
  ): Promise<ChecklistApiResponse<void>> {
    try {
      const promises = updates.map(({ checklistId, data }) =>
        this.updateChecklistItem(recordId, checklistId, data)
      )

      const results = await Promise.all(promises)
      const failedUpdates = results.filter((result) => !result.success)

      if (failedUpdates.length > 0) {
        throw new Error(`${failedUpdates.length} updates failed`)
      }

      return {
        success: true,
        message: 'All items updated successfully',
      }
    } catch (error: any) {
      console.error('❌ [checklistService.batchUpdateItems] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to batch update items',
      }
    }
  },

  /**
   * Get checklist summary for date range
   */
  async getDateRangeSummary(
    startDate: string,
    endDate: string,
    branchId?: number
  ): Promise<ChecklistApiResponse<any>> {
    try {
      const filters: ChecklistFilters = { startDate, endDate }
      if (branchId) filters.branchId = branchId

      const [analyticsResponse, responsesResponse] = await Promise.all([
        this.getAnalytics(filters),
        this.getResponses({ ...filters, limit: 1000 }),
      ])

      if (!analyticsResponse.success || !responsesResponse.success) {
        throw new Error('Failed to fetch summary data')
      }

      return {
        success: true,
        data: {
          analytics: analyticsResponse.data,
          responses: responsesResponse.data,
          summary: {
            totalDays:
              Math.ceil(
                (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + 1,
            completionRate: analyticsResponse.data?.overall?.avg_working_hours || 0,
          },
        },
        message: 'Summary fetched successfully',
      }
    } catch (error: any) {
      console.error('❌ [checklistService.getDateRangeSummary] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch date range summary',
      }
    }
  },

  /**
   * Search templates by title
   */
  async searchTemplates(
    query: string,
    filters?: ChecklistFilters
  ): Promise<ChecklistApiResponse<ChecklistTemplate[]>> {
    try {
      // For now, we'll use the client-side filtering
      // In a real application, you might want to add server-side search
      const response = await this.getTemplates(filters)

      if (!response.success || !response.data) {
        return response
      }

      const filteredTemplates = response.data.filter(
        (template) =>
          template.TITLE.toLowerCase().includes(query.toLowerCase()) ||
          (template.DESCRIPTION && template.DESCRIPTION.toLowerCase().includes(query.toLowerCase()))
      )

      return {
        success: true,
        data: filteredTemplates,
        message: `Found ${filteredTemplates.length} templates`,
      }
    } catch (error: any) {
      console.error('❌ [checklistService.searchTemplates] Error:', error)
      return {
        success: false,
        message: error.message || 'Failed to search templates',
      }
    }
  },
}
