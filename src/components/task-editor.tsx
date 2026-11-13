"use client";

import { useState, useTransition } from "react";
import { EVERY_DAY, WEEKDAYS_ONLY, daysOf, maskOf } from "@/domain/habits";
import { TIMES_OF_DAY, type TimeOfDay } from "@/domain/types";
import { addDays, type LocalDate } from "@/lib/dates";
import { TIME_OF_DAY_LABEL } from "@/lib/labels";
import type { TaskView } from "@/lib/views";
import { saveHabit } from "@/server/actions/habits";
import { deleteTask, saveTask } from "@/server/actions/tasks";
import { useShell } from "./shell";
import { Button, ConfirmDelete, Field, Pill, Sheet, arrowFocus, inputClass } from "./ui";

export type TaskDefaults = {
  scheduledDate?: LocalDate;
  goalId?: string | null;
  timeOfDay?: TimeOfDay | null;
  /** Open with "Repetir: todo dia" already chosen (the menu's "Novo hábito"). */
  repeat?: boolean;
};

/** How often a new task comes back. Anything but "once" makes it a habit, which lives in the Rotina. */
type Repeat = "once" | "every_day" | "weekdays" | "custom";
const REPEAT_LABEL: Record<Repeat, string> = {
  once: "Só uma vez",
  every_day: "Todo dia",
  weekdays: "Dias úteis",
  custom: "Escolher dias",
};
const DAY_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_NAME = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

export function TaskEditor({
  open,
  task,
  defaults,
  onClose,
}: {
  open: boolean;
  task?: TaskView;
  defaults?: TaskDefaults;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} label={task ? "Editar tarefa" : "Nova tarefa"} size="lg">
      <TaskForm key={task?.id ?? "new"} task={task} defaults={defaults} onDone={onClose} />
    </Sheet>
  );
}

function TaskForm({
  task,
  defaults,
  onDone,
}: {
  task?: TaskView;
  defaults?: TaskDefaults;
  onDone: () => void;
}) {
  const { today, goals } = useShell();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [goalId, setGoalId] = useState<string | null>(task ? task.goalId : (defaults?.goalId ?? null));
  const [date, setDate] = useState<LocalDate>(task?.scheduledDate ?? defaults?.scheduledDate ?? today);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(
    task ? task.timeOfDay : (defaults?.timeOfDay ?? null),
  );
  const [deadline, setDeadline] = useState<LocalDate | "">(task?.deadline ?? "");
  const [repeat, setRepeat] = useState<Repeat>(defaults?.repeat ? "every_day" : "once");
  const [days, setDays] = useState(EVERY_DAY);
  const [softLimit, setSoftLimit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // An existing task is always a task; "Repetir" only applies to something new.
  const repeating = !task && repeat !== "once";
  const canSave = !pending && title.trim().length > 0 && (!repeating || days !== 0);

  function chooseRepeat(next: Repeat) {
    setRepeat(next);
    if (next === "every_day") setDays(EVERY_DAY);
    if (next === "weekdays") setDays(WEEKDAYS_ONLY);
  }
  const toggleDay = (d: number) =>
    setDays(maskOf(daysOf(days).includes(d) ? daysOf(days).filter((x) => x !== d) : [...daysOf(days), d]));

  function submit(overrides: { goalId?: string | null; confirmSoftLimit?: boolean } = {}) {
    setError(null);
    if (repeating) {
      // A repeating "task" is a habit: no day, period or deadline, just the days it comes back and its goal.
      startTransition(async () => {
        const result = await saveHabit({ title, days, goalId });
        if (result.ok) onDone();
        else setError(result.error);
      });
      return;
    }
    startTransition(async () => {
      const result = await saveTask({
        id: task?.id,
        title,
        description,
        goalId: overrides.goalId !== undefined ? overrides.goalId : goalId,
        scheduledDate: date,
        timeOfDay,
        deadline: deadline || null,
        confirmSoftLimit: overrides.confirmSoftLimit,
      });
      if (result.ok) onDone();
      else if ("needsConfirm" in result) setSoftLimit(result.activeCount);
      else setError(result.error);
    });
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        // Ctrl/⌘ + Enter saves from anywhere in the form, including the notes field where Enter adds a line.
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && softLimit === null) {
          e.preventDefault();
          if (canSave) submit();
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-[-0.01em] lg:text-2xl">
          {task ? "Editar tarefa" : repeating ? "Novo hábito" : "Nova tarefa"}
        </h2>
        <button type="button" onClick={onDone} className="-m-2.5 p-2.5 text-[13px] text-muted hover:text-ink">
          Fechar
        </button>
      </div>

      <Field label="Título">
        <input
          autoFocus={!task}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="O que você quer fazer?"
          className={`${inputClass} font-medium lg:text-lg`}
        />
      </Field>

      {!task && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted" id="repetir-label">
            Repetir
          </span>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-labelledby="repetir-label"
            onKeyDown={arrowFocus}
          >
            {(Object.keys(REPEAT_LABEL) as Repeat[]).map((r) => (
              <Pill
                key={r}
                role="radio"
                aria-checked={repeat === r}
                active={repeat === r}
                onClick={() => chooseRepeat(r)}
              >
                {REPEAT_LABEL[r]}
              </Pill>
            ))}
          </div>
          {repeat === "custom" && (
            <div className="grid animate-fade grid-cols-7 gap-1.5" role="group" aria-label="Dias da semana">
              {DAY_LABEL.map((label, d) => (
                <Pill
                  key={label}
                  type="button"
                  active={(days & (1 << d)) !== 0}
                  aria-label={DAY_NAME[d]}
                  onClick={() => toggleDay(d)}
                  className="px-0 text-center lg:px-0"
                >
                  {label}
                </Pill>
              ))}
            </div>
          )}
          {repeating && (
            <p className="text-xs text-muted">Vira um hábito: aparece na sua Rotina nos dias escolhidos.</p>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Meta">
          <select
            value={goalId ?? ""}
            onChange={(e) => {
              setGoalId(e.target.value || null);
              setSoftLimit(null);
            }}
            className={inputClass}
          >
            <option value="">Sem meta</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </Field>

        {!repeating && (
          <Field label="Dia">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSoftLimit(null);
              }}
              className={inputClass}
            />
          </Field>
        )}

        {!repeating && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted" id="periodo-label">
              Período
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-labelledby="periodo-label"
              onKeyDown={arrowFocus}
            >
              {[null, ...TIMES_OF_DAY].map((t) => (
                <Pill
                  key={t ?? "none"}
                  role="radio"
                  aria-checked={timeOfDay === t}
                  active={timeOfDay === t}
                  onClick={() => setTimeOfDay(t)}
                >
                  {t ? TIME_OF_DAY_LABEL[t] : "Livre"}
                </Pill>
              ))}
            </div>
          </div>
        )}

        {!repeating && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="task-deadline" className="text-xs text-muted">
                Prazo<span className="text-faint"> · opcional</span>
              </label>
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline("")}
                  className="-my-2 py-2 text-xs text-muted underline underline-offset-[3px] hover:text-ink"
                >
                  Remover prazo
                </button>
              )}
            </div>
            <input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {!repeating && (
        <Field label="Detalhes" optional>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Algo que ajude a começar"
            className={`${inputClass} min-h-28 resize-y leading-relaxed`}
          />
        </Field>
      )}

      {softLimit !== null && goalId && (
        <div className="flex animate-rise flex-col gap-2.5 rounded-[14px] bg-soft p-3.5" role="alert">
          <p className="text-[13px] leading-normal">
            Esta meta já tem {softLimit} tarefas ativas nesta semana — vincular mesmo assim?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              type="button"
              disabled={pending}
              onClick={() => submit({ confirmSoftLimit: true })}
            >
              Vincular mesmo assim
            </Button>
            <Button
              size="sm"
              type="button"
              variant="secondary"
              disabled={pending}
              className="border-dash-strong"
              onClick={() => submit({ goalId: null })}
            >
              Salvar sem meta
            </Button>
          </div>
        </div>
      )}

      {error && <p className="animate-rise text-[13px] text-miss">{error}</p>}

      {/* Phone: the main action first and full width. Desktop: actions on the right, delete on the left. */}
      <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-center lg:justify-between">
        {softLimit === null && (
          <div className="flex flex-col gap-2 lg:flex-row-reverse lg:items-center lg:gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={!canSave}
              aria-keyshortcuts="Control+Enter Meta+Enter"
              className="lg:px-7"
            >
              {task ? "Salvar" : repeating ? "Criar hábito" : "Criar tarefa"}
            </Button>
            {task && !task.completed && date <= today && (
              <Button
                type="button"
                size="lg"
                variant="secondary"
                disabled={pending}
                onClick={() => setDate(addDays(today, 1))}
              >
                Mover para amanhã
              </Button>
            )}
          </div>
        )}
        {task && (
          <ConfirmDelete
            label="Excluir tarefa"
            prompt="Excluir esta tarefa?"
            confirmLabel="Segure para excluir"
            pending={pending}
            onConfirm={() =>
              startTransition(async () => {
                await deleteTask(task.id);
                onDone();
              })
            }
          />
        )}
      </div>
    </form>
  );
}
