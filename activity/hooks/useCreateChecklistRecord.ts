// hooks/useCreateChecklistRecord.ts
import { useState, useCallback } from 'react'
import { checklistService } from '../services/checkListService'
import { v4 as uuidv4 } from 'uuid'
import { DailyChecklistRecord, DailyChecklistItem, ChecklistTemplate } from '../types/types'

interface CreateChecklistOptions {
  date?: string
  udid: string
  employeeName: string
  position: string
  branchCode: string
  branchName: string
  totalWorkingHours?: number
  notes?: string
}

interface UseCreateChecklistReturn {
  createNewRecord: (options: CreateChecklistOptions) => Promise<DailyChecklistRecord | null>
  isCreating: boolean
  error: string | null
  clearError: () => void
}

export const useCreateChecklistRecord = (): UseCreateChecklistReturn => {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const createNewRecord = useCallback(
    async (options: CreateChecklistOptions): Promise<DailyChecklistRecord | null> => {
      setIsCreating(true)
      setError(null)

      try {
        const {
          date = new Date().toISOString().split('T')[0],
          udid,
          employeeName,
          position,
          branchCode,
          branchName,
          totalWorkingHours = 8,
          notes = '',
        } = options

        console.log('🔧 Creating new checklist record:', { date, udid, position })

        // Step 1: ດຶງ templates ຕາມຕຳແໜ່ງ
        const templatesResponse = await checklistService.getChecklistTemplates(position)

        if (!templatesResponse.success || !templatesResponse.data) {
          throw new Error('ບໍ່ສາມາດດຶງຂໍ້ມູນ templates ໄດ້')
        }

        const templates = templatesResponse.data
        console.log(`✅ Loaded ${templates.length} templates for position: ${position}`)

        // Step 2: ສ້າງ checklist items ຈາກ templates
        const checklistItems: DailyChecklistItem[] = templates.map(
          (template: ChecklistTemplate) => ({
            ID: uuidv4(),
            RECORD_ID: '', // Will be set after record creation
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
            QUALITY_RATING: null,
          })
        )

        // Step 3: ສ້າງ record data
        const newRecord: Partial<DailyChecklistRecord> = {
          ID: uuidv4(),
          UDID: udid,
          RECORD_DATE: date,
          EMPLOYEE_NAME: employeeName,
          POSITION: position,
          BRANCH_CODE: branchCode,
          BRANCH_NAME: branchName,
          TOTAL_WORKING_HOURS: totalWorkingHours,
          NOTES: notes,
          STATUS: 'draft',
          CREATED_AT: new Date().toISOString(),
          UPDATED_AT: new Date().toISOString(),
          checklistItems: checklistItems,
          activities: [],
        }

        // Step 4: ບັນທຶກຂໍ້ມູນ
        const createResponse = await checklistService.createOrUpdateDailyRecord(newRecord)

        if (!createResponse.success || !createResponse.data) {
          throw new Error(createResponse.message || 'ບໍ່ສາມາດສ້າງບັນທຶກໄດ້')
        }

        console.log('✅ Successfully created checklist record:', createResponse.data.ID)

        setIsCreating(false)
        return createResponse.data
      } catch (err: any) {
        console.error('❌ Failed to create checklist record:', err)
        const errorMessage = err.message || 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງບັນທຶກ'
        setError(errorMessage)
        setIsCreating(false)
        return null
      }
    },
    []
  )

  return {
    createNewRecord,
    isCreating,
    error,
    clearError,
  }
}
