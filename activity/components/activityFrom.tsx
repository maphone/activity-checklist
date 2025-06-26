// components/ActivityForm.tsx - Enhanced with improved data handling
"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Save,
  X,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Target,
  FileText,
  Loader2,
  Check,
  Info,
  Zap,
} from "lucide-react";

// Enhanced interfaces
interface ActivityFormProps {
  onSubmit: (data: any) => Promise<any>;
  onCancel: () => void;
  initialData?: any | null;
  categories?: any[];
  teamMembers?: any[];
  currentUser?: any | null;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
}

// Helper functions to extract data consistently
const getActivityField = (activity: any, field: string, fallback: any = "") => {
  // Try uppercase field first (API format), then lowercase (normalized format)
  return (
    activity?.[field.toUpperCase()] ??
    activity?.[field.toLowerCase()] ??
    activity?.[field] ??
    fallback
  );
};

const getCategoryName = (category: any): string => {
  return category?.CAT_NAME_LAO || category?.nameLao || category?.name || "";
};

const getCategoryCode = (category: any): string => {
  return (
    category?.CAT_CODE ||
    category?.code ||
    category?.CAT_ID?.toString() ||
    category?.id?.toString() ||
    ""
  );
};

const getTeamMemberName = (member: any): string => {
  if (member?.FNAME && member?.LNAME) {
    return `${member.FNAME} ${member.LNAME}`;
  }
  return member?.NAME || member?.name || (member?.firstName && member?.lastName)
    ? `${member.firstName} ${member.lastName}`
    : "";
};

const getTeamMemberUDID = (member: any): string => {
  return member?.UDID || member?.udid || member?.id?.toString() || "";
};

const getTeamMemberPosition = (member: any): string => {
  return member?.POSITION || member?.position || "";
};

// Validation Message Component
const ValidationMessage = ({ message, type = "error" }) => {
  const styles = {
    error: "text-red-600 bg-red-50 border-red-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    success: "text-green-600 bg-green-50 border-green-200",
    info: "text-blue-600 bg-blue-50 border-blue-200",
  };

  const icons = {
    error: AlertCircle,
    warning: AlertCircle,
    success: Check,
    info: Info,
  };

  const Icon = icons[type];

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-md border text-sm ${styles[type]}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// Enhanced Input Component
const EnhancedInput = ({
  label,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  icon: Icon,
  suffix,
  maxLength,
  onBlur,
  autoComplete = "off",
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  const handleBlur = useCallback(
    (e) => {
      setFocused(false);
      setTouched(true);
      onBlur?.(e);
    },
    [onBlur]
  );

  const showError = error && touched;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        )}

        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} ${
            suffix ? "pr-12" : "pr-4"
          } py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 ${
            showError
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : focused
              ? "border-blue-500 focus:ring-blue-500 focus:border-blue-500"
              : "border-gray-300 hover:border-gray-400"
          } ${
            disabled
              ? "bg-gray-50 text-gray-500 cursor-not-allowed"
              : "bg-white"
          }`}
          {...props}
        />

        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
            {suffix}
          </div>
        )}

        {maxLength && (
          <div className="absolute right-3 bottom-1 text-xs text-gray-400">
            {value?.length || 0}/{maxLength}
          </div>
        )}
      </div>

      {showError && <ValidationMessage message={error} type="error" />}
    </div>
  );
};

// Enhanced Select Component
const EnhancedSelect = ({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  placeholder = "ເລືອກ...",
  disabled = false,
  icon: Icon,
  emptyMessage = "ບໍ່ມີຕົວເລືອກ",
}) => {
  const [touched, setTouched] = useState(false);
  const showError = error && touched;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
        )}

        <select
          value={value}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          className={`w-full ${
            Icon ? "pl-10" : "pl-4"
          } pr-8 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 appearance-none bg-white ${
            showError
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
          } ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
        >
          <option value="">{placeholder}</option>
          {options.length === 0 ? (
            <option disabled>{emptyMessage}</option>
          ) : (
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          )}
        </select>

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {showError && <ValidationMessage message={error} type="error" />}
    </div>
  );
};

// Enhanced Textarea Component
const EnhancedTextarea = ({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  rows = 3,
  maxLength,
  showWordCount = true,
}) => {
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const showError = error && touched;

  const wordCount = value
    ? value
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <textarea
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 resize-none ${
            showError
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : focused
              ? "border-blue-500 focus:ring-blue-500 focus:border-blue-500"
              : "border-gray-300 hover:border-gray-400"
          } ${
            disabled
              ? "bg-gray-50 text-gray-500 cursor-not-allowed"
              : "bg-white"
          }`}
        />

        {showWordCount && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1">
            {maxLength
              ? `${value?.length || 0}/${maxLength}`
              : `${wordCount} ຄຳ`}
          </div>
        )}
      </div>

      {showError && <ValidationMessage message={error} type="error" />}
    </div>
  );
};

// Step Indicator Component
const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
            </div>

            <div className="ml-2">
              <p
                className={`text-sm font-medium ${
                  isActive
                    ? "text-blue-600"
                    : isCompleted
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {step.title}
              </p>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`w-12 h-px mx-4 ${
                  isCompleted ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Main Activity Form Component
const ActivityForm: React.FC<ActivityFormProps> = ({
  onSubmit,
  onCancel,
  initialData = null,
  categories = [],
  teamMembers = [],
  currentUser = null,
  isSubmitting = false,
  mode = "create",
}) => {
  // Extract initial data with enhanced field mapping
  const getInitialFormData = useCallback(() => {
    if (!initialData) {
      return {
        title: "",
        description: "",
        priority: "medium",
        startTime: "",
        endTime: "",
        estimatedDuration: 30,
        category: "",
        notes: "",
        assignedTo: currentUser?.udid || currentUser?.UDID || "",
        assigneeNote: "",
        dueDate: "",
        status: "pending",
      };
    }

    // Enhanced field extraction
    const title = getActivityField(initialData, "title");
    const description = getActivityField(initialData, "description");
    const priority = getActivityField(initialData, "priority", "medium");
    const startTime =
      getActivityField(initialData, "start_time") ||
      getActivityField(initialData, "startTime");
    const endTime =
      getActivityField(initialData, "end_time") ||
      getActivityField(initialData, "endTime");
    const estimatedDuration =
      getActivityField(initialData, "estimated_duration") ||
      getActivityField(initialData, "estimatedDuration", 30);
    const category =
      getActivityField(initialData, "category_name_lao") ||
      getActivityField(initialData, "categoryName");
    const notes = getActivityField(initialData, "notes");
    const assignedTo =
      getActivityField(initialData, "assigned_to") ||
      getActivityField(initialData, "assignedTo");
    const assigneeNote =
      getActivityField(initialData, "assignee_note") ||
      getActivityField(initialData, "assigneeNote");
    const status = getActivityField(initialData, "status", "pending");

    // Handle due date
    let dueDate =
      getActivityField(initialData, "due_date") ||
      getActivityField(initialData, "dueDate");
    if (dueDate && dueDate.includes("T")) {
      dueDate = dueDate.split("T")[0];
    }

    return {
      title,
      description,
      priority,
      startTime,
      endTime,
      estimatedDuration:
        typeof estimatedDuration === "string"
          ? parseInt(estimatedDuration)
          : estimatedDuration,
      category,
      notes,
      assignedTo:
        assignedTo?.toString() || currentUser?.udid || currentUser?.UDID || "",
      assigneeNote,
      dueDate,
      status,
    };
  }, [initialData, currentUser]);

  // State Management
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(getInitialFormData);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Refs
  const formRef = useRef(null);

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [getInitialFormData]);

  // Form steps configuration
  const steps = [
    { id: "basic", title: "ຂໍ້ມູນພື້ນຖານ", icon: FileText },
    { id: "details", title: "ລາຍລະອຽດ", icon: Clock },
    { id: "assignment", title: "ການມອບໝາຍ", icon: User },
    { id: "review", title: "ກວດສອບ", icon: Check },
  ];

  // Check if current user is manager
  const isManager = useMemo(() => {
    const role = currentUser?.role || currentUser?.ROLE;
    return role === "M" || role === "S";
  }, [currentUser]);

  // Priority options
  const priorityOptions = [
    { value: "low", label: "ຕ່ຳ", color: "green", icon: "🟢" },
    { value: "medium", label: "ປານກາງ", color: "yellow", icon: "🟡" },
    { value: "high", label: "ສູງ", color: "orange", icon: "🟠" },
    { value: "urgent", label: "ດ່ວນ", color: "red", icon: "🔴" },
  ];

  // Status options (for editing)
  const statusOptions = [
    { value: "pending", label: "ລໍຖ້າ" },
    { value: "in_progress", label: "ກຳລັງເຮັດ" },
    { value: "completed", label: "ສຳເລັດ" },
    { value: "cancelled", label: "ຍົກເລີກ" },
  ];

  // Process categories for dropdown
  const processedCategories = useMemo(() => {
    return Array.isArray(categories)
      ? categories
          .map((cat) => ({
            value: getCategoryName(cat),
            label: getCategoryName(cat),
          }))
          .filter((cat) => cat.value)
      : [];
  }, [categories]);

  // Process team members for dropdown
  const processedTeamMembers = useMemo(() => {
    if (!Array.isArray(teamMembers)) return [];

    const members = teamMembers
      .map((member) => ({
        value: getTeamMemberUDID(member),
        label: `${getTeamMemberName(member)}${
          getTeamMemberPosition(member)
            ? ` - ${getTeamMemberPosition(member)}`
            : ""
        }`,
      }))
      .filter((member) => member.value && member.label);

    // Add current user if not in the list
    if (currentUser) {
      const currentUserUDID = currentUser.udid || currentUser.UDID;
      const currentUserName =
        currentUser.firstName || currentUser.FNAME || "ຕົນເອງ";

      if (
        currentUserUDID &&
        !members.find((m) => m.value === currentUserUDID)
      ) {
        members.unshift({
          value: currentUserUDID,
          label: `${currentUserName} (ຕົນເອງ)`,
        });
      }
    }

    return members;
  }, [teamMembers, currentUser]);

  // Enhanced validation function
  const validateField = useCallback(
    (fieldName, value) => {
      const errors = {};

      switch (fieldName) {
        case "title":
          if (!value || value.trim().length === 0) {
            errors.title = "ກະລຸນາໃສ່ຊື່ກິດຈະກຳ";
          } else if (value.length < 3) {
            errors.title = "ຊື່ກິດຈະກຳຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ";
          } else if (value.length > 100) {
            errors.title = "ຊື່ກິດຈະກຳຕ້ອງບໍ່ເກີນ 100 ຕົວອັກສອນ";
          }
          break;

        case "estimatedDuration":
          const duration = parseInt(value);
          if (!duration || duration < 5) {
            errors.estimatedDuration = "ເວລາປະມານຕ້ອງໃຫຍ່ກວ່າ 5 ນາທີ";
          } else if (duration > 480) {
            errors.estimatedDuration = "ເວລາປະມານຕ້ອງບໍ່ເກີນ 8 ຊົ່ວໂມງ";
          }
          break;

        case "assignedTo":
          if (isManager && (!value || value.trim().length === 0)) {
            errors.assignedTo = "ກະລຸນາເລືອກຜູ້ຮັບຜິດຊອບ";
          }
          break;

        case "dueDate":
          if (value && new Date(value) <= new Date()) {
            errors.dueDate = "ວັນທີ່ກຳນົດຕ້ອງເປັນອະນາຄົດ";
          }
          break;

        case "startTime":
          if (value && formData.endTime) {
            const start = new Date(`2000-01-01T${value}`);
            const end = new Date(`2000-01-01T${formData.endTime}`);
            if (start >= end) {
              errors.startTime = "ເວລາເລີ່ມຕ້ອງກ່ອນເວລາສິ້ນສຸດ";
            }
          }
          break;

        case "endTime":
          if (value && formData.startTime) {
            const start = new Date(`2000-01-01T${formData.startTime}`);
            const end = new Date(`2000-01-01T${value}`);
            if (end <= start) {
              errors.endTime = "ເວລາສິ້ນສຸດຕ້ອງຫຼັງເວລາເລີ່ມ";
            }
          }
          break;
      }

      return errors;
    },
    [isManager, formData.startTime, formData.endTime]
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear validation errors when user starts typing
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  // Validate current step
  const validateStep = useCallback(() => {
    const fieldsToValidate = {
      0: ["title"],
      1: ["estimatedDuration"],
      2: isManager ? ["assignedTo"] : [],
      3: [],
    };

    const currentFields = fieldsToValidate[currentStep] || [];
    let stepErrors = {};

    currentFields.forEach((fieldName) => {
      const fieldErrors = validateField(fieldName, formData[fieldName]);
      stepErrors = { ...stepErrors, ...fieldErrors };
    });

    setValidationErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [currentStep, formData, validateField, isManager]);

  // Navigation functions
  const handleNextStep = useCallback(() => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }, [validateStep, steps.length]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setValidationErrors({});
  }, []);

  // Calculate duration from start/end times
  const calculatedDuration = useMemo(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? diffMinutes : null;
    }
    return null;
  }, [formData.startTime, formData.endTime]);

  // Auto-update estimated duration
  useEffect(() => {
    if (
      calculatedDuration &&
      calculatedDuration !== formData.estimatedDuration
    ) {
      setFormData((prev) => ({
        ...prev,
        estimatedDuration: calculatedDuration,
      }));
    }
  }, [calculatedDuration, formData.estimatedDuration]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateStep()) {
        return;
      }

      setIsSubmittingForm(true);

      try {
        const submissionData = {
          ...formData,
          estimatedDuration: parseInt(formData.estimatedDuration.toString()),
          assignedTo:
            formData.assignedTo || currentUser?.udid || currentUser?.UDID,
        };

        const result = await onSubmit(submissionData);
        console.log("✅ [ActivityForm] Submission result:", result);
      } catch (error) {
        console.error("❌ [ActivityForm] Submission error:", error);
      } finally {
        setIsSubmittingForm(false);
      }
    },
    [formData, validateStep, onSubmit, currentUser]
  );

  // Step render functions
  const renderBasicStep = () => (
    <div className="space-y-6">
      <EnhancedInput
        label="ຊື່ກິດຈະກຳ"
        value={formData.title}
        onChange={(e) => handleInputChange("title", e.target.value)}
        error={validationErrors.title}
        required
        placeholder="ໃສ່ຊື່ກິດຈະກຳທີ່ຊັດເຈນ..."
        icon={Target}
        maxLength={100}
      />

      <EnhancedTextarea
        label="ລາຍລະອຽດ"
        value={formData.description}
        onChange={(e) => handleInputChange("description", e.target.value)}
        placeholder="ອະທິບາຍລາຍລະອຽດກິດຈະກຳ, ເປົ້າໝາຍ, ແລະ ວິທີການ..."
        rows={4}
        maxLength={500}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ຄວາມສຳຄັນ <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange("priority", option.value)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                formData.priority === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancedInput
          label="ເວລາເລີ່ມ"
          type="time"
          value={formData.startTime}
          onChange={(e) => handleInputChange("startTime", e.target.value)}
          error={validationErrors.startTime}
          icon={Clock}
        />

        <EnhancedInput
          label="ເວລາສິ້ນສຸດ"
          type="time"
          value={formData.endTime}
          onChange={(e) => handleInputChange("endTime", e.target.value)}
          error={validationErrors.endTime}
          icon={Clock}
        />
      </div>

      <EnhancedInput
        label="ເວລາປະມານ"
        type="number"
        value={formData.estimatedDuration}
        onChange={(e) => handleInputChange("estimatedDuration", e.target.value)}
        error={validationErrors.estimatedDuration}
        required
        suffix="ນາທີ"
        min="5"
        step="5"
        icon={Clock}
      />

      {calculatedDuration &&
        calculatedDuration !== formData.estimatedDuration && (
          <ValidationMessage
            message={`ອີງຕາມເວລາທີ່ເລືອກ: ${calculatedDuration} ນາທີ`}
            type="info"
          />
        )}

      <EnhancedInput
        label="ວັນທີ່ກຳນົດສຳເລັດ"
        type="date"
        value={formData.dueDate}
        onChange={(e) => handleInputChange("dueDate", e.target.value)}
        error={validationErrors.dueDate}
        icon={Calendar}
        min={new Date().toISOString().split("T")[0]}
      />

      <EnhancedSelect
        label="ປະເພດ"
        value={formData.category}
        onChange={(e) => handleInputChange("category", e.target.value)}
        options={processedCategories}
        placeholder="ເລືອກປະເພດກິດຈະກຳ..."
        icon={Target}
        emptyMessage="ບໍ່ມີປະເພດທີ່ພ້ອມໃຊ້"
      />
    </div>
  );

  const renderAssignmentStep = () => (
    <div className="space-y-6">
      {isManager && processedTeamMembers.length > 0 && (
        <EnhancedSelect
          label="ຜູ້ຮັບຜິດຊອບ"
          value={formData.assignedTo}
          onChange={(e) => handleInputChange("assignedTo", e.target.value)}
          error={validationErrors.assignedTo}
          required={isManager}
          options={processedTeamMembers}
          placeholder="ເລືອກຜູ້ຮັບຜິດຊອບ..."
          icon={User}
        />
      )}

      {isManager &&
        formData.assignedTo &&
        formData.assignedTo !== (currentUser?.udid || currentUser?.UDID) && (
          <EnhancedTextarea
            label="ຂໍ້ຄວາມສຳລັບຜູ້ຮັບຜິດຊອບ"
            value={formData.assigneeNote}
            onChange={(e) => handleInputChange("assigneeNote", e.target.value)}
            required={
              formData.assignedTo !== (currentUser?.udid || currentUser?.UDID)
            }
            placeholder="ໃສ່ຄຳແນະນຳ, ຄວາມຄາດຫວັງ, ຫຼືລາຍລະອຽດເພີ່ມເຕີມ..."
            maxLength={200}
          />
        )}

      {mode === "edit" && (
        <EnhancedSelect
          label="ສະຖານະ"
          value={formData.status}
          onChange={(e) => handleInputChange("status", e.target.value)}
          options={statusOptions}
          icon={Info}
        />
      )}

      <EnhancedTextarea
        label="ໝາຍເຫດ"
        value={formData.notes}
        onChange={(e) => handleInputChange("notes", e.target.value)}
        placeholder="ໝາຍເຫດເພີ່ມເຕີມ, ຂໍ້ມູນອ້າງອິງ, ຫຼືຂໍ້ຄວາມສຳຄັນ..."
        maxLength={300}
      />
    </div>
  );

  const renderReviewStep = () => {
    // Find assigned team member info
    const assignedMember = processedTeamMembers.find(
      (m) => m.value === formData.assignedTo
    );
    const currentUserUDID = currentUser?.udid || currentUser?.UDID;

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5" />
            ກວດສອບຂໍ້ມູນກ່ອນສົ່ງ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">ຊື່ກິດຈະກຳ:</p>
              <p className="text-gray-900">{formData.title}</p>
            </div>

            {formData.description && (
              <div>
                <p className="font-medium text-gray-700">ລາຍລະອຽດ:</p>
                <p className="text-gray-900 line-clamp-2">
                  {formData.description}
                </p>
              </div>
            )}

            <div>
              <p className="font-medium text-gray-700">ຄວາມສຳຄັນ:</p>
              <p className="text-gray-900">
                {
                  priorityOptions.find((p) => p.value === formData.priority)
                    ?.label
                }
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-700">ເວລາປະມານ:</p>
              <p className="text-gray-900">{formData.estimatedDuration} ນາທີ</p>
            </div>

            {formData.startTime && (
              <div>
                <p className="font-medium text-gray-700">ເວລາ:</p>
                <p className="text-gray-900">
                  {formData.startTime}{" "}
                  {formData.endTime && `- ${formData.endTime}`}
                </p>
              </div>
            )}

            {formData.dueDate && (
              <div>
                <p className="font-medium text-gray-700">ກຳນົດສຳເລັດ:</p>
                <p className="text-gray-900">
                  {new Date(formData.dueDate).toLocaleDateString("lo-LA")}
                </p>
              </div>
            )}

            {formData.category && (
              <div>
                <p className="font-medium text-gray-700">ປະເພດ:</p>
                <p className="text-gray-900">{formData.category}</p>
              </div>
            )}

            {isManager && formData.assignedTo && (
              <div>
                <p className="font-medium text-gray-700">ຜູ້ຮັບຜິດຊອບ:</p>
                <p className="text-gray-900">
                  {formData.assignedTo === currentUserUDID
                    ? "ຕົນເອງ"
                    : assignedMember?.label || "ບໍ່ລະບຸ"}
                </p>
              </div>
            )}

            {mode === "edit" && (
              <div>
                <p className="font-medium text-gray-700">ສະຖານະ:</p>
                <p className="text-gray-900">
                  {
                    statusOptions.find((s) => s.value === formData.status)
                      ?.label
                  }
                </p>
              </div>
            )}
          </div>

          {formData.assigneeNote && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="font-medium text-gray-700 mb-1">
                ຂໍ້ຄວາມສຳລັບຜູ້ຮັບຜິດຊອບ:
              </p>
              <p className="text-gray-900 text-sm">{formData.assigneeNote}</p>
            </div>
          )}

          {formData.notes && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="font-medium text-gray-700 mb-1">ໝາຍເຫດ:</p>
              <p className="text-gray-900 text-sm">{formData.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const stepComponents = [
    renderBasicStep,
    renderDetailsStep,
    renderAssignmentStep,
    renderReviewStep,
  ];
  const isFormSubmitting = isSubmitting || isSubmittingForm;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === "edit" ? "ແກ້ໄຂກິດຈະກຳ" : "ເພີ່ມກິດຈະກຳໃໝ່"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {steps[currentStep].title} - ຂັ້ນຕອນທີ່ {currentStep + 1} ຈາກ{" "}
                {steps.length}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              disabled={isFormSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="mt-4">
            <StepIndicator steps={steps} currentStep={currentStep} />
          </div>
        </div>

        {/* Form Content */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6">
          {stepComponents[currentStep]()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 0 || isFormSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              ກັບຄືນ
            </button>

            <div className="flex gap-3">
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isFormSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  ຕໍ່ໄປ
                  <Zap className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    isFormSubmitting || Object.keys(validationErrors).length > 0
                  }
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isFormSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      ກຳລັງບັນທຶກ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {mode === "edit"
                        ? "ອັບເດດ"
                        : formData.assignedTo !==
                          (currentUser?.udid || currentUser?.UDID)
                        ? "ມອບໝາຍ"
                        : "ສ້າງ"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;
