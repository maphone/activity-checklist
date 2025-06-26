// components/SummaryPage.tsx - Fixed version with proper imports
"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Save,
  Loader2,
  Award,
  FileText,
  Download,
  Share2,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Zap,
  CircleCheckBig,
  CheckCircle2,
} from "lucide-react";

// Fixed imports - ใช้ utility functions ที่สร้างขึ้น
import {
  getActivityStatus,
  getActivityPriority,
  getActivityTitle,
  getActivityEstimatedDuration,
  getActivityActualDuration,
  formatActivityDuration,
  calculateActivityStats,
  calculateTimeStats,
  calculateCategoryStats,
  calculatePriorityStats,
} from "../utils/res";

// Import types
interface SummaryPageProps {
  selectedDate: string;
  activities: any[];
  currentUser?: any;
  checklistRecord?: any;
}

interface ActivityStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
  overdueRate: number;
}

interface TimeStats {
  totalEstimated: number;
  totalActual: number;
  efficiency: number;
  avgCompletionTime: number;
  savedTime: number;
}

interface CategoryStats {
  name: string;
  total: number;
  completed: number;
  completionRate: number;
  timeSpent: number;
  avgTime: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  comparison?: string;
  loading?: boolean;
}

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

interface EnhancedProgressBarProps {
  label: string;
  current: number;
  total: number;
  percentage: number;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  showDetails?: boolean;
  animationDelay?: number;
}

interface InsightCardProps {
  type: "success" | "warning" | "info" | "danger";
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

interface ComparisonChartProps {
  data: Array<{ name: string; value: number }>;
  title: string;
}

// ========= Enhanced Stat Card Component =========
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
  comparison,
  loading = false,
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      text: "text-blue-700",
      icon: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      text: "text-green-700",
      icon: "text-green-600",
      border: "border-green-200",
    },
    yellow: {
      bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      text: "text-yellow-700",
      icon: "text-yellow-600",
      border: "border-yellow-200",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 to-red-100",
      text: "text-red-700",
      icon: "text-red-600",
      border: "border-red-200",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      text: "text-purple-700",
      icon: "text-purple-600",
      border: "border-purple-200",
    },
  };

  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`${classes.bg} ${classes.border} border rounded-xl p-6 hover:shadow-lg transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm`}>
            <Icon className={`w-6 h-6 ${classes.icon}`} />
          </div>
          <h3 className={`font-semibold ${classes.text} text-sm`}>{title}</h3>
        </div>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0
                ? "bg-green-100 text-green-700"
                : trend < 0
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {trend > 0 ? (
              <ArrowUp className="w-3 h-3" />
            ) : trend < 0 ? (
              <ArrowDown className="w-3 h-3" />
            ) : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="text-gray-500 text-sm">ກຳລັງໂຫຼດ...</span>
          </div>
        ) : (
          <>
            <div className={`text-3xl font-bold ${classes.text}`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            {comparison && (
              <p className="text-xs text-gray-500">{comparison}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ========= Circular Progress Component =========
const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = "blue",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = {
    blue: "#3B82F6",
    green: "#10B981",
    yellow: "#F59E0B",
    red: "#EF4444",
    purple: "#8B5CF6",
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[color] || colors.blue}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
      </div>
    </div>
  );
};

// ========= Enhanced Progress Bar =========
const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = ({
  label,
  current,
  total,
  percentage,
  color = "blue",
  showDetails = true,
  animationDelay = 0,
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [percentage, animationDelay]);

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showDetails && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold">
              {current}/{total}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              {percentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-1000 ease-out ${
            colorClasses[color] || colorClasses.blue
          }`}
          style={{ width: `${animatedPercentage}%` }}
        />
      </div>
    </div>
  );
};

// ========= Insight Card Component =========
const InsightCard: React.FC<InsightCardProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  icon: Icon,
}) => {
  const typeStyles = {
    success: {
      bg: "bg-green-50 border-green-200",
      icon: "text-green-600",
      text: "text-green-800",
      button: "bg-green-600 hover:bg-green-700",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: "text-yellow-600",
      text: "text-yellow-800",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: "text-blue-600",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    danger: {
      bg: "bg-red-50 border-red-200",
      icon: "text-red-600",
      text: "text-red-800",
      button: "bg-red-600 hover:bg-red-700",
    },
  };

  const styles = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`${styles.bg} border rounded-lg p-4 hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.icon} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <h4 className={`font-medium ${styles.text} mb-1`}>{title}</h4>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {description}
          </p>
          {actionText && onAction && (
            <button
              onClick={onAction}
              className={`text-sm px-3 py-1 ${styles.button} text-white rounded-md transition-colors duration-200`}
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ========= Comparison Chart Component =========
const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {item.name}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {item.value}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                  animationDelay: `${index * 100}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========= Main Summary Page Component =========
const SummaryPage: React.FC<SummaryPageProps> = ({
  selectedDate,
  activities,
  currentUser,
  checklistRecord,
}) => {
  const [dailyNotes, setDailyNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [viewMode, setViewMode] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const notesRef = useRef(null);

  // Ensure activities is always an array
  const safeActivities = useMemo(() => {
    return Array.isArray(activities) ? activities : [];
  }, [activities]);

  // ========= Calculate Activity Statistics using utility functions =========
  const activityStats: ActivityStats = useMemo(() => {
    return calculateActivityStats(safeActivities);
  }, [safeActivities]);

  // ========= Calculate Time Statistics using utility functions =========
  const timeStats: TimeStats = useMemo(() => {
    return calculateTimeStats(safeActivities);
  }, [safeActivities]);

  // ========= Calculate Category Statistics using utility functions =========
  const categoryStats: CategoryStats[] = useMemo(() => {
    return calculateCategoryStats(safeActivities);
  }, [safeActivities]);

  // ========= Calculate Priority Statistics using utility functions =========
  const priorityStats = useMemo(() => {
    return calculatePriorityStats(safeActivities);
  }, [safeActivities]);

  // ========= Calculate Checklist Statistics =========
  const checklistStats = useMemo(() => {
    console.log(
      "🔍 [SummaryPage] Calculating checklist stats from:",
      checklistRecord
    );

    if (!checklistRecord?.checklistItems) {
      console.log("🔍 [SummaryPage] No checklist items found");
      return {
        total: 0,
        completed: 0,
        required: 0,
        requiredCompleted: 0,
        completionRate: 0,
        requiredCompletionRate: 0,
      };
    }

    const items = checklistRecord.checklistItems;
    console.log("🔍 [SummaryPage] Processing checklist items:", items.length);

    const total = items.length;
    const completed = items.filter((item: any) => item.IS_COMPLETED).length;
    const required = items.filter((item: any) => item.IS_REQUIRED).length;
    const requiredCompleted = items.filter(
      (item: any) => item.IS_REQUIRED && item.IS_COMPLETED
    ).length;

    const stats = {
      total,
      completed,
      required,
      requiredCompleted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      requiredCompletionRate:
        required > 0 ? Math.round((requiredCompleted / required) * 100) : 0,
    };

    console.log("🔍 [SummaryPage] Checklist stats calculated:", stats);
    return stats;
  }, [checklistRecord]);

  // ========= Generate Insights =========
  const insights = useMemo(() => {
    const suggestions = [];

    // Activity completion insights
    if (activityStats.completionRate < 50) {
      suggestions.push({
        type: "warning" as const,
        title: "ປັບປຸງການຄຸ້ມຄອງເວລາ",
        description: `ອັດຕາສຳເລັດຂອງທ່ານ ${activityStats.completionRate}% ຍັງຕ່ຳກວ່າເປົ້າໝາຍ. ລອງວາງແຜນເວລາໃຫ້ດີກວ່າ`,
        icon: Clock,
        actionText: "ເບິ່ງເຄັດລັບ",
        onAction: () => console.log("Show time management tips"),
      });
    }

    // Time efficiency insights
    if (timeStats.efficiency > 120) {
      suggestions.push({
        type: "danger" as const,
        title: "ປະມານເວລາໃຫ້ດີຂຶ້ນ",
        description: `ທ່ານໃຊ້ເວລາເກີນກຳນົດ ${
          timeStats.efficiency - 100
        }%. ລອງປະມານເວລາໃຫ້ຮີດິສຕິກໄວ`,
        icon: TrendingDown,
        actionText: "ປັບປຸງ",
        onAction: () => console.log("Show estimation tips"),
      });
    }

    // Overdue activities insight
    if (activityStats.overdue > 0) {
      suggestions.push({
        type: "warning" as const,
        title: "ມີງານເກີນກຳນົດ",
        description: `ມີ ${activityStats.overdue} ກິດຈະກຳທີ່ເກີນກຳນົດແລ້ວ. ກະລຸນາຈັດລຳດັບຄວາມສຳຄັນ`,
        icon: AlertCircle,
        actionText: "ເບິ່ງງານເກີນກຳນົດ",
        onAction: () => console.log("Show overdue tasks"),
      });
    }

    // Positive feedback
    if (activityStats.completionRate >= 80 && timeStats.efficiency <= 100) {
      suggestions.push({
        type: "success" as const,
        title: "ຜົນງານດີເລີດ!",
        description: `ທ່ານມີອັດຕາສຳເລັດ ${activityStats.completionRate}% ແລະຄຸ້ມຄອງເວລາໄດ້ດີ`,
        icon: Award,
        actionText: "ແບ່ງປັນປະສົບການ",
        onAction: () => console.log("Share success story"),
      });
    }

    // Checklist insight
    if (
      checklistStats.requiredCompletionRate < 100 &&
      checklistStats.required > 0
    ) {
      suggestions.push({
        type: "info" as const,
        title: "Checklist ຍັງບໍ່ຄົບ",
        description: `ຍັງມີລາຍການຈຳເປັນ ${
          checklistStats.required - checklistStats.requiredCompleted
        } ລາຍການທີ່ຍັງບໍ່ສຳເລັດ`,
        icon: CheckCircle2,
        actionText: "ໄປ Checklist",
        onAction: () => console.log("Go to checklist"),
      });
    }

    return suggestions;
  }, [activityStats, timeStats, checklistStats]);

  // ========= Event Handlers =========
  const handleSaveNotes = useCallback(async () => {
    setIsSavingNotes(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Notes saved:", dailyNotes);
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setIsSavingNotes(false);
    }
  }, [dailyNotes]);

  const handleExportReport = useCallback(async () => {
    setIsExporting(true);
    try {
      const reportData = {
        date: selectedDate,
        user: currentUser,
        activityStats,
        timeStats,
        categoryStats,
        checklistStats,
        notes: dailyNotes,
        activities: safeActivities.map((a) => ({
          title: getActivityTitle(a),
          status: getActivityStatus(a),
          priority: getActivityPriority(a),
          duration:
            getActivityActualDuration(a) || getActivityEstimatedDuration(a),
        })),
      };

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `daily-report-${selectedDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("Report exported successfully");
    } catch (error) {
      console.error("Failed to export report:", error);
    } finally {
      setIsExporting(false);
    }
  }, [
    selectedDate,
    currentUser,
    activityStats,
    timeStats,
    categoryStats,
    checklistStats,
    dailyNotes,
    safeActivities,
  ]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `ລາຍງານສະຫຼຸບ - ${new Date(selectedDate).toLocaleDateString(
          "lo-LA"
        )}`,
        text: `ຜົນງານປະຈຳວັນ: ສຳເລັດ ${activityStats.completed}/${activityStats.total} ກິດຈະກຳ (${activityStats.completionRate}%)`,
        url: window.location.href,
      });
    } else {
      const shareText = `ລາຍງານສະຫຼຸບ ${new Date(
        selectedDate
      ).toLocaleDateString("lo-LA")}\n\nຜົນງານ:\n- ກິດຈະກຳສຳເລັດ: ${
        activityStats.completed
      }/${activityStats.total} (${
        activityStats.completionRate
      }%)\n- ປະສິດທິພາບເວລາ: ${timeStats.efficiency}%\n- Checklist: ${
        checklistStats.completionRate
      }%`;

      navigator.clipboard.writeText(shareText).then(() => {
        console.log("Report copied to clipboard");
      });
    }
  }, [selectedDate, activityStats, timeStats, checklistStats]);

  return (
    <div className="space-y-6">
      {/* ========= Header Section ========= */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                ສະຫຼຸບຜົນງານປະຈຳວັນ
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedDate).toLocaleDateString("lo-LA")}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {currentUser?.firstName} {currentUser?.lastName}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { id: "overview", label: "ພາບລວມ", icon: TrendingUp },
                { id: "detailed", label: "ລະອຽດ", icon: BarChart3 },
                { id: "comparison", label: "ປຽບທຽບ", icon: PieChart },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    viewMode === id
                      ? "bg-white text-blue-600 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="ແບ່ງປັນ"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleExportReport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all duration-200"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? "ກຳລັງສົ່ງອອກ..." : "ສົ່ງອອກ"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========= Main Statistics Cards ========= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="ອັດຕາສຳເລັດ"
          value={`${activityStats.completionRate}%`}
          subtitle={`${activityStats.completed}/${activityStats.total} ກິດຈະກຳ`}
          icon={Target}
          color={
            activityStats.completionRate >= 80
              ? "green"
              : activityStats.completionRate >= 50
              ? "yellow"
              : "red"
          }
          comparison="ເປົ້າໝາຍ: 80%"
        />

        <StatCard
          title="ປະສິດທິພາບເວລາ"
          value={`${timeStats.efficiency}%`}
          subtitle={`${formatActivityDuration(
            timeStats.totalActual
          )} / ${formatActivityDuration(timeStats.totalEstimated)}`}
          icon={Clock}
          color={timeStats.efficiency <= 100 ? "green" : "red"}
          trend={timeStats.efficiency <= 100 ? 5 : -3}
        />

        <StatCard
          title="Checklist"
          value={`${checklistStats.completionRate}%`}
          subtitle={`${checklistStats.completed}/${checklistStats.total} ລາຍການ`}
          icon={CircleCheckBig}
          color={
            checklistStats.requiredCompletionRate === 100 ? "green" : "yellow"
          }
        />

        <StatCard
          title="ຄະແນນລວມ"
          value={Math.round(
            (activityStats.completionRate +
              (100 - Math.abs(timeStats.efficiency - 100)) +
              checklistStats.completionRate) /
              3
          )}
          subtitle="ຄະແນນປະສິດທິພາບ"
          icon={Award}
          color={
            Math.round(
              (activityStats.completionRate +
                (100 - Math.abs(timeStats.efficiency - 100)) +
                checklistStats.completionRate) /
                3
            ) >= 80
              ? "green"
              : "blue"
          }
        />
      </div>

      {/* ========= Content Based on View Mode ========= */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Circular Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ຄວາມຄືບໜ້າລວມ
            </h3>
            <div className="flex items-center justify-center">
              <CircularProgress
                percentage={activityStats.completionRate}
                size={150}
                color={
                  activityStats.completionRate >= 80
                    ? "green"
                    : activityStats.completionRate >= 50
                    ? "blue"
                    : "red"
                }
              />
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                ສຳເລັດ {activityStats.completed} ຈາກ {activityStats.total}{" "}
                ກິດຈະກຳ
              </p>
              {activityStats.completionRate >= 80 && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs mt-2">
                  <CheckCircle2 className="w-3 h-3" />
                  ເປົ້າໝາຍໄດ້ຮັບການບັນລຸ
                </div>
              )}
            </div>
          </div>

          {/* Status Progress Bars */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ສະຖານະກິດຈະກຳ
            </h3>
            <div className="space-y-4">
              <EnhancedProgressBar
                label="ສຳເລັດ"
                current={activityStats.completed}
                total={activityStats.total}
                percentage={
                  activityStats.total > 0
                    ? (activityStats.completed / activityStats.total) * 100
                    : 0
                }
                color="green"
                animationDelay={100}
              />
              <EnhancedProgressBar
                label="ກຳລັງເຮັດ"
                current={activityStats.inProgress}
                total={activityStats.total}
                percentage={
                  activityStats.total > 0
                    ? (activityStats.inProgress / activityStats.total) * 100
                    : 0
                }
                color="blue"
                animationDelay={200}
              />
              <EnhancedProgressBar
                label="ລໍຖ້າ"
                current={activityStats.pending}
                total={activityStats.total}
                percentage={
                  activityStats.total > 0
                    ? (activityStats.pending / activityStats.total) * 100
                    : 0
                }
                color="yellow"
                animationDelay={300}
              />
              {activityStats.overdue > 0 && (
                <EnhancedProgressBar
                  label="ເກີນກຳນົດ"
                  current={activityStats.overdue}
                  total={activityStats.total}
                  percentage={
                    activityStats.total > 0
                      ? (activityStats.overdue / activityStats.total) * 100
                      : 0
                  }
                  color="red"
                  animationDelay={400}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === "detailed" && (
        <>
          {/* Category Analysis */}
          {categoryStats.length > 0 && (
            <ComparisonChart
              title="ສະຫຼຸບຕາມປະເພດ"
              data={categoryStats.map((cat) => ({
                name: cat.name,
                value: cat.completed,
              }))}
            />
          )}

          {/* Priority Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ການຈັດລຳດັບຄວາມສຳຄັນ
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(priorityStats).map(([priority, stats]) => {
                const completion =
                  stats.count > 0
                    ? Math.round((stats.completed / stats.count) * 100)
                    : 0;

                return (
                  <div key={priority} className="text-center space-y-2">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                        priority === "urgent"
                          ? "bg-red-100"
                          : priority === "high"
                          ? "bg-orange-100"
                          : priority === "medium"
                          ? "bg-yellow-100"
                          : "bg-green-100"
                      }`}
                    >
                      <span
                        className={`text-2xl font-bold ${
                          priority === "urgent"
                            ? "text-red-600"
                            : priority === "high"
                            ? "text-orange-600"
                            : priority === "medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {stats.completed}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{stats.label}</p>
                      <p className="text-sm text-gray-600">
                        {stats.completed}/{stats.count}
                      </p>
                      <p className="text-xs text-gray-500">{completion}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {viewMode === "comparison" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ການວິເຄາະເວລາ
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  ເວລາທີ່ວາງແຜນ
                </span>
                <span className="font-bold text-blue-900">
                  {formatActivityDuration(timeStats.totalEstimated)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">
                  ເວລາທີ່ໃຊ້ຈິງ
                </span>
                <span className="font-bold text-green-900">
                  {formatActivityDuration(timeStats.totalActual)}
                </span>
              </div>
              <div
                className={`flex justify-between items-center p-3 rounded-lg ${
                  timeStats.savedTime >= 0 ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    timeStats.savedTime >= 0 ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {timeStats.savedTime >= 0 ? "ປະຫຍັດເວລາ" : "ເກີນເວລາ"}
                </span>
                <span
                  className={`font-bold ${
                    timeStats.savedTime >= 0 ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {formatActivityDuration(Math.abs(timeStats.savedTime))}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ປຽບທຽບປະສິດທິພາບ
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>ກິດຈະກຳ</span>
                  <span>{activityStats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${activityStats.completionRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Checklist</span>
                  <span>{checklistStats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${checklistStats.completionRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>ປະສິດທິພາບເວລາ</span>
                  <span>{100 - Math.abs(timeStats.efficiency - 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      timeStats.efficiency <= 100
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${100 - Math.abs(timeStats.efficiency - 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========= Insights Section ========= */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            ຂໍ້ສະເຫນີແນະ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* ========= Daily Notes Section ========= */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          ໝາຍເຫດປະຈຳວັນ
        </h3>
        <div className="space-y-4">
          <textarea
            ref={notesRef}
            value={dailyNotes}
            onChange={(e) => setDailyNotes(e.target.value)}
            placeholder="ເພີ່ມໝາຍເຫດສຳລັບວັນນີ້... (ຜົນງານ, ບັນຫາທີ່ພົບ, ແຜນການໃນມື້ຕໍ່ໄປ ແລະອື່ນໆ)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm resize-none transition-all duration-200"
            rows={5}
            maxLength={1000}
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{dailyNotes.length}/1000 ຕົວອັກສອນ</span>
              {dailyNotes.length > 500 && (
                <span className="text-yellow-600">ໝາຍເຫດຍາວ</span>
              )}
            </div>
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes || !dailyNotes.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSavingNotes ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSavingNotes ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກໝາຍເຫດ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
