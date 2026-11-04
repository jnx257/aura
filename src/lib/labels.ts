import type { Horizon, MissedReason, Mood, TimeOfDay } from "@/domain/types";

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
};

export const HORIZON_LABEL: Record<Horizon, string> = {
  quarterly: "Trimestral",
  monthly: "Mensal",
  yearly: "Anual",
};

export const REASON_LABEL: Record<MissedReason, string> = {
  no_time: "Sem tempo",
  too_tired: "Muito cansado",
  lost_motivation: "Perdi a motivação",
  unexpected: "Imprevisto",
  other: "Outro",
};

export const MOOD_LABEL: Record<Mood, string> = {
  good: "Bem",
  neutral: "Neutro",
  low: "Pra baixo",
  frustrated: "Frustrado",
  tired: "Cansado",
};

/**
 * What a reflection is linked to, in words. The task keeps its own title; the goal and the reason are labelled so
 * "Aprender piano" and "Imprevisto" next to it read as what they are.
 */
export const CHIP = {
  goal: (title: string) => `Meta: ${title}`,
  reason: (text: string) => `Motivo: ${text}`,
};

export const SUGGESTION_TITLE: Record<"default" | "too_tired" | "unexpected", string> = {
  default: "Mover para amanhã",
  too_tired: "Mover para amanhã de manhã",
  unexpected: "Mover para sábado",
};
