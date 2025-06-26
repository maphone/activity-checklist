// types/types.ts - ปรับปรุงและลบความซ้ำซ้อน
import { DecodedToken } from "@/hooks/use-decoded-token";

// ========= Base API Types =========
export interface BaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface ApiResponse<T = any> extends BaseApiResponse<T> {}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ApiResponseWithPagination<T = any> extends BaseApiResponse<T> {
  pagination?: Pagination;
}

// ========= Union Types =========
export type ActivityPriority = "urgent" | "high" | "medium" | "low";
export type ActivityStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";
export type ChecklistFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type RecordStatus = "draft" | "submitted" | "approved" | "rejected";
export type ViewType = "activities" | "checklist" | "summary";

// ========= Core Activity Interface =========
export interface Activity {
  // Primary identifiers
  ACTIVITY_ID?: number;
  ACTIVITY_CODE?: string;
  id?: string | number;
  code?: string;

  // Core information
  TITLE?: string;
  title?: string;
  DESCRIPTION?: string | null;
  description?: string;
  PRIORITY?: ActivityPriority;
  priority?: ActivityPriority;
  STATUS?: ActivityStatus;
  status?: ActivityStatus;

  // Time management
  START_TIME?: string | null;
  startTime?: string;
  END_TIME?: string | null;
  endTime?: string;
  ESTIMATED_DURATION?: number | null;
  estimatedDuration?: number;
  ACTUAL_DURATION?: number | null;
  actualDuration?: number;
  DUE_DATE?: string | null;
  dueDate?: string;
  CREATED_DATE?: string | null;
  createdDate?: string;
  UPDATED_DATE?: string | null;
  updatedDate?: string;

  // Categories and classification
  CATEGORY_NAME_LAO?: string | null;
  CAT_NAME_LAO?: string | null;
  categoryName?: string;

  // User relations
  ASSIGNED_TO?: number | string | null;
  assignedTo?: string;
  ASSIGNEE_FNAME?: string | null;
  ASSIGNEE_LNAME?: string | null;
  assigneeName?: string;
  CREATOR_FNAME?: string | null;
  CREATOR_LNAME?: string | null;
  creatorName?: string;

  // Notes and progress
  NOTES?: string | null;
  notes?: string;
  ASSIGNEE_NOTE?: string | null;
  assigneeNote?: string;
  PROGRESS_PERCENTAGE?: string | number | null;
  progress?: number;

  // Status flags
  IS_ACTIVE?: number | boolean | null;
  isActive?: boolean;
}

// ========= Activity CRUD Interfaces =========
export interface CreateActivityData {
  title: string;
  description?: string;
  priority: ActivityPriority;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  category?: string;
  notes?: string;
  assignedTo?: string;
  assigneeNote?: string;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateActivityData extends Partial<CreateActivityData> {
  status?: ActivityStatus;
  actualDuration?: number;
  progress?: number;
  completionNote?: string;
}

export interface ActivityFilters {
  search?: string;
  status?: ActivityStatus | ActivityStatus[];
  priority?: ActivityPriority | ActivityPriority[];
  category?: string | string[];
  assignedTo?: string | string[];
  createdBy?: string | string[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  tags?: string[];
}

export interface GetActivitiesParams extends ActivityFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  include?: string[];
  exclude?: string[];
}

// ========= Category Interface =========
export interface Category {
  CAT_ID?: number;
  CAT_CODE?: string;
  CAT_NAME_LAO?: string;
  CAT_NAME_ENG?: string;
  CAT_DESCRIPTION?: string;
  IS_ACTIVE?: boolean;
  id?: number;
  code?: string;
  nameLao?: string;
  nameEng?: string;
  description?: string;
  isActive?: boolean;
}

// ========= Team Member Interface =========
export interface TeamMember {
  UDID?: string;
  NAME?: string;
  FNAME?: string;
  LNAME?: string;
  POSITION?: string;
  ROLE?: string;
  IS_ACTIVE?: boolean;
  udid?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  role?: string;
  isActive?: boolean;
}

// ========= Checklist Interfaces =========
export interface ChecklistTemplate {
  ID: string;
  TITLE: string;
  DESCRIPTION?: string;
  CATEGORY: string;
  POSITION?: string;
  IS_REQUIRED: boolean;
  FREQUENCY: ChecklistFrequency;
  ESTIMATED_TIME: number;
  ORDER_INDEX?: number;
  CREATED_AT?: string;
  UPDATED_AT?: string;
}

export interface DailyChecklistItem {
  ID?: string;
  RECORD_ID?: string;
  CHECKLIST_ID: string;
  IS_COMPLETED: boolean;
  COMPLETION_TIME?: string;
  NOTES?: string;
  QUALITY_RATING?: number;
  CREATED_AT?: string;
  UPDATED_AT?: string;

  // From template
  TITLE?: string;
  DESCRIPTION?: string;
  CATEGORY?: string;
  POSITION?: string;
  IS_REQUIRED?: boolean;
  FREQUENCY?: ChecklistFrequency;
  ESTIMATED_TIME?: number;
}

export interface DailyActivity {
  ID: string;
  RECORD_ID?: string;
  ACTIVITY_TYPE: string;
  DESCRIPTION: string;
  START_TIME?: string;
  END_TIME?: string;
  DURATION_MINUTES: number;
  LOCATION?: string;
  OUTCOME?: string;
  CREATED_AT?: string;
  UPDATED_AT?: string;
}

export interface DailyChecklistRecord {
  ID?: string;
  UDID: string;
  RECORD_DATE: string;
  EMPLOYEE_NAME: string;
  POSITION: string;
  BRANCH_NAME: string;
  TOTAL_WORKING_HOURS: number;
  NOTES: string;
  STATUS: RecordStatus;
  SUBMITTED_AT?: string;
  APPROVED_AT?: string;
  CREATED_AT?: string;
  UPDATED_AT?: string;

  checklistItems: DailyChecklistItem[];
  activities: DailyActivity[];
}

// ========= Statistics Interfaces =========
export interface ActivityStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
  overdueRate: number;
}

export interface TimeStats {
  totalEstimated: number;
  totalActual: number;
  efficiency: number;
  avgCompletionTime: number;
  savedTime: number;
}

export interface CategoryStats {
  name: string;
  total: number;
  completed: number;
  completionRate: number;
  timeSpent: number;
  avgTime: number;
}

export interface WorkStatistics {
  TOTAL_RECORDS: number;
  SUBMITTED_RECORDS: number;
  APPROVED_RECORDS: number;
  REJECTED_RECORDS: number;
  DRAFT_RECORDS: number;
  AVG_COMPLETION: number;
  TOTAL_HOURS: number;
  PRODUCTIVITY_SCORE?: number;
  QUALITY_SCORE?: number;
}

// ========= Component Props =========
export interface ActivityListPageProps {
  activities: Activity[];
  categories: Category[];
  teamMembers: TeamMember[];
  currentUser: DecodedToken | null;
  isLoading: boolean;
  error?: string | null;
  pagination?: Pagination | null;
  onShowAddActivityChange: (show: boolean) => void;
  onRefresh: () => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => Promise<any>;
}

export interface ChecklistPageProps {
  selectedDate?: string;
  currentUser?: DecodedToken | null;
  onStatusChange?: (status: RecordStatus) => void;
}

export interface SummaryPageProps {
  selectedDate: string;
  activities: Activity[];
  currentUser: DecodedToken | null;
  checklistRecord?: DailyChecklistRecord;
}

// ========= UI Component Props =========
export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  color?: "blue" | "red" | "green" | "yellow" | "purple";
  comparison?: string;
  loading?: boolean;
}

export interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: "blue" | "red" | "green" | "yellow" | "purple";
}

export interface EnhancedProgressBarProps {
  label: string;
  current: number;
  total: number;
  percentage: number;
  color?: "blue" | "red" | "green" | "yellow" | "purple";
  showDetails?: boolean;
  animationDelay?: number;
}

export interface InsightCardProps {
  type: "info" | "warning" | "success" | "danger";
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ComparisonChartProps {
  data: Array<{
    name: string;
    value: number;
    total?: number;
  }>;
  title: string;
}

// ========= Hook Return Types =========
export interface UseActivitiesReturn {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  errorDetails?: unknown;
  pagination: Pagination | null;
  lastFetch: Date | null;
  refetch: (
    params?: GetActivitiesParams,
    forceRefresh?: boolean
  ) => Promise<void>;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  createActivity: (
    data: CreateActivityData
  ) => Promise<BaseApiResponse<Activity>>;
  updateActivity: (
    id: string,
    data: UpdateActivityData
  ) => Promise<BaseApiResponse<Activity>>;
  deleteActivity: (id: string) => Promise<BaseApiResponse<void>>;
  clearCache: () => void;
  clearError: () => void;
  cacheStats?: { size: number; maxSize: number; usage: string };
}

export interface UseChecklistReturn {
  templates: ChecklistTemplate[];
  dailyRecord: DailyChecklistRecord | null;
  summary: unknown[];
  statistics: WorkStatistics | null;
  pendingApprovals: unknown[];
  isLoading: boolean;
  isSubmitting: boolean;
  isUpdating: boolean;
  loadTemplates: (position?: string) => Promise<void>;
  loadDailyRecord: (date?: string) => Promise<void>;
  createOrUpdateRecord: (data: any) => Promise<void>;
  updateChecklistItem: (checklistId: string, data: any) => Promise<void>;
  toggleChecklistItem: (checklistId: string) => Promise<void>;
  addActivity: (activity: Omit<DailyActivity, "ID">) => void;
  removeActivity: (activityId: string) => void;
  saveDraft: () => Promise<void>;
  submitForApproval: () => Promise<void>;
  deleteRecord: () => Promise<void>;
  updateNotes: (notes: string) => void;
  updateItemNotes: (checklistId: string, notes: string) => void;
  setDailyRecord: (record: DailyChecklistRecord | null) => void;
  completionPercentage: number;
  requiredItemsCompletion: { completed: number; total: number };
  totalEstimatedTime: number;
  completedTime: number;
  canSubmit: boolean;
  error: string | null;
  clearError: () => void;
}

// ========= Navigation and UI Types =========
export interface TabConfig {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
  disabled?: boolean;
}

// ========= Constants =========
export const ACTIVITY_PRIORITIES: {
  value: ActivityPriority;
  label: string;
  color: string;
  icon: string;
}[] = [
  { value: "urgent", label: "ດ່ວນ", color: "red", icon: "🔴" },
  { value: "high", label: "ສູງ", color: "orange", icon: "🟠" },
  { value: "medium", label: "ປານກາງ", color: "yellow", icon: "🟡" },
  { value: "low", label: "ຕ່ຳ", color: "green", icon: "🟢" },
];

export const ACTIVITY_STATUSES: {
  value: ActivityStatus;
  label: string;
  color: string;
  icon: string;
}[] = [
  { value: "pending", label: "ລໍຖ້າ", color: "yellow", icon: "⏳" },
  { value: "in_progress", label: "ກຳລັງເຮັດ", color: "blue", icon: "🔄" },
  { value: "completed", label: "ສຳເລັດ", color: "green", icon: "✅" },
  { value: "cancelled", label: "ຍົກເລີກ", color: "red", icon: "❌" },
];

export const RECORD_STATUSES: {
  value: RecordStatus;
  label: string;
  color: string;
}[] = [
  { value: "draft", label: "ຮ່າງ", color: "gray" },
  { value: "submitted", label: "ລໍຖ້າການອະນຸມັດ", color: "yellow" },
  { value: "approved", label: "ອະນຸມັດແລ້ວ", color: "green" },
  { value: "rejected", label: "ປະຕິເສດ", color: "red" },
];

// ========= Utility Types =========
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
