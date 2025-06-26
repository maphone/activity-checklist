// services/activityService.ts - Fixed API Service with proper field mapping
import { apiService } from '../services/apiService'
import { handleApiResponse } from '../utils/res'

// Types
export interface Activity {
  ACTIVITY_ID?: number
  ACTIVITY_CODE?: string
  TITLE?: string
  DESCRIPTION?: string
  STATUS?: string
  PRIORITY?: string
  START_TIME?: string
  END_TIME?: string
  ESTIMATED_DURATION?: number
  CATEGORY_NAME_LAO?: string
  ASSIGNEE_FNAME?: string
  ASSIGNEE_LNAME?: string
  CREATED_DATE?: string
  IS_ACTIVE?: boolean
  [key: string]: any
}

export interface Category {
  CAT_ID?: number
  CAT_CODE?: string
  CAT_NAME_LAO?: string
  CAT_NAME_ENG?: string
  IS_ACTIVE?: boolean
  [key: string]: any
}

export interface TeamMember {
  UDID?: string
  id?: string
  name?: string
  NAME?: string
  FNAME?: string
  LNAME?: string
  position?: string
  POSITION?: string
  branch?: string
  role?: string
  email?: string
  IS_ACTIVE?: boolean
  [key: string]: any
}

export interface GetActivitiesParams {
  startDate?: string
  endDate?: string
  status?: string
  priority?: string
  assignedTo?: string
  page?: number
  limit?: number
  [key: string]: any
}

export interface CreateActivityData {
  title: string
  description?: string
  priority: string
  startTime?: string
  endTime?: string
  estimatedDuration?: number
  category?: string
  assignedTo?: string
  dueDate?: string
  notes?: string
  assigneeNote?: string
  startDate?: string
  [key: string]: any
}

export interface UpdateActivityData extends Partial<CreateActivityData> {
  status?: string
  actualDuration?: number
  progress?: number
  [key: string]: any
}

// API Endpoints
const API_ENDPOINTS = {
  ACTIVITIES: '/api/activity/activities',
  CATEGORIES: '/api/activity/categories',
  TEAM_MEMBERS: '/api/activity/team-members',
  ACTIVITY_DETAIL: (id: string) => `/api/activity/activities/${id}`,
} as const

// Activity Service Class
class ActivityService {
  // Get Activities
  async getActivities(params: GetActivitiesParams = {}, options: any = {}) {
    try {
      console.log('📋 [ActivityService] Getting activities with params:', params)

      // Build query parameters
      const queryParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      const url = `${API_ENDPOINTS.ACTIVITIES}?${queryParams.toString()}`
      console.log('📋 [ActivityService] Request URL:', url)

      const response = await apiService.get(url, {
        signal: options.signal,
        context: 'getActivities',
      })

      console.log('📋 [ActivityService] Raw response:', response)

      return handleApiResponse<Activity[]>(response, {
        context: 'getActivities',
        expectedType: 'array',
      })
    } catch (error) {
      console.error('❌ [ActivityService] Error getting activities:', error)
      return {
        success: false,
        data: [],
        message: error.message || 'ไม่สามารถดึงข้อมูลกิจกรรมได้',
        error: error.message,
      }
    }
  }

  // Get Categories
  async getCategories() {
    try {
      console.log('📂 [ActivityService] Getting categories...')

      const response = await apiService.get(API_ENDPOINTS.CATEGORIES, {
        context: 'getCategories',
      })

      console.log('📂 [ActivityService] Categories response:', response)

      return handleApiResponse<Category[]>(response, {
        context: 'getCategories',
        expectedType: 'array',
      })
    } catch (error) {
      console.error('❌ [ActivityService] Error getting categories:', error)
      return {
        success: false,
        data: [],
        message: error.message || 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้',
        error: error.message,
      }
    }
  }

  // Get Team Members
  async getTeamMembers() {
    try {
      console.log('👥 [ActivityService] Getting team members...')

      const response = await apiService.get(API_ENDPOINTS.TEAM_MEMBERS, {
        context: 'getTeamMembers',
      })

      console.log('👥 [ActivityService] Team members response:', response)

      // Transform team members data to ensure consistent format
      if (response.success && Array.isArray(response.data)) {
        response.data = response.data.map((member: any) => ({
          ...member,
          UDID: member.UDID || member.id,
          NAME: member.name || member.NAME || `${member.FNAME || ''} ${member.LNAME || ''}`.trim(),
          POSITION: member.position || member.POSITION || member.P_SITION || member.P_PROFILE,
          // Keep all original fields as well
        }))
      }

      return handleApiResponse<TeamMember[]>(response, {
        context: 'getTeamMembers',
        expectedType: 'array',
      })
    } catch (error) {
      console.error('❌ [ActivityService] Error getting team members:', error)
      return {
        success: false,
        data: [],
        message: error.message || 'ไม่สามารถดึงข้อมูลสมาชิกทีมได้',
        error: error.message,
      }
    }
  }

  // Get Single Activity
  async getActivity(id: string) {
    try {
      console.log('📋 [ActivityService] Getting activity:', id)

      const response = await apiService.get(API_ENDPOINTS.ACTIVITY_DETAIL(id), {
        context: 'getActivity',
      })

      console.log('📋 [ActivityService] Activity response:', response)

      return handleApiResponse<Activity>(response, {
        context: 'getActivity',
        expectedType: 'object',
      })
    } catch (error) {
      console.error('❌ [ActivityService] Error getting activity:', error)
      return {
        success: false,
        data: null,
        message: error.message || 'ไม่สามารถดึงข้อมูลกิจกรรมได้',
        error: error.message,
      }
    }
  }

  // Create Activity - Enhanced to send all form data
  async createActivity(data: CreateActivityData) {
    try {
      console.log('📝 [ActivityService] Creating activity:', data)

      // Transform data to API format - include ALL fields
      const apiData = {
        title: data.title,
        description: data.description || '',
        priority: data.priority,
        start_time: data.startTime,
        end_time: data.endTime,
        start_date: data.startDate || new Date().toISOString().split('T')[0], // Default to today
        estimated_duration: data.estimatedDuration,
        category: data.category,
        category_code: data.category, // Send as both fields
        assigned_to: data.assignedTo,
        due_date: data.dueDate,
        notes: data.notes || '',
        assignee_note: data.assigneeNote || '',
      }

      // Remove undefined/null fields
      Object.keys(apiData).forEach((key) => {
        if (apiData[key] === undefined || apiData[key] === null) {
          delete apiData[key]
        }
      })

      console.log('📝 [ActivityService] Sending data to API:', apiData)

      const response = await apiService.post(API_ENDPOINTS.ACTIVITIES, apiData, {
        context: 'createActivity',
      })

      console.log('📝 [ActivityService] Create response:', response)

      return handleApiResponse<Activity>(response, {
        context: 'createActivity',
        expectedType: 'object',
      })
    } catch (error) {
      console.error('❌ [ActivityService] Error creating activity:', error)
      return {
        success: false,
        data: null,
        message: error.message || 'ไม่สามารถสร้างกิจกรรมได้',
        error: error.message,
      }
    }
  }

  // Update Activity - Enhanced to send all form data
  async updateActivity(id: string, data: UpdateActivityData) {
    try {
      console.log('📝 [ActivityService] Updating activity:', id, data)

      // Transform data to API format - include ALL fields
      const apiData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        start_time: data.startTime,
        end_time: data.endTime,
        start_date: data.startDate,
        estimated_duration: data.estimatedDuration,
        actual_duration: data.actualDuration,
        category: data.category,
        category_code: data.category, // Send as both fields
        assigned_to: data.assignedTo,
        due_date: data.dueDate,
        notes: data.notes,
        assignee_note: data.assigneeNote,
        progress: data.progress,
      }

      // Remove undefined fields
      Object.keys(apiData).forEach((key) => {
        if (apiData[key] === undefined) {
          delete apiData[key]
        }
      })

      console.log('📝 [ActivityService] Sending update data to API:', apiData)

      const response = await apiService.put(API_ENDPOINTS.ACTIVITY_DETAIL(id), apiData, {
        context: 'updateActivity',
      })

      console.log('📝 [ActivityService] Update response:', response)

      return handleApiResponse<Activity>(response, {
        context: 'updateActivity',
        expectedType: 'object',
      })
    } catch (error) {
      console.error('❌ [ActivityService] Error updating activity:', error)
      return {
        success: false,
        data: null,
        message: error.message || 'ไม่สามารถอัปเดตกิจกรรมได้',
        error: error.message,
      }
    }
  }

  // Delete Activity
  async deleteActivity(id: string) {
    try {
      console.log('🗑️ [ActivityService] Deleting activity:', id)

      const response = await apiService.delete(API_ENDPOINTS.ACTIVITY_DETAIL(id), {
        context: 'deleteActivity',
      })

      console.log('🗑️ [ActivityService] Delete response:', response)

      return handleApiResponse(response, {
        context: 'deleteActivity',
        expectedType: 'object',
      })
    } catch (error) {
      console.error('❌ [ActivityService] Error deleting activity:', error)
      return {
        success: false,
        message: error.message || 'ไม่สามารถลบกิจกรรมได้',
        error: error.message,
      }
    }
  }

  // Test Connection
  async testConnection() {
    try {
      console.log('🔍 [ActivityService] Testing API connection...')

      const response = await apiService.get('/api/health', {
        context: 'testConnection',
        timeout: 5000,
      })

      console.log('🔍 [ActivityService] Connection test response:', response)
      return response
    } catch (error) {
      console.error('❌ [ActivityService] Connection test failed:', error)
      return {
        success: false,
        message: 'ไม่สามารถเชื่อมต่อ API ได้',
        error: error.message,
      }
    }
  }
}

// Export singleton instance
export const activityService = new ActivityService()
export default activityService
