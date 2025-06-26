import { DecodedToken } from "@/hooks/use-decoded-token";
import { Activity } from "./types";

export interface SummaryPageProps {
  selectedDate: string;
  activities: Activity[];
  currentUser: DecodedToken | null;
}

export interface ActivityStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  completionRate: number;
}

export interface TimeStats {
  totalEstimated: number;
  totalActual: number;
  efficiency: number;
}

export interface CategoryStats {
  name: string;
  total: number;
  completed: number;
  completionRate: number;
}