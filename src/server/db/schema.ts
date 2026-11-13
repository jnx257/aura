import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { CYCLE_OUTCOMES, HORIZONS, MISSED_REASONS, MOODS, TIMES_OF_DAY } from "@/domain/types";

export const horizonEnum = pgEnum("horizon", HORIZONS);
export const timeOfDayEnum = pgEnum("time_of_day", TIMES_OF_DAY);
export const missedReasonEnum = pgEnum("missed_reason", MISSED_REASONS);
export const cycleOutcomeEnum = pgEnum("cycle_outcome", CYCLE_OUTCOMES);
export const moodEnum = pgEnum("mood", MOODS);
export const entryStatusEnum = pgEnum("entry_status", ["draft", "saved"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const localDate = (name: string) => date(name, { mode: "string" });

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  birthDate: localDate("birth_date"),
  timezone: text().notNull().default("America/Sao_Paulo"),
  /** "HH:MM" in the person's own timezone: when to nudge about the day's habits. Null = no reminder. */
  reminderTime: text("reminder_time"),
  /** The last local day a reminder was sent, so one day never gets two. */
  lastRemindedOn: localDate("last_reminded_on"),
  createdAt: createdAt(),
});

/** A phone (or browser) that agreed to receive push notifications. One person can have several. */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The push service's address for this device; unique, and the only way to remove one. */
    endpoint: text().notNull(),
    p256dh: text().notNull(),
    auth: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("push_subscriptions_endpoint_uq").on(t.endpoint), index("push_subscriptions_user_idx").on(t.userId)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token; the raw token only ever lives in the cookie. */
    id: text().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text().notNull(),
    category: text(),
    horizon: horizonEnum().notNull(),
    createdOn: localDate("created_on").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Deleting a goal turns its tasks into orphan tasks instead of deleting them.
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    title: text().notNull(),
    description: text(),
    scheduledDate: localDate("scheduled_date").notNull(),
    timeOfDay: timeOfDayEnum("time_of_day"),
    deadline: localDate("deadline"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedOn: localDate("completed_on"),
    rescheduleCount: integer("reschedule_count").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("tasks_user_date_idx").on(t.userId, t.scheduledDate),
    index("tasks_goal_idx").on(t.goalId),
  ],
);

export const feedbackCycles = pgTable(
  "feedback_cycles",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    /** Local day the task was due (and not done). */
    missedOn: localDate("missed_on").notNull(),
    /** Local day the prompt became available; unanswered past this day = ignored. */
    openedOn: localDate("opened_on").notNull(),
    cycleNumber: integer("cycle_number").notNull(),
    reason: missedReasonEnum(),
    reasonText: text("reason_text"),
    suggestedDate: localDate("suggested_date").notNull(),
    suggestedTimeOfDay: timeOfDayEnum("suggested_time_of_day"),
    outcome: cycleOutcomeEnum().notNull().default("pending"),
    resolvedOn: localDate("resolved_on"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("cycles_task_missed_on_uq").on(t.taskId, t.missedOn),
    index("cycles_user_missed_on_idx").on(t.userId, t.missedOn),
    index("cycles_pending_idx").on(t.userId).where(sql`${t.outcome} = 'pending'`),
  ],
);

/** Things done on the same days every week. Separate from tasks: a habit never opens a "what got in the way?" prompt. */
export const habits = pgTable(
  "habits",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The goal this habit works towards. Deleting the goal keeps the habit, which simply has no goal then. */
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    title: text().notNull(),
    /** Days of the week it applies to, as a bitmask: Monday = bit 0 … Sunday = bit 6 (127 = every day). */
    days: integer().notNull().default(127),
    /** Local day it was created: earlier days never count against it. */
    createdOn: localDate("created_on").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("habits_user_idx").on(t.userId), index("habits_goal_idx").on(t.goalId)],
);

/** One row per habit per day it was done; no row means not done. */
export const habitLogs = pgTable(
  "habit_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    day: localDate("day").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("habit_logs_habit_day_uq").on(t.habitId, t.day), index("habit_logs_user_idx").on(t.userId)],
);

export type JournalBody =
  | { kind: "guided"; happened: string; hindered: string; helps: string }
  | { kind: "free"; text: string };

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text().notNull().default(""),
    body: jsonb().$type<JournalBody>().notNull(),
    mood: moodEnum(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    cycleId: uuid("cycle_id").references(() => feedbackCycles.id, { onDelete: "set null" }),
    status: entryStatusEnum().notNull().default("draft"),
    entryDate: localDate("entry_date").notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("journal_user_created_idx").on(t.userId, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type FeedbackCycle = typeof feedbackCycles.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
