/** Serializable shapes passed from server components to client components. */
import type { DriftState } from "@/domain/goals";
import type { Horizon, MissedReason, Mood, TimeOfDay } from "@/domain/types";
import type { LocalDate } from "./dates";

export type GoalOption = { id: string; title: string };

export type MissedPromptView = {
  cycleId: string;
  taskTitle: string;
  goalTitle: string | null;
  missedOn: LocalDate;
  taskTimeOfDay: TimeOfDay | null;
  reason: MissedReason | null;
  reasonText: string | null;
  /** Declined/ignored cycles in a row before this one; at 2, leaving it again auto-applies. */
  priorStreak: number;
  today: LocalDate;
};

export type TaskView = {
  id: string;
  title: string;
  description: string | null;
  goalId: string | null;
  goalTitle: string | null;
  scheduledDate: LocalDate;
  timeOfDay: TimeOfDay | null;
  deadline: LocalDate | null;
  completed: boolean;
  /** Undone and due before today, shown carried over. */
  overdue: boolean;
  rescheduleCount: number;
  missed: MissedPromptView | null;
  /** Reason given on the latest closed miss, if any (shown in goal detail). */
  lastReason: MissedReason | null;
};

export type GoalSummaryView = {
  id: string;
  title: string;
  category: string | null;
  horizon: Horizon;
  done: number;
  total: number;
  drift: DriftState;
  missesInWindow: number;
  openMisses: number;
  missesThisWeek: number;
  weeksOnTrack: number;
  reflections: number;
};

export type JournalEntryView = {
  id: string;
  title: string;
  excerpt: string;
  mood: Mood | null;
  entryDate: LocalDate;
  status: "draft" | "saved";
  chips: string[];
  linkedToGoal: boolean;
};

export type ActivityView = {
  kind: "done" | "missed" | "wrote";
  label: string;
  day: LocalDate;
  at: number;
};
