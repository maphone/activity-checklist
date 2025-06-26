
// services/checklistService.ts - ປັບປຸງແລະແກ້ໄຂແລ້ວ
import { apiService } from "./apiService";
import {
  ChecklistTemplate,
  DailyChecklistRecord,
  DailyChecklistItem,
  BaseApiResponse,
  RecordStatus,
  WorkStatistics,
} from "../types/types";

// ການກຳນົດ endpoints
const ENDPOINTS = {
  TEMPLATES: "/api/checklist/templates",
  DAILY_RECORD: "/api/checklist/daily-record",
  STATISTICS: "/api/checklist/statistics",
  SUMMARY: "/api/checklist/summary",
  PENDING_APPROVALS: "/api/checklist/pending-approvals",
  EXPORT: "/api/checklist/export",
  BULK_OPERATIONS: "/api/checklist/bulk",
} as const;

// ການກຳນົດ configuration
const CONFIG = {
  CACHE_TTL: 5 * 60 * 1000, // 5 ນາທີ
  DEFAULT_WORKING_HOURS: 8,
  MAX_BULK_OPERATIONS: 50,
  VALIDATION_RULES: {
    MIN_TITLE_LENGTH: 3,
    MAX_TITLE_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 1000,
    MAX_NOTES_LENGTH: 500,
    MIN_ESTIMATED_TIME: 1,
    MAX_ESTIMATED_TIME: 480, // 8 ຊົ່ວໂມງ
  },
} as const;

// Interface ສຳລັບ options
interface ChecklistServiceOptions {
  signal?: AbortSignal;
  useCache?: boolean;
  timeout?: number;
}

// Interface ສຳລັບ validation result
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Interface ສຳລັບ progress calculation
interface ProgressCalculation {
  overall: number;
  required: number;
  completed: number;
  total: number;
  timeEfficiency: number;
  qualityScore?: number;
}

// Interface ສຳລັບ bulk operations
interface BulkUpdateRequest {
  recordId: string;
  updates: Array<{
    checklistId: string;
    isCompleted?: boolean;
    notes?: string;
    completionTime?: string;
  }>;
}

// Interface ສຳລັບ export options
interface ExportOptions {
  format: "excel" | "pdf" | "csv";
  startDate?: string;
  endDate?: string;
  includeStats?: boolean;
  includeCharts?: boolean;
  filters?: {
    status?: RecordStatus[];
    position?: string[];
    branch?: string[];
  };
}

// Extended BaseApiResponse for updateChecklistItem
interface ChecklistItemUpdateResponse extends BaseApiResponse<DailyChecklistItem> {
  recordId?: string;
}

// Error handling helper
const handleChecklistError = (
  error: any,
  operation: string
): BaseApiResponse => {
  console.error(`ChecklistService.${operation} error:`, error);

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return {
          success: false,
          message: data?.message || "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ",
          error: "Validation Error",
          status,
        };
      case 401:
        return {
          success: false,
          message: "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ",
          error: "Unauthorized",
          status,
        };
      case 403:
        return {
          success: false,
          message: "ທ່ານບໍ່ມີສິດໃນການດຳເນີນການນີ້",
          error: "Forbidden",
          status,
        };
      case 404:
        return {
          success: false,
          message: "ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການ",
          error: "Not Found",
          status,
        };
      case 409:
        return {
          success: false,
          message: "ມີການຂັດແຍ້ງກັບຂໍ້ມູນທີ່ມີຢູ່",
          error: "Conflict",
          status,
        };
      case 429:
        return {
          success: false,
          message: "ການຮ້ອງຂໍຫຼາຍເກີນໄປ",
          error: "Too Many Requests",
          status,
        };
      default:
        return {
          success: false,
          message: data?.message || `ຂໍ້ຜິດພາດ HTTP ${status}`,
          error: "HTTP Error",
          status,
        };
    }
  }

  if (error.code === "ECONNABORTED") {
    return {
      success: false,
      message: "ການເຊື່ອມຕໍ່ໃຊ້ເວລາເກີນກຳນົດ",
      error: "Timeout",
    };
  }

  return {
    success: false,
    message: error.message || "ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດ",
    error: "Unknown Error",
  };
};

// Data transformation helpers
const transformTemplateData = (template: Partial<ChecklistTemplate>): any => {
  return {
    ...template,
    title: template.TITLE?.trim(),
    description: template.DESCRIPTION?.trim() || null,
    category: template.CATEGORY?.trim(),
    position: template.POSITION?.trim(),
    isRequired: template.IS_REQUIRED ?? false,
    estimatedTime: template.ESTIMATED_TIME
      ? parseInt(template.ESTIMATED_TIME.toString())
      : 0,
    frequency: template.FREQUENCY || "daily",
  };
};

const transformRecordData = (record: any): any => {
  return {
    id: record.id || record.ID || undefined,
    udid: record.udid || record.UDID,
    recordDate: record.recordDate || record.RECORD_DATE,
    employeeName: record.employeeName || record.EMPLOYEE_NAME,
    position: record.position || record.POSITION,
    branchCode: record.branchCode || record.BRANCH_CODE,
    branchName: record.branchName || record.BRANCH_NAME,
    totalWorkingHours:
      record.totalWorkingHours ||
      record.TOTAL_WORKING_HOURS ||
      CONFIG.DEFAULT_WORKING_HOURS,
    notes: record.notes || record.NOTES || "",
    status: record.status || record.STATUS || "draft",
    checklistItems: (record.checklistItems || []).map((item: any) => ({
      id: item.id || item.ID || undefined,
      checklistId: item.checklistId || item.CHECKLIST_ID,
      isCompleted: item.isCompleted ?? item.IS_COMPLETED ?? false,
      completionTime: item.completionTime || item.COMPLETION_TIME || null,
      notes: item.notes || item.NOTES || "",
      qualityRating: item.qualityRating || item.QUALITY_RATING || null,
    })),
    activities: (record.activities || []).map((activity: any) => ({
      id: activity.id || activity.ID || undefined,
      activityType: activity.activityType || activity.ACTIVITY_TYPE,
      description: activity.description || activity.DESCRIPTION,
      startTime: activity.startTime || activity.START_TIME,
      endTime: activity.endTime || activity.END_TIME,
      durationMinutes: activity.durationMinutes || activity.DURATION_MINUTES,
      location: activity.location || activity.LOCATION,
      participants: activity.participants || activity.PARTICIPANTS || [],
      outcome: activity.outcome || activity.OUTCOME,
    })),
  };
};

// Main ChecklistService class
class ChecklistService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = "/api/checklist";
    this.timeout = 30000;
  }

  // =================== TEMPLATE METHODS ===================

  // ດຶງ checklist templates
  async getChecklistTemplates(
    position?: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<ChecklistTemplate[]>> {
    try {
      const params: any = {};
      if (position) params.position = position;

      const response = await apiService.get(ENDPOINTS.TEMPLATES, {
        params,
        ...options,
        timeout: options.timeout || this.timeout,
      });

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ດຶງຂໍ້ມູນ template ສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "getChecklistTemplates");
    }
  }

  // ດຶງ template ດຽວ
  async getChecklistTemplate(
    id: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<ChecklistTemplate>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸ ID template",
          error: "Invalid ID",
        };
      }

      const response = await apiService.get(`${ENDPOINTS.TEMPLATES}/${id}`, {
        ...options,
        timeout: options.timeout || this.timeout,
      });

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ດຶງຂໍ້ມູນ template ສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "getChecklistTemplate");
    }
  }

  // ສ້າງ template ໃໝ່
  async createChecklistTemplate(
    data: Partial<ChecklistTemplate>
  ): Promise<BaseApiResponse<ChecklistTemplate>> {
    try {
      // Validate input
      const validation = this.validateTemplateData(data);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(", "),
          error: "Validation Error",
        };
      }

      const transformedData = transformTemplateData(data);

      console.log("Creating checklist template:", transformedData);

      const response = await apiService.post(
        ENDPOINTS.TEMPLATES,
        transformedData,
        {
          timeout: this.timeout,
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ສ້າງ template ສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "createChecklistTemplate");
    }
  }

  // ອັບເດດ template
  async updateChecklistTemplate(
    id: string,
    data: Partial<ChecklistTemplate>
  ): Promise<BaseApiResponse<ChecklistTemplate>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸ ID template",
          error: "Invalid ID",
        };
      }

      // Validate input
      const validation = this.validateTemplateData(data);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(", "),
          error: "Validation Error",
        };
      }

      const transformedData = transformTemplateData(data);

      console.log("Updating checklist template:", id, transformedData);

      const response = await apiService.put(
        `${ENDPOINTS.TEMPLATES}/${id}`,
        transformedData,
        {
          timeout: this.timeout,
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ອັບເດດ template ສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "updateChecklistTemplate");
    }
  }

  // ລົບ template
  async deleteChecklistTemplate(id: string): Promise<BaseApiResponse<void>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸ ID template",
          error: "Invalid ID",
        };
      }

      console.log("Deleting checklist template:", id);

      const response = await apiService.delete(`${ENDPOINTS.TEMPLATES}/${id}`, {
        timeout: this.timeout,
      });

      if (response.success) {
        return {
          success: true,
          message: "ລົບ template ສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "deleteChecklistTemplate");
    }
  }

  // =================== DAILY RECORD METHODS ===================

  // ດຶງ daily record
  async getDailyRecord(
    date?: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<DailyChecklistRecord>> {
    try {
      const recordDate = date || new Date().toISOString().split("T")[0];

      console.log("Fetching daily record for date:", recordDate);

      const response = await apiService.get(ENDPOINTS.DAILY_RECORD, {
        params: { date: recordDate },
        ...options,
        timeout: options.timeout || this.timeout,
      });

      // If no record exists, create empty structure
      if (!response.success || !response.data) {
        console.log("No existing record found, creating empty structure");
        const emptyRecord = await this.createEmptyDailyRecord(recordDate);
        return {
          success: true,
          data: emptyRecord,
          message: "ສ້າງໂຄງສ້າງຂໍ້ມູນເບື້ອງຕົ້ນສຳເລັດ",
        };
      }

      return {
        success: true,
        data: response.data,
        message: "ດຶງຂໍ້ມູນ daily record ສຳເລັດ",
      };
    } catch (error: any) {
      // If 404, create empty record
      if (
        error.response?.status === 404 ||
        error.status === 404 ||
        error.message?.includes("404") ||
        error.message?.includes("not found")
      ) {
        console.log("Record not found (404), creating empty structure");
        const recordDate = date || new Date().toISOString().split("T")[0];
        const emptyRecord = await this.createEmptyDailyRecord(recordDate);
        return {
          success: true,
          data: emptyRecord,
          message: "ສ້າງໂຄງສ້າງຂໍ້ມູນເບື້ອງຕົ້ນສຳເລັດ",
        };
      }

      return handleChecklistError(error, "getDailyRecord");
    }
  }

  // ສ້າງ ຫຼື ອັບເດດ daily record
  async createOrUpdateDailyRecord(
    data: any,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<DailyChecklistRecord>> {
    try {
      // Validate input
      const validation = this.validateRecordData(data);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(", "),
          error: "Validation Error",
        };
      }

      const transformedData = transformRecordData(data);
      const isUpdate = !!(data.id || data.ID);

      console.log(
        isUpdate ? "Updating" : "Creating",
        "daily record:",
        transformedData
      );

      let response;
      if (isUpdate) {
        const recordId = data.id || data.ID;
        response = await apiService.put(
          `${ENDPOINTS.DAILY_RECORD}/${recordId}`,
          transformedData,
          {
            ...options,
            timeout: options.timeout || this.timeout,
          }
        );
      } else {
        response = await apiService.post(
          ENDPOINTS.DAILY_RECORD,
          transformedData,
          {
            ...options,
            timeout: options.timeout || this.timeout,
          }
        );
      }

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: isUpdate ? "ອັບເດດບັນທຶກສຳເລັດ" : "ສ້າງບັນທຶກສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "createOrUpdateDailyRecord");
    }
  }

  // ລົບ daily record
  async deleteDailyRecord(
    recordId: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<void>> {
    try {
      if (!recordId || recordId.trim().length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸ ID ບັນທຶກ",
          error: "Invalid ID",
        };
      }

      console.log("Deleting daily record:", recordId);

      const response = await apiService.delete(
        `${ENDPOINTS.DAILY_RECORD}/${recordId}`,
        {
          ...options,
          timeout: options.timeout || this.timeout,
        }
      );

      if (response.success) {
        return {
          success: true,
          message: "ລົບບັນທຶກສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "deleteDailyRecord");
    }
  }

  // =================== CHECKLIST ITEM METHODS ===================

  // ອັບເດດ checklist item
  async updateChecklistItem(
    recordId: string,
    checklistId: string,
    data: { isCompleted?: boolean; notes?: string; qualityRating?: number },
    options: ChecklistServiceOptions = {}
  ): Promise<ChecklistItemUpdateResponse> {
    try {
      if (!recordId || !checklistId) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸ ID ບັນທຶກແລະ ID checklist",
          error: "Invalid IDs",
        };
      }

      const updateData = {
        ...data,
        completionTime: data.isCompleted ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      console.log("Updating checklist item:", {
        recordId,
        checklistId,
        updateData,
      });

      const response = await apiService.put(
        `${ENDPOINTS.DAILY_RECORD}/${recordId}/checklist/${checklistId}`,
        updateData,
        {
          ...options,
          timeout: options.timeout || this.timeout,
        }
      );

      if (response.success) {
        return {
          success: true,
          data: response.data?.item || response.data,
          recordId: response.data?.recordId || recordId,
          message: "ອັບເດດລາຍການສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "updateChecklistItem");
    }
  }

  // ອັບເດດຫຼາຍລາຍການພ້ອມກັນ
  async bulkUpdateChecklistItems(
    bulkRequest: BulkUpdateRequest,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<DailyChecklistItem[]>> {
    try {
      const { recordId, updates } = bulkRequest;

      if (!recordId || !updates || updates.length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸຂໍ້ມູນທີ່ຕ້ອງການອັບເດດ",
          error: "Invalid Request",
        };
      }

      if (updates.length > CONFIG.MAX_BULK_OPERATIONS) {
        return {
          success: false,
          message: `ສາມາດອັບເດດໄດ້ສູງສຸດ ${CONFIG.MAX_BULK_OPERATIONS} ລາຍການ`,
          error: "Too Many Items",
        };
      }

      // Add timestamps to updates
      const timestampedUpdates = updates.map((update) => ({
        ...update,
        completionTime: update.isCompleted ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      }));

      console.log("Bulk updating checklist items:", {
        recordId,
        count: updates.length,
      });

      const response = await apiService.put(
        `${ENDPOINTS.DAILY_RECORD}/${recordId}/checklist/bulk`,
        { updates: timestampedUpdates },
        {
          ...options,
          timeout: (options.timeout || this.timeout) * 2, // Longer timeout for bulk operations
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: `ອັບເດດ ${updates.length} ລາຍການສຳເລັດ`,
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "bulkUpdateChecklistItems");
    }
  }

  // =================== SUBMISSION AND APPROVAL METHODS ===================

  // ສົ່ງເພື່ອການອະນຸມັດ
  async submitDailyRecord(
    recordId: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<DailyChecklistRecord>> {
    try {
      if (!recordId || recordId.trim().length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸ ID ບັນທຶກ",
          error: "Invalid ID",
        };
      }

      console.log("Submitting daily record for approval:", recordId);

      const response = await apiService.post(
        `${ENDPOINTS.DAILY_RECORD}/${recordId}/submit`,
        {
          submittedAt: new Date().toISOString(),
        },
        {
          ...options,
          timeout: options.timeout || this.timeout,
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ສົ່ງເພື່ອການອະນຸມັດສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "submitDailyRecord");
    }
  }

  // ອະນຸມັດ daily record
  async approveDailyRecord(
    recordId: string,
    comment?: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<DailyChecklistRecord>> {
    try {
      if (!recordId || recordId.trim().length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸ ID ບັນທຶກ",
          error: "Invalid ID",
        };
      }

      console.log("Approving daily record:", recordId);

      const response = await apiService.post(
        `${ENDPOINTS.DAILY_RECORD}/${recordId}/approve`,
        {
          comment: comment || "",
          approvedAt: new Date().toISOString(),
        },
        {
          ...options,
          timeout: options.timeout || this.timeout,
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ອະນຸມັດບັນທຶກສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "approveDailyRecord");
    }
  }

  // ປະຕິເສດ daily record
  async rejectDailyRecord(
    recordId: string,
    reason: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<DailyChecklistRecord>> {
    try {
      if (!recordId || recordId.trim().length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸ ID ບັນທຶກ",
          error: "Invalid ID",
        };
      }

      if (!reason || reason.trim().length === 0) {
        return {
          success: false,
          message: "ກະລຸນາລະບຸເຫດຜົນໃນການປະຕິເສດ",
          error: "Reason Required",
        };
      }

      console.log("Rejecting daily record:", recordId, "Reason:", reason);

      const response = await apiService.post(
        `${ENDPOINTS.DAILY_RECORD}/${recordId}/reject`,
        {
          reason: reason.trim(),
          rejectedAt: new Date().toISOString(),
        },
        {
          ...options,
          timeout: options.timeout || this.timeout,
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ປະຕິເສດບັນທຶກສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "rejectDailyRecord");
    }
  }

  // =================== STATISTICS AND REPORTS ===================

  // ດຶງສະຫຼຸບ
  async getSummary(
    startDate?: string,
    endDate?: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<any[]>> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      console.log("Fetching summary:", params);

      const response = await apiService.get(ENDPOINTS.SUMMARY, {
        params,
        ...options,
        timeout: options.timeout || this.timeout,
      });

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ດຶງຂໍ້ມູນສະຫຼຸບສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "getSummary");
    }
  }

  // ດຶງສະຖິຕິ
  async getStatistics(
    period?: string,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<WorkStatistics>> {
    try {
      const params = period ? { period } : {};

      console.log("Fetching statistics:", params);

      const response = await apiService.get(ENDPOINTS.STATISTICS, {
        params,
        ...options,
        timeout: options.timeout || this.timeout,
      });

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ດຶງຂໍ້ມູນສະຖິຕິສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "getStatistics");
    }
  }

  // ດຶງລາຍການລໍຖ້າການອະນຸມັດ
  async getPendingApprovals(
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<DailyChecklistRecord[]>> {
    try {
      console.log("Fetching pending approvals...");

      const response = await apiService.get(ENDPOINTS.PENDING_APPROVALS, {
        ...options,
        timeout: options.timeout || this.timeout,
      });

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: "ດຶງຂໍ້ມູນລໍຖ້າການອະນຸມັດສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "getPendingApprovals");
    }
  }

  // =================== EXPORT ===================

  // ສົ່ງອອກບັນທຶກ
  async exportRecords(
    exportOptions: ExportOptions,
    options: ChecklistServiceOptions = {}
  ): Promise<BaseApiResponse<string | Blob>> {
    try {
      console.log("Exporting records:", exportOptions);

      const response = await apiService.post(
        `${ENDPOINTS.EXPORT}/${exportOptions.format}`,
        exportOptions,
        {
          ...options,
          timeout: (options.timeout || this.timeout) * 3, // Longer timeout for export
          responseType: exportOptions.format === "pdf" ? "blob" : "json",
        }
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: "ສົ່ງອອກຂໍ້ມູນສຳເລັດ",
        };
      }

      return response;
    } catch (error) {
      return handleChecklistError(error, "exportRecords");
    }
  }

  // =================== HELPER METHODS ===================

  // ສ້າງ daily record ວ່າງ
  private async createEmptyDailyRecord(
    date: string
  ): Promise<DailyChecklistRecord> {
    try {
      console.log("Creating empty daily record structure for date:", date);

      // Load templates to create checklist items
      const templatesResponse = await this.getChecklistTemplates();
      const templates = templatesResponse.data || [];

      // Create checklist items from templates
      const checklistItems: DailyChecklistItem[] = templates.map(
        (template, index) => ({
          ID: `temp-item-${template.ID}-${Date.now()}-${index}`,
          RECORD_ID: "",
          CHECKLIST_ID: template.ID,
          IS_COMPLETED: false,
          NOTES: "",
          CREATED_AT: new Date().toISOString(),
          UPDATED_AT: new Date().toISOString(),

          // From template
          TITLE: template.TITLE,
          DESCRIPTION: template.DESCRIPTION,
          CATEGORY: template.CATEGORY,
          POSITION: template.POSITION,
          IS_REQUIRED: template.IS_REQUIRED,
          FREQUENCY: template.FREQUENCY,
          ESTIMATED_TIME: template.ESTIMATED_TIME,
        })
      );

      return {
        ID: "",
        UDID: "",
        RECORD_DATE: date,
        EMPLOYEE_NAME: "",
        POSITION: "",
        BRANCH_CODE: "",
        BRANCH_NAME: "",
        TOTAL_WORKING_HOURS: CONFIG.DEFAULT_WORKING_HOURS,
        NOTES: "",
        STATUS: "draft",
        CREATED_AT: new Date().toISOString(),
        UPDATED_AT: new Date().toISOString(),
        checklistItems,
        activities: [],
      };
    } catch (error) {
      console.warn(
        "Failed to load templates for empty record, using minimal structure:",
        error
      );

      // Return minimal structure if templates loading fails
      return {
        ID: "",
        UDID: "",
        RECORD_DATE: date,
        EMPLOYEE_NAME: "",
        POSITION: "",
        BRANCH_CODE: "",
        BRANCH_NAME: "",
        TOTAL_WORKING_HOURS: CONFIG.DEFAULT_WORKING_HOURS,
        NOTES: "",
        STATUS: "draft",
        CREATED_AT: new Date().toISOString(),
        UPDATED_AT: new Date().toISOString(),
        checklistItems: [],
        activities: [],
      };
    }
  }

  // =================== VALIDATION METHODS ===================

  // ກວດສອບຂໍ້ມູນ template
  validateTemplateData(template: Partial<ChecklistTemplate>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Title validation
    if (!template.TITLE || template.TITLE.trim().length === 0) {
      errors.push("ກະລຸນາໃສ່ຊື່ template");
    } else if (
      template.TITLE.length < CONFIG.VALIDATION_RULES.MIN_TITLE_LENGTH
    ) {
      errors.push(
        `ຊື່ template ຕ້ອງມີຢ່າງໜ້ອຍ ${CONFIG.VALIDATION_RULES.MIN_TITLE_LENGTH} ຕົວອັກສອນ`
      );
    } else if (
      template.TITLE.length > CONFIG.VALIDATION_RULES.MAX_TITLE_LENGTH
    ) {
      errors.push(
        `ຊື່ template ຕ້ອງບໍ່ເກີນ ${CONFIG.VALIDATION_RULES.MAX_TITLE_LENGTH} ຕົວອັກສອນ`
      );
    }

    // Description validation
    if (
      template.DESCRIPTION &&
      template.DESCRIPTION.length >
        CONFIG.VALIDATION_RULES.MAX_DESCRIPTION_LENGTH
    ) {
      errors.push(
        `ລາຍລະອຽດຕ້ອງບໍ່ເກີນ ${CONFIG.VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} ຕົວອັກສອນ`
      );
    }

    // Category validation
    if (!template.CATEGORY || template.CATEGORY.trim().length === 0) {
      errors.push("ກະລຸນາເລືອກປະເພດ");
    }

    // Position validation
    if (!template.POSITION || template.POSITION.trim().length === 0) {
      warnings.push("ບໍ່ໄດ້ລະບຸຕຳແໜ່ງ");
    }

    // Estimated time validation
    if (template.ESTIMATED_TIME !== undefined) {
      const time = parseInt(template.ESTIMATED_TIME.toString());
      if (time < CONFIG.VALIDATION_RULES.MIN_ESTIMATED_TIME) {
        errors.push(
          `ເວລາປະມານຕ້ອງຢ່າງໜ້ອຍ ${CONFIG.VALIDATION_RULES.MIN_ESTIMATED_TIME} ນາທີ`
        );
      } else if (time > CONFIG.VALIDATION_RULES.MAX_ESTIMATED_TIME) {
        errors.push(
          `ເວລາປະມານຕ້ອງບໍ່ເກີນ ${CONFIG.VALIDATION_RULES.MAX_ESTIMATED_TIME} ນາທີ`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ກວດສອບຂໍ້ມູນ record
  validateRecordData(record: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // UDID validation
    if (!record.udid && !record.UDID) {
      errors.push("ບໍ່ມີຂໍ້ມູນຜູ້ໃຊ້");
    }

    // Date validation
    if (!record.recordDate && !record.RECORD_DATE && !record.date) {
      errors.push("ບໍ່ມີວັນທີ່");
    } else {
      const date = record.recordDate || record.RECORD_DATE || record.date;
      if (new Date(date) > new Date()) {
        warnings.push("ວັນທີ່ເປັນອະນາຄົດ");
      }
    }

    // Employee name validation
    if (!record.employeeName && !record.EMPLOYEE_NAME) {
      warnings.push("ບໍ່ມີຊື່ພະນັກງານ");
    }

    // Working hours validation
    const workingHours =
      record.totalWorkingHours || record.TOTAL_WORKING_HOURS || 0;
    if (workingHours < 1 || workingHours > 24) {
      errors.push("ຊົ່ວໂມງການເຮັດວຽກຕ້ອງຢູ່ລະຫວ່າງ 1-24 ຊົ່ວໂມງ");
    }

    // Notes validation
    const notes = record.notes || record.NOTES || "";
    if (notes.length > CONFIG.VALIDATION_RULES.MAX_NOTES_LENGTH) {
      errors.push(
        `ໝາຍເຫດຕ້ອງບໍ່ເກີນ ${CONFIG.VALIDATION_RULES.MAX_NOTES_LENGTH} ຕົວອັກສອນ`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ກວດສອບບັນທຶກກ່ອນສົ່ງ
  validateRecord(record: DailyChecklistRecord): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!record.UDID) {
      errors.push("ບໍ່ມີຂໍ້ມູນຜູ້ໃຊ້");
    }

    if (!record.RECORD_DATE) {
      errors.push("ບໍ່ມີວັນທີ່");
    }

    // Required items check
    const requiredItems = record.checklistItems.filter(
      (item) => item.IS_REQUIRED
    );
    const completedRequired = requiredItems.filter((item) => item.IS_COMPLETED);

    if (
      requiredItems.length > 0 &&
      completedRequired.length !== requiredItems.length
    ) {
      const remainingRequired = requiredItems.length - completedRequired.length;
      errors.push(`ຍັງມີງານຈຳເປັນ ${remainingRequired} ລາຍການທີ່ຍັງບໍ່ສຳເລັດ`);
    }

    // Quality check
    const totalItems = record.checklistItems.length;
    const completedItems = record.checklistItems.filter(
      (item) => item.IS_COMPLETED
    ).length;
    const completionRate =
      totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    if (completionRate < 50) {
      warnings.push("ອັດຕາສຳເລັດຕ່ຳກວ່າ 50%");
    }

    // Notes check for incomplete items
    const incompleteItems = record.checklistItems.filter(
      (item) => !item.IS_COMPLETED
    );
    const incompleteWithoutNotes = incompleteItems.filter(
      (item) => !item.NOTES || item.NOTES.trim().length === 0
    );

    if (incompleteWithoutNotes.length > 0) {
      warnings.push("ມີລາຍການທີ່ບໍ່ສຳເລັດແລະບໍ່ມີໝາຍເຫດ");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // =================== CALCULATION METHODS ===================

  // ຄຳນວນຄວາມຄືບໜ້າ
  calculateProgress(record: DailyChecklistRecord): ProgressCalculation {
    const total = record.checklistItems.length;
    const completed = record.checklistItems.filter(
      (item) => item.IS_COMPLETED
    ).length;
    const requiredItems = record.checklistItems.filter(
      (item) => item.IS_REQUIRED
    );
    const completedRequired = requiredItems.filter(
      (item) => item.IS_COMPLETED
    ).length;

    // Time efficiency calculation
    const estimatedTime = record.checklistItems.reduce((sum, item) => {
      return sum + (item.ESTIMATED_TIME || 0);
    }, 0);

    const actualTime = record.TOTAL_WORKING_HOURS * 60; // Convert to minutes
    const timeEfficiency =
      estimatedTime > 0 ? Math.round((actualTime / estimatedTime) * 100) : 0;

    // Quality score calculation (if quality ratings exist)
    const itemsWithRating = record.checklistItems.filter(
      (item) => item.IS_COMPLETED && typeof item.QUALITY_RATING === "number"
    );

    const qualityScore =
      itemsWithRating.length > 0
        ? itemsWithRating.reduce(
            (sum, item) => sum + (item.QUALITY_RATING || 0),
            0
          ) / itemsWithRating.length
        : undefined;

    return {
      overall: total > 0 ? Math.round((completed / total) * 100) : 0,
      required:
        requiredItems.length > 0
          ? Math.round((completedRequired / requiredItems.length) * 100)
          : 100,
      completed,
      total,
      timeEfficiency,
      qualityScore,
    };
  }

  // =================== CACHE MANAGEMENT ===================

  // ລ້າງ cache ທັງໝົດ
  clearCache(): void {
    console.log("Clearing all checklist cache");
    // Implementation depends on apiService cache structure
  }

  // ລ້າງ cache templates
  clearTemplatesCache(): void {
    console.log("Clearing templates cache");
    // Implementation depends on apiService cache structure
  }

  // ລ້າງ cache record
  clearRecordCache(recordId?: string): void {
    if (recordId) {
      console.log("Clearing record cache for:", recordId);
    } else {
      console.log("Clearing all record cache");
    }
    // Implementation depends on apiService cache structure
  }
}

// Export singleton instance
export const checklistService = new ChecklistService();

// Export additional utilities
export {
  transformTemplateData,
  transformRecordData,
  handleChecklistError,
  CONFIG as CHECKLIST_CONFIG,
};

// Export types
export type {
  ChecklistServiceOptions,
  ValidationResult,
  ProgressCalculation,
  BulkUpdateRequest,
  ExportOptions,
  ChecklistItemUpdateResponse,
};

// Export default
export default checklistService;
