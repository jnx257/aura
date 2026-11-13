import { z } from "zod";
import { HORIZONS, MISSED_REASONS, MOODS, TIMES_OF_DAY } from "@/domain/types";
import { isValidLocalDate } from "./dates";
import { isKnownPushEndpoint } from "./push";

const localDate = z.string().refine(isValidLocalDate, "Data inválida");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido")),
  password: z.string().min(8, "Pelo menos 8 caracteres").max(200),
  birthDate: z
    .string()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || isValidLocalDate(v), "Data inválida"),
  timezone: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Informe seu e-mail"),
  password: z.string().min(1, "Informe sua senha"),
});

export const taskSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Dê um nome à tarefa").max(200),
  description: optionalText(2000),
  goalId: z.uuid().nullable(),
  scheduledDate: localDate,
  timeOfDay: z.enum(TIMES_OF_DAY).nullable(),
  deadline: localDate.nullable(),
  /** Set when the person already saw the 5-active-tasks warning and chose to link anyway. */
  confirmSoftLimit: z.boolean().optional(),
});
export type TaskInput = z.input<typeof taskSchema>;

/** Quick reschedule of a single task (the hold menu on a task row). Date only; everything else stays as it is. */
export const moveTaskSchema = z.object({
  taskId: z.uuid(),
  scheduledDate: localDate,
});
export type MoveTaskInput = z.input<typeof moveTaskSchema>;

export const goalSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Dê um nome à meta").max(120),
  category: optionalText(60),
  horizon: z.enum(HORIZONS),
});
export type GoalInput = z.input<typeof goalSchema>;

export const habitSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Dê um nome ao hábito").max(120),
  /** Days of the week as a bitmask (Monday = bit 0). At least one day. */
  days: z.number().int().min(1, "Escolha pelo menos um dia").max(127),
});
export type HabitInput = z.input<typeof habitSchema>;

/** "HH:MM" to be reminded, or null to turn the reminder off. */
export const reminderSchema = z.object({
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido")
    .nullable(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().max(2000).refine(isKnownPushEndpoint, "Serviço de notificações não reconhecido"),
  keys: z.object({ p256dh: z.string().min(1).max(500), auth: z.string().min(1).max(200) }),
});
export type PushSubscriptionInput = z.input<typeof pushSubscriptionSchema>;

export const cycleResponseSchema = z.object({
  cycleId: z.uuid(),
  action: z.enum(["accept", "decline", "reflect"]),
  reason: z.enum(MISSED_REASONS).nullable(),
  reasonText: optionalText(200),
});
export type CycleResponseInput = z.input<typeof cycleResponseSchema>;

export const journalSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().max(200),
  body: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("guided"),
      happened: z.string().max(20_000),
      hindered: z.string().max(20_000),
      helps: z.string().max(20_000),
    }),
    z.object({ kind: z.literal("free"), text: z.string().max(50_000) }),
  ]),
  mood: z.enum(MOODS).nullable(),
  taskId: z.uuid().nullable(),
  goalId: z.uuid().nullable(),
  cycleId: z.uuid().nullable(),
  status: z.enum(["draft", "saved"]),
});
export type JournalInput = z.input<typeof journalSchema>;
