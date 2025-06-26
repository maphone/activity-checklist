
// hooks/useCheckList.ts - COMPLETELY FIXED VERSION
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import checkListService from "../services/checkListService";
import { getDecodedToken } from "@/hooks/use-decoded-token";
import { useSimpleToast } from "./useToastContext";

// 🔧 FIXED: Simple and reliable normalize functions
const normalizeTemplate = (template: any) => ({
  ID: template.ID || template.id,
  TITLE: template.TITLE || template.title,
  DESCRIPTION: template.DESCRIPTION || template.description,
  CATEGORY: template.CATEGORY || template.category,
  POSITION: template.POSITION || template.position,
  IS_REQUIRED: Boolean(template.IS_REQUIRED || template.isRequired),
  FREQUENCY: template.FREQUENCY || template.frequency || "daily",
  ESTIMATED_TIME: Number(
    template.ESTIMATED_TIME || template.estimatedTime || 0
  ),
  ORDER_INDEX: Number(template.ORDER_INDEX || template.orderIndex || 0),
  CREATED_AT: template.CREATED_AT || template.createdAt,
  UPDATED_AT: template.UPDATED_AT || template.updatedAt,
});

const normalizeChecklistItem = (item: any, template?: any) => ({
  ID: item.ID || item.id || `temp-${Date.now()}-${Math.random()}`,
  RECORD_ID: item.RECORD_ID || item.recordId || "",
  CHECKLIST_ID: item.CHECKLIST_ID || item.checklistId || template?.ID,
  IS_COMPLETED: Boolean(item.IS_COMPLETED || item.isCompleted),
  COMPLETION_TIME: item.COMPLETION_TIME || item.completionTime,
  NOTES: item.NOTES || item.notes || "",
  QUALITY_RATING: item.QUALITY_RATING || item.qualityRating,
  CREATED_AT: item.CREATED_AT || item.createdAt || new Date().toISOString(),
  UPDATED_AT: item.UPDATED_AT || item.updatedAt || new Date().toISOString(),
  // Template fields
  TITLE: item.TITLE || item.title || template?.TITLE,
  DESCRIPTION: item.DESCRIPTION || item.description || template?.DESCRIPTION,
  CATEGORY: item.CATEGORY || item.category || template?.CATEGORY,
  POSITION: item.POSITION || item.position || template?.POSITION,
  IS_REQUIRED: Boolean(
    item.IS_REQUIRED ?? item.isRequired ?? template?.IS_REQUIRED
  ),
  FREQUENCY: item.FREQUENCY || item.frequency || template?.FREQUENCY || "daily",
  ESTIMATED_TIME: Number(
    item.ESTIMATED_TIME || item.estimatedTime || template?.ESTIMATED_TIME || 0
  ),
});

// 🔧 FIXED: Main hook with strict controls
export const useChecklist = (options = {}) => {
  const { initialDate, autoFetch = false } = options;

  // 🔧 Core state
  const [templates, setTemplates] = useState([]);
  const [dailyRecord, setDailyRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  // 🔧 Control flags to prevent loops
  const initializedRef = useRef(false);
  const loadingTemplatesRef = useRef(false);
  const loadingRecordRef = useRef(false);
  const currentDateRef = useRef("");
  const templatesLoadedRef = useRef(false);

  const { success, error: showError } = useSimpleToast();

  // 🔧 FIXED: Single initialization
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Load templates
        await loadTemplatesOnce();

        // Step 2: Load daily record
        const dateToLoad =
          initialDate || new Date().toISOString().split("T")[0];
        await loadDailyRecordOnce(dateToLoad);
      } catch (err) {
        console.error("❌ CHECKLIST INITIALIZATION FAILED:", err);
        setError(err.message || "Failed to initialize");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []); // EMPTY DEPENDENCY ARRAY

  // 🔧 FIXED: Load templates once
  const loadTemplatesOnce = useCallback(async () => {
    if (loadingTemplatesRef.current || templatesLoadedRef.current) {
      console.log("📋 Templates already loading/loaded, skipping");
      return templates;
    }

    loadingTemplatesRef.current = true;

    try {
      const response = await checkListService.getChecklistTemplates();

      if (response.success) {
        let templatesData = [];

        // Handle different response structures
        if (Array.isArray(response.data)) {
          templatesData = response.data;
        } else if (response.data?.templates) {
          templatesData = response.data.templates;
        } else if (response.data?.items) {
          templatesData = response.data.items;
        }

        console.log("📋 Raw templates data:", templatesData);

        const normalizedTemplates = templatesData.map(normalizeTemplate);
        console.log("📋 Normalized templates:", normalizedTemplates);

        setTemplates(normalizedTemplates);
        templatesLoadedRef.current = true;

        return normalizedTemplates;
      } else {
        throw new Error(response.message || "Failed to load templates");
      }
    } catch (error) {
      console.error("❌ Failed to load templates:", error);
      setError("ບໍ່ສາມາດໂຫຼດ Templates ໄດ້");
      return [];
    } finally {
      loadingTemplatesRef.current = false;
    }
  }, []);

  // 🔧 FIXED: Load daily record once
  const loadDailyRecordOnce = useCallback(
    async (date, templatesList) => {
      if (loadingRecordRef.current || currentDateRef.current === date) {
        console.log("📋 Record already loading/loaded for date:", date);
        return;
      }

      loadingRecordRef.current = true;
      currentDateRef.current = date;

      try {
        console.log("📋 Loading daily record for date:", date);

        const [userInfo, recordResponse] = await Promise.all([
          getDecodedToken().catch(() => null),
          checkListService
            .getDailyRecord(date)
            .catch((err) => ({ success: false, error: err })),
        ]);

        let record = null;

        if (recordResponse.success && recordResponse.data) {
          // Use existing record
          record = recordResponse.data;
        } else {
          // Create new record structure
          const templatesToUse = templatesList || templates;

          record = {
            ID: "",
            UDID: userInfo?.udid || "",
            RECORD_DATE: date,
            EMPLOYEE_NAME: userInfo
              ? `${userInfo.firstName} ${userInfo.lastName}`
              : "",
            POSITION: userInfo?.position || "",
            BRANCH_NAME: userInfo?.branch || "",
            BRANCH_CODE: userInfo?.branchCode || "",
            TOTAL_WORKING_HOURS: 8,
            NOTES: "",
            STATUS: "draft",
            CREATED_AT: new Date().toISOString(),
            UPDATED_AT: new Date().toISOString(),
            checklistItems: templatesToUse.map((template) =>
              normalizeChecklistItem({}, template)
            ),
            activities: [],
          };
        }

        // Normalize the final record
        const normalizedRecord = {
          ...record,
          checklistItems: (record.checklistItems || []).map((item) =>
            normalizeChecklistItem(item)
          ),
        };

        setDailyRecord(normalizedRecord);
      } catch (error) {
        console.error("❌ Failed to load daily record:", error);
        setError("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນປະຈຳວັນໄດ້");
      } finally {
        loadingRecordRef.current = false;
      }
    },
    [templates]
  );

  // 🔧 Manual load functions (for external use)
  const loadTemplates = useCallback(
    async (position) => {
      templatesLoadedRef.current = false;
      return await loadTemplatesOnce();
    },
    [loadTemplatesOnce]
  );

  const loadDailyRecord = useCallback(
    async (date) => {
      currentDateRef.current = "";
      return await loadDailyRecordOnce(date);
    },
    [loadDailyRecordOnce]
  );

  // 🔧 Toggle checklist item - FIXED
  const toggleChecklistItem = useCallback(
    async (checklistId) => {
      if (!dailyRecord || isUpdating) return;

      const item = dailyRecord.checklistItems?.find(
        (item) => item.CHECKLIST_ID === checklistId
      );
      if (!item) return;

      try {
        setIsUpdating(true);

        // Optimistic update
        setDailyRecord((prev) => ({
          ...prev,
          checklistItems: prev.checklistItems.map((item) =>
            item.CHECKLIST_ID === checklistId
              ? {
                  ...item,
                  IS_COMPLETED: !item.IS_COMPLETED,
                  COMPLETION_TIME: !item.IS_COMPLETED
                    ? new Date().toISOString()
                    : null,
                  UPDATED_AT: new Date().toISOString(),
                }
              : item
          ),
        }));

        console.log(
          "📋 Toggling item:",
          checklistId,
          "to:",
          !item.IS_COMPLETED
        );

        let recordId = dailyRecord.ID;

        // If no record ID, create record first
        if (!recordId) {
          const user = await getDecodedToken();
          const recordData = {
            id: dailyRecord.ID,
            date: dailyRecord.RECORD_DATE,
            udid: user?.udid || dailyRecord.UDID,
            employeeName: dailyRecord.EMPLOYEE_NAME || `${user?.firstName} ${user?.lastName}`,
            position: dailyRecord.POSITION || user?.position,
            branchCode: dailyRecord.BRANCH_CODE || user?.branchCode || '',
            branchName: dailyRecord.BRANCH_NAME || user?.branchName || user?.branch,
            totalWorkingHours: dailyRecord.TOTAL_WORKING_HOURS || 8,
            notes: dailyRecord.NOTES || '',
            status: "draft",
            checklistItems: dailyRecord.checklistItems.map((item) => ({
              id: item.ID,
              checklistId: item.CHECKLIST_ID,
              isCompleted:
                item.CHECKLIST_ID === checklistId
                  ? !item.IS_COMPLETED
                  : item.IS_COMPLETED,
              notes: item.NOTES || '',
              completionTime: item.COMPLETION_TIME,
              qualityRating: item.QUALITY_RATING
            })),
            activities: dailyRecord.activities || []
          };

          const response = await checkListService.createOrUpdateDailyRecord(
            recordData
          );

          if (response.success && response.data) {
            recordId = response.data.ID;
            const newRecord = {
              ...response.data,
              checklistItems: (response.data.checklistItems || []).map((item) =>
                normalizeChecklistItem(item)
              ),
            };
            setDailyRecord(newRecord);
            success?.("ບັນທຶກຂໍ້ມູນສຳເລັດ");
          } else {
            throw new Error(response.message || "Failed to create record");
          }
        } else {
          // Update existing record item
          const response = await checkListService.updateChecklistItem(
            recordId,
            checklistId,
            {
              isCompleted: !item.IS_COMPLETED,
              notes: item.NOTES || "",
            }
          );

          if (response.success) {
            success?.("ອັບເດດສຳເລັດ");

            // Update record ID if returned
            if (response.recordId && response.recordId !== recordId) {
              setDailyRecord((prev) => ({
                ...prev,
                ID: response.recordId,
              }));
            }
          } else {
            throw new Error(response.message || "Failed to update");
          }
        }
      } catch (error) {
        console.error("❌ Failed to toggle item:", error);
        showError?.("ບໍ່ສາມາດອັບເດດໄດ້");
        // Revert optimistic update
        await loadDailyRecordOnce(dailyRecord.RECORD_DATE);
      } finally {
        setIsUpdating(false);
      }
    },
    [dailyRecord, isUpdating, success, showError, loadDailyRecordOnce]
  );

  // Update item notes
  const updateItemNotes = useCallback(
    async (checklistId: string, notes: string) => {
      if (!dailyRecord || !dailyRecord.ID) return;

      try {
        // Update local state immediately
        setDailyRecord((prev) => ({
          ...prev,
          checklistItems: prev.checklistItems.map((item) =>
            item.CHECKLIST_ID === checklistId
              ? { ...item, NOTES: notes }
              : item
          ),
        }));

        // Update on server
        await checkListService.updateChecklistItem(
          dailyRecord.ID,
          checklistId,
          { notes }
        );
      } catch (error) {
        console.error("Failed to update notes:", error);
      }
    },
    [dailyRecord]
  );

  // Update notes for entire record
  const updateNotes = useCallback(
    (notes: string) => {
      if (!dailyRecord) return;
      
      setDailyRecord((prev) => ({
        ...prev,
        NOTES: notes,
      }));
    },
    [dailyRecord]
  );

  // Add activity
  const addActivity = useCallback(
    (activity: any) => {
      if (!dailyRecord) return;
      
      const newActivity = {
        ID: `temp-activity-${Date.now()}`,
        RECORD_ID: dailyRecord.ID || '',
        ...activity,
        CREATED_AT: new Date().toISOString(),
        UPDATED_AT: new Date().toISOString(),
      };
      
      setDailyRecord((prev) => ({
        ...prev,
        activities: [...(prev.activities || []), newActivity],
      }));
    },
    [dailyRecord]
  );

  // Remove activity
  const removeActivity = useCallback(
    (activityId: string) => {
      if (!dailyRecord) return;
      
      setDailyRecord((prev) => ({
        ...prev,
        activities: (prev.activities || []).filter((a) => a.ID !== activityId),
      }));
    },
    [dailyRecord]
  );

  // Delete record
  const deleteRecord = useCallback(async () => {
    if (!dailyRecord || !dailyRecord.ID || isUpdating) return;

    try {
      setIsUpdating(true);
      
      const response = await checkListService.deleteDailyRecord(dailyRecord.ID);
      
      if (response.success) {
        // Reset to empty state
        await loadDailyRecordOnce(dailyRecord.RECORD_DATE);
        success?.("ລົບບັນທຶກສຳເລັດ");
      } else {
        throw new Error(response.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
      showError?.("ບໍ່ສາມາດລົບບັນທຶກໄດ້");
    } finally {
      setIsUpdating(false);
    }
  }, [dailyRecord, isUpdating, loadDailyRecordOnce, success, showError]);

  // Save draft - FIXED
  const saveDraft = useCallback(async () => {
    if (!dailyRecord || isUpdating) return;

    try {
      setIsUpdating(true);

      const user = await getDecodedToken();
      const recordData = {
        id: dailyRecord.ID,
        date: dailyRecord.RECORD_DATE,
        udid: user?.udid || dailyRecord.UDID,
        employeeName: dailyRecord.EMPLOYEE_NAME || `${user?.firstName} ${user?.lastName}`,
        position: dailyRecord.POSITION || user?.position,
        branchCode: dailyRecord.BRANCH_CODE || user?.branchCode || '',
        branchName: dailyRecord.BRANCH_NAME || user?.branchName || user?.branch,
        totalWorkingHours: dailyRecord.TOTAL_WORKING_HOURS || 8,
        notes: dailyRecord.NOTES || '',
        status: "draft",
        checklistItems: dailyRecord.checklistItems.map((item) => ({
          id: item.ID,
          checklistId: item.CHECKLIST_ID,
          isCompleted: item.IS_COMPLETED || false,
          notes: item.NOTES || '',
          completionTime: item.COMPLETION_TIME,
          qualityRating: item.QUALITY_RATING
        })),
        activities: (dailyRecord.activities || []).map((activity) => ({
          id: activity.ID,
          activityType: activity.ACTIVITY_TYPE,
          description: activity.DESCRIPTION,
          startTime: activity.START_TIME,
          endTime: activity.END_TIME,
          durationMinutes: activity.DURATION_MINUTES,
          location: activity.LOCATION,
          participants: activity.PARTICIPANTS || [],
          outcome: activity.OUTCOME
        }))
      };

      const response = await checkListService.createOrUpdateDailyRecord(
        recordData
      );

      if (response.success && response.data) {
        const updatedRecord = {
          ...response.data,
          checklistItems: (response.data.checklistItems || []).map((item) =>
            normalizeChecklistItem(item)
          ),
        };
        setDailyRecord(updatedRecord);
        success?.("ບັນທຶກຮ່າງສຳເລັດ");
      } else {
        throw new Error(response.message || "Failed to save draft");
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      showError?.("ບໍ່ສາມາດບັນທຶກຮ່າງໄດ້");
    } finally {
      setIsUpdating(false);
    }
  }, [dailyRecord, isUpdating, success, showError]);

  // Computed values
  const completionPercentage = useMemo(() => {
    if (!dailyRecord?.checklistItems?.length) return 0;
    const completed = dailyRecord.checklistItems.filter(
      (item) => item.IS_COMPLETED
    ).length;
    return Math.round((completed / dailyRecord.checklistItems.length) * 100);
  }, [dailyRecord?.checklistItems]);

  const requiredItemsCompletion = useMemo(() => {
    if (!dailyRecord?.checklistItems?.length) return { completed: 0, total: 0 };
    const requiredItems = dailyRecord.checklistItems.filter(
      (item) => item.IS_REQUIRED
    );
    const completedRequired = requiredItems.filter((item) => item.IS_COMPLETED);
    return {
      completed: completedRequired.length,
      total: requiredItems.length,
    };
  }, [dailyRecord?.checklistItems]);

  const canSubmit = useMemo(() => {
    if (!dailyRecord) return false;
    return (
      dailyRecord.STATUS === "draft" &&
      requiredItemsCompletion.completed === requiredItemsCompletion.total &&
      requiredItemsCompletion.total > 0
    );
  }, [dailyRecord, requiredItemsCompletion]);

  // Calculate time statistics
  const totalEstimatedTime = useMemo(() => {
    if (!dailyRecord?.checklistItems?.length) return 0;
    return dailyRecord.checklistItems.reduce(
      (sum, item) => sum + (item.ESTIMATED_TIME || 0),
      0
    );
  }, [dailyRecord?.checklistItems]);

  const completedTime = useMemo(() => {
    if (!dailyRecord?.checklistItems?.length) return 0;
    return dailyRecord.checklistItems
      .filter((item) => item.IS_COMPLETED)
      .reduce((sum, item) => sum + (item.ESTIMATED_TIME || 0), 0);
  }, [dailyRecord?.checklistItems]);

  // Submit for approval
  const submitForApproval = useCallback(async () => {
    if (!dailyRecord || !dailyRecord.ID || isUpdating) return;
    
    // Calculate canSubmit locally
    const canSubmitNow = dailyRecord.STATUS === "draft" &&
      requiredItemsCompletion.completed === requiredItemsCompletion.total &&
      requiredItemsCompletion.total > 0;
      
    if (!canSubmitNow) return;

    try {
      setIsUpdating(true);

      // First save all data
      await saveDraft();

      // Then submit
      const response = await checkListService.submitDailyRecord(dailyRecord.ID);

      if (response.success) {
        setDailyRecord((prev) => ({
          ...prev,
          STATUS: "submitted",
          SUBMITTED_AT: new Date().toISOString(),
        }));
        success?.("ສົ່ງເພື່ອການອະນຸມັດສຳເລັດ");
      } else {
        throw new Error(response.message || "Failed to submit");
      }
    } catch (error) {
      console.error("Failed to submit:", error);
      showError?.("ບໍ່ສາມາດສົ່ງເພື່ອການອະນຸມັດໄດ້");
    } finally {
      setIsUpdating(false);
    }
  }, [dailyRecord, requiredItemsCompletion, isUpdating, saveDraft, success, showError]);

  // Debug logging
  useEffect(() => {
    console.log("📋 CHECKLIST STATE UPDATE:", {
      templatesCount: templates.length,
      hasRecord: !!dailyRecord,
      checklistItemsCount: dailyRecord?.checklistItems?.length || 0,
      isLoading,
      error,
      completionPercentage,
    });
  }, [templates, dailyRecord, isLoading, error, completionPercentage]);

  return {
    // Data
    templates,
    dailyRecord,

    // Loading states
    isLoading,
    isUpdating,
    isSubmitting: isUpdating, // Add alias for compatibility

    // Actions
    loadTemplates,
    loadDailyRecord,
    toggleChecklistItem,
    updateItemNotes,
    updateNotes,
    addActivity,
    removeActivity,
    saveDraft,
    submitForApproval,
    deleteRecord,
    createOrUpdateRecord: saveDraft, // Add alias for compatibility
    setDailyRecord, // Export for external use

    // Computed values
    completionPercentage,
    requiredItemsCompletion,
    canSubmit,
    totalEstimatedTime,
    completedTime,

    // Additional computed values for compatibility
    summary: [], // Empty array for now
    statistics: null, // Null for now
    pendingApprovals: [], // Empty array for now

    // Error handling
    error,
    clearError: useCallback(() => setError(null), []),
  };
};
