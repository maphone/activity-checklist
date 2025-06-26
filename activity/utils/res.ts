// utils/res.ts - Activity utility functions with Enhanced API Response Handling
import { Activity } from "../types/types";

// ========= API Response Handling =========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
  pagination?: any;
}

interface ResponseHandlerOptions {
  context?: string;
  expectedType?: "array" | "object" | "any";
  logResponse?: boolean;
}

// Enhanced API Response Handler
export const handleApiResponse = <T = any>(
  response: any,
  options: ResponseHandlerOptions = {}
): ApiResponse<T> => {
  const {
    context = "API Response",
    expectedType = "any",
    logResponse = true,
  } = options;

  if (logResponse) {
    console.log(`🔍 [${context}] Raw response:`, response);
  }

  // Handle null/undefined response
  if (response === null || response === undefined) {
    console.warn(`⚠️ [${context}] Response is null/undefined`);
    return {
      success: false,
      data: undefined,
      message: "ບໍ່ມີຂໍ້ມູນຕອບກັບ",
      error: "No response data",
    };
  }

  // If response is already in ApiResponse format
  if (typeof response === "object" && "success" in response) {
    console.log(`✅ [${context}] Response already in ApiResponse format`);

    // Validate data type if specified
    if (
      expectedType === "array" &&
      response.data &&
      !Array.isArray(response.data)
    ) {
      // Try to find array in nested properties
      const arrayFields = [
        "items",
        "results",
        "data",
        "activities",
        "categories",
        "teamMembers",
        "templates",
      ];
      for (const field of arrayFields) {
        if (response.data[field] && Array.isArray(response.data[field])) {
          console.log(`🔄 [${context}] Found array in ${field} property`);
          return {
            ...response,
            data: response.data[field] as T,
          };
        }
      }

      console.warn(
        `⚠️ [${context}] Expected array but got:`,
        typeof response.data
      );
      return {
        ...response,
        data: [] as T,
        message: response.message || "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ",
      };
    }

    return {
      success: response.success || false,
      data: response.data as T,
      message: response.message || (response.success ? "ສຳເລັດ" : "ບໍ່ສຳເລັດ"),
      error: response.error,
      status: response.status,
      pagination: response.pagination,
    };
  }

  // Handle direct array response
  if (Array.isArray(response)) {
    console.log(
      `✅ [${context}] Direct array response with ${response.length} items`
    );
    return {
      success: true,
      data: response as T,
      message: `ໂຫຼດຂໍ້ມູນສຳເລັດ (${response.length} ລາຍການ)`,
    };
  }

  // Handle object response that might contain the actual data
  if (typeof response === "object") {
    console.log(`🔍 [${context}] Object response, analyzing structure...`);

    // Common API response patterns
    const commonDataFields = [
      "data",
      "result",
      "results",
      "items",
      "payload",
      "content",
      "activities",
      "categories",
      "teamMembers",
      "templates",
      "records",
    ];

    const commonSuccessFields = ["success", "ok", "status", "isSuccess"];
    const commonMessageFields = ["message", "msg", "description", "error"];

    // Try to determine success status
    let success = true;
    for (const field of commonSuccessFields) {
      if (field in response) {
        if (typeof response[field] === "boolean") {
          success = response[field];
          break;
        } else if (typeof response[field] === "string") {
          success =
            response[field].toLowerCase() === "success" ||
            response[field] === "ok";
          break;
        } else if (typeof response[field] === "number") {
          success = response[field] >= 200 && response[field] < 300;
          break;
        }
      }
    }

    // Try to find the actual data
    let actualData: any = undefined;
    let foundDataField = "";

    for (const field of commonDataFields) {
      if (
        field in response &&
        response[field] !== null &&
        response[field] !== undefined
      ) {
        actualData = response[field];
        foundDataField = field;
        console.log(`📦 [${context}] Found data in '${field}' property`);
        break;
      }
    }

    // If no data field found, use the entire response as data
    if (actualData === undefined) {
      actualData = response;
      foundDataField = "root";
      console.log(`📦 [${context}] Using entire response as data`);
    }

    // Validate expected type
    if (expectedType === "array" && !Array.isArray(actualData)) {
      // Try to find array within the data
      if (typeof actualData === "object" && actualData !== null) {
        for (const field of commonDataFields) {
          if (field in actualData && Array.isArray(actualData[field])) {
            actualData = actualData[field];
            foundDataField = `${foundDataField}.${field}`;
            console.log(`🔄 [${context}] Found nested array in '${field}'`);
            break;
          }
        }
      }

      // If still not array, return empty array
      if (!Array.isArray(actualData)) {
        console.warn(
          `⚠️ [${context}] Expected array but got ${typeof actualData}, returning empty array`
        );
        actualData = [];
      }
    }

    // Try to find message
    let message = "";
    for (const field of commonMessageFields) {
      if (field in response && typeof response[field] === "string") {
        message = response[field];
        break;
      }
    }

    if (!message) {
      message = success ? "ສຳເລັດ" : "ບໍ່ສຳເລັດ";
    }

    console.log(`✅ [${context}] Processed response:`, {
      success,
      dataField: foundDataField,
      dataType: Array.isArray(actualData)
        ? `array[${actualData.length}]`
        : typeof actualData,
      message,
    });

    return {
      success,
      data: actualData as T,
      message,
      error: success ? undefined : message,
      status: response.status || response.statusCode,
      pagination: response.pagination || response.paging || response.meta,
    };
  }

  // Handle primitive responses
  console.log(`⚠️ [${context}] Primitive response:`, typeof response);
  return {
    success: true,
    data: response as T,
    message: "ສຳເລັດ",
  };
};

// Enhanced Error Handler
export const handleApiError = (
  error: any,
  context: string = "API Error",
  isRetryable: boolean = false
): { message: string; error: string; retryable: boolean } => {
  console.error(`❌ [${context}] Error:`, error);

  let message = "ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດ";
  let errorCode = "";

  // Handle different error types
  if (error?.name === "AbortError") {
    return {
      message: "ການດຳເນີນການຖືກຍົກເລີກ",
      error: "AbortError",
      retryable: false,
    };
  }

  if (error?.name === "TimeoutError") {
    return {
      message: "ການເຊື່ອມຕໍ່ໝົດເວລາ",
      error: "TimeoutError",
      retryable: true,
    };
  }

  if (error?.name === "NetworkError" || error?.code === "NETWORK_ERROR") {
    return {
      message: "ບັນຫາການເຊື່ອມຕໍ່ເຄືອຂ່າຍ",
      error: "NetworkError",
      retryable: true,
    };
  }

  // Handle HTTP status codes
  if (error?.status || error?.statusCode) {
    const status = error.status || error.statusCode;
    errorCode = `HTTP_${status}`;

    switch (status) {
      case 400:
        message = "ຂໍ້ມູນທີ່ສົ່ງມາບໍ່ຖືກຕ້ອງ";
        break;
      case 401:
        message = "ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່";
        break;
      case 403:
        message = "ທ່ານບໍ່ມີສິດໃນການເຂົ້າເຖິງ";
        break;
      case 404:
        message = "ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການ";
        break;
      case 408:
        message = "ການເຊື່ອມຕໍ່ໝົດເວລາ";
        break;
      case 409:
        message = "ຂໍ້ມູນຂັດແຍ້ງກັນ";
        break;
      case 422:
        message = "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ";
        break;
      case 429:
        message = "ການຮ້ອງຂໍຫຼາຍເກີນໄປ ກະລຸນາລໍຖ້າ";
        break;
      case 500:
        message = "ຂໍ້ຜິດພາດຂອງເຊີເວີ";
        break;
      case 502:
        message = "ບໍ່ສາມາດເຊື່ອມຕໍ່ເຊີເວີໄດ້";
        break;
      case 503:
        message = "ເຊີເວີບໍ່ພ້ອມໃຫ້ບໍລິການ";
        break;
      case 504:
        message = "ເຊີເວີໝົດເວລາຕອບສະໜອງ";
        break;
      default:
        message = `ຂໍ້ຜິດພາດ HTTP ${status}`;
    }
  }

  // Handle error with message
  if (error?.message) {
    if (error.message.includes("fetch")) {
      message = "ບັນຫາການເຊື່ອມຕໍ່ເຄືອຂ່າຍ";
      errorCode = "FETCH_ERROR";
    } else if (error.message.includes("timeout")) {
      message = "ການເຊື່ອມຕໍ່ໝົດເວລາ";
      errorCode = "TIMEOUT_ERROR";
    } else if (error.message.includes("CORS")) {
      message = "ບັນຫາການຕັ້ງຄ່າເຊີເວີ (CORS)";
      errorCode = "CORS_ERROR";
    } else {
      // Use the error message if it's user-friendly
      const userFriendlyPatterns = [
        /ບໍ່.*/,
        /ກະລຸນາ.*/,
        /ຂໍ້ຜິດພາດ.*/,
        /ສຳເລັດ.*/,
        /ໄດ້.*/,
        /ມີ.*/,
      ];

      if (userFriendlyPatterns.some((pattern) => pattern.test(error.message))) {
        message = error.message;
      }
    }
  }

  // Handle API response error
  if (error?.response?.data?.message) {
    message = error.response.data.message;
  }

  // Determine if retryable
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  const retryableErrors = ["NetworkError", "TimeoutError", "FETCH_ERROR"];
  const shouldRetry =
    isRetryable ||
    retryableStatuses.includes(error?.status) ||
    retryableErrors.includes(errorCode);

  return {
    message,
    error: errorCode || error?.code || error?.name || "UNKNOWN_ERROR",
    retryable: shouldRetry,
  };
};

// Utility function to validate API response structure
export const validateApiResponse = (response: any): boolean => {
  if (!response || typeof response !== "object") {
    return false;
  }

  // Check for required fields in API response
  const hasValidStructure =
    ("success" in response && typeof response.success === "boolean") ||
    "data" in response ||
    "error" in response ||
    Array.isArray(response);

  return hasValidStructure;
};

// Helper functions สำหรับการดึงข้อมูลจาก Activity object
export const getActivityId = (activity: any): string => {
  return (
    activity.ACTIVITY_CODE ||
    activity.code ||
    activity.ACTIVITY_ID?.toString() ||
    activity.id?.toString() ||
    ""
  );
};

export const getActivityTitle = (activity: any): string => {
  return activity.TITLE || activity.title || activity.ACTIVITY_TITLE || "";
};

export const getActivityStatus = (activity: any): string => {
  return activity.STATUS || activity.status || "pending";
};

export const getActivityPriority = (activity: any): string => {
  return activity.PRIORITY || activity.priority || "medium";
};

export const getActivityDescription = (activity: any): string => {
  return activity.DESCRIPTION || activity.description || "";
};

export const getActivityCategory = (activity: any): string => {
  return (
    activity.CATEGORY_NAME_LAO ||
    activity.CAT_NAME_LAO ||
    activity.categoryName ||
    activity.CATEGORY ||
    activity.category ||
    ""
  );
};

export const getActivityAssigneeName = (activity: any): string => {
  if (activity.ASSIGNEE_FNAME && activity.ASSIGNEE_LNAME) {
    return `${activity.ASSIGNEE_FNAME} ${activity.ASSIGNEE_LNAME}`;
  }
  return activity.assigneeName || activity.ASSIGNEE_NAME || "";
};

export const getActivityCreatorName = (activity: any): string => {
  if (activity.CREATOR_FNAME && activity.CREATOR_LNAME) {
    return `${activity.CREATOR_FNAME} ${activity.CREATOR_LNAME}`;
  }
  return activity.creatorName || activity.CREATOR_NAME || "";
};

export const getActivityDueDate = (activity: any): string | null => {
  return activity.DUE_DATE || activity.dueDate || null;
};

export const getActivityStartTime = (activity: any): string | null => {
  return activity.START_TIME || activity.startTime || null;
};

export const getActivityEndTime = (activity: any): string | null => {
  return activity.END_TIME || activity.endTime || null;
};

export const getActivityEstimatedDuration = (activity: any): number => {
  const duration =
    activity.ESTIMATED_DURATION || activity.estimatedDuration || 0;
  return typeof duration === "string" ? parseInt(duration) : duration;
};

export const getActivityActualDuration = (activity: any): number => {
  const duration = activity.ACTUAL_DURATION || activity.actualDuration || 0;
  return typeof duration === "string" ? parseInt(duration) : duration;
};

export const getActivityNotes = (activity: any): string => {
  return activity.NOTES || activity.notes || "";
};

export const getActivityProgress = (activity: any): number => {
  const progress = activity.PROGRESS_PERCENTAGE || activity.progress || 0;
  return typeof progress === "string" ? parseFloat(progress) : progress;
};

export const getActivityCreatedDate = (activity: any): string | null => {
  return (
    activity.CREATED_DATE || activity.createdDate || activity.created_at || null
  );
};

export const getActivityUpdatedDate = (activity: any): string | null => {
  return (
    activity.UPDATED_DATE || activity.updatedDate || activity.updated_at || null
  );
};

// Utility functions สำหรับการตรวจสอบสถานะ
export const isActivityCompleted = (activity: any): boolean => {
  return getActivityStatus(activity) === "completed";
};

export const isActivityInProgress = (activity: any): boolean => {
  return getActivityStatus(activity) === "in_progress";
};

export const isActivityPending = (activity: any): boolean => {
  return getActivityStatus(activity) === "pending";
};

export const isActivityCancelled = (activity: any): boolean => {
  return getActivityStatus(activity) === "cancelled";
};

export const isActivityOverdue = (activity: any): boolean => {
  const status = getActivityStatus(activity);
  const dueDate = getActivityDueDate(activity);

  if (status === "completed" || status === "cancelled" || !dueDate) {
    return false;
  }

  return new Date(dueDate) < new Date();
};

export const isActivityHighPriority = (activity: any): boolean => {
  const priority = getActivityPriority(activity);
  return priority === "urgent" || priority === "high";
};

// Utility functions สำหรับการจัดรูปแบบ
export const formatActivityDuration = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)} ນາທີ`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const formatActivityDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("lo-LA");
  } catch {
    return dateString;
  }
};

export const formatActivityDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString("lo-LA");
  } catch {
    return dateString;
  }
};

// Utility functions สำหรับการประมวลผลสถิติ
export const calculateActivityStats = (activities: any[]) => {
  const total = activities.length;
  const completed = activities.filter(isActivityCompleted).length;
  const inProgress = activities.filter(isActivityInProgress).length;
  const pending = activities.filter(isActivityPending).length;
  const cancelled = activities.filter(isActivityCancelled).length;
  const overdue = activities.filter(isActivityOverdue).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    cancelled,
    overdue,
    completionRate,
    overdueRate,
  };
};

export const calculateTimeStats = (activities: any[]) => {
  const totalEstimated = activities.reduce(
    (sum, activity) => sum + getActivityEstimatedDuration(activity),
    0
  );

  const totalActual = activities.reduce(
    (sum, activity) => sum + getActivityActualDuration(activity),
    0
  );

  const efficiency =
    totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0;

  const completedActivities = activities.filter(isActivityCompleted);
  const avgCompletionTime =
    completedActivities.length > 0
      ? completedActivities.reduce(
          (sum, a) => sum + getActivityActualDuration(a),
          0
        ) / completedActivities.length
      : 0;

  return {
    totalEstimated,
    totalActual,
    efficiency,
    avgCompletionTime,
    savedTime: totalEstimated - totalActual,
  };
};

export const calculateCategoryStats = (activities: any[]) => {
  const categoryMap = new Map();

  activities.forEach((activity) => {
    const category = getActivityCategory(activity) || "ອື່ນໆ";
    const current = categoryMap.get(category) || {
      total: 0,
      completed: 0,
      timeSpent: 0,
    };

    current.total += 1;
    current.timeSpent += getActivityActualDuration(activity);

    if (isActivityCompleted(activity)) {
      current.completed += 1;
    }

    categoryMap.set(category, current);
  });

  return Array.from(categoryMap.entries())
    .map(([name, stats]) => ({
      name,
      total: stats.total,
      completed: stats.completed,
      completionRate:
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      timeSpent: stats.timeSpent,
      avgTime: stats.total > 0 ? Math.round(stats.timeSpent / stats.total) : 0,
    }))
    .sort((a, b) => b.total - a.total);
};

export const calculatePriorityStats = (activities: any[]) => {
  const priorities = {
    urgent: { count: 0, completed: 0, label: "ດ່ວນ", color: "red" },
    high: { count: 0, completed: 0, label: "ສູງ", color: "yellow" },
    medium: { count: 0, completed: 0, label: "ປານກາງ", color: "blue" },
    low: { count: 0, completed: 0, label: "ຕ່ຳ", color: "green" },
  };

  activities.forEach((activity) => {
    const priority = getActivityPriority(activity) as keyof typeof priorities;
    if (priorities[priority]) {
      priorities[priority].count += 1;
      if (isActivityCompleted(activity)) {
        priorities[priority].completed += 1;
      }
    }
  });

  return priorities;
};

// Status และ Priority options
export const statusOptions = [
  { value: "all", label: "ທຸກສະຖານະ" },
  { value: "pending", label: "ລໍຖ້າ" },
  { value: "in_progress", label: "ກຳລັງເຮັດ" },
  { value: "completed", label: "ສຳເລັດ" },
  { value: "cancelled", label: "ຍົກເລີກ" },
];

export const priorityOptions = [
  { value: "all", label: "ທຸກຄວາມສຳຄັນ" },
  { value: "urgent", label: "ດ່ວນ" },
  { value: "high", label: "ສູງ" },
  { value: "medium", label: "ປານກາງ" },
  { value: "low", label: "ຕ່ຳ" },
];

// Priority และ Status configurations
export const getPriorityConfig = (priority: string) => {
  const configs = {
    urgent: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-500",
      label: "ດ່ວນ",
      color: "#EF4444",
    },
    high: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-500",
      label: "ສູງ",
      color: "#F97316",
    },
    medium: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-500",
      label: "ປານກາງ",
      color: "#EAB308",
    },
    low: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-500",
      label: "ຕ່ຳ",
      color: "#22C55E",
    },
  } as const;

  return configs[priority as keyof typeof configs] || configs.medium;
};

export const getStatusConfig = (status: string) => {
  const configs = {
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "ສຳເລັດ",
      color: "#22C55E",
    },
    in_progress: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "ກຳລັງເຮັດ",
      color: "#3B82F6",
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "ລໍຖ້າ",
      color: "#EAB308",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "ຍົກເລີກ",
      color: "#EF4444",
    },
  } as const;

  return configs[status as keyof typeof configs] || configs.pending;
};
