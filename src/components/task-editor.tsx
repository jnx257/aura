"use client";

import { useState, useTransition } from "react";
import { TIMES_OF_DAY, type TimeOfDay } from "@/domain/types";
import { addDays, type LocalDate } from "@/lib/dates";
import { TIME_OF_DAY_LABEL } from "@/lib/labels";
import type { TaskView } from "@/lib/views";
import { deleteTask, saveTask } from "@/server/actions/tasks";
import { useShell } from "./shell";
import { Button, ConfirmDelete, Sheet, arrowFocus, cn } from "./ui";

export type TaskDefaults = { scheduledDate?: LocalDate; goalId?: string | null; timeOfDay?: TimeOfDay | null };

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
    <Sheet open={open} onClose={onClose} label={task ? "Editar tarefa" : "Nova tarefa"} variant="panel">
      <TaskForm key={task?.id ?? "new"} task={task} defaults={defaults} onDone={onClose} />
    </Sheet>
  );
}

const rowClass = "flex items-center justify-between gap-3 border-t border-divider py-3";

function TaskForm({ task, defaults, onDone }: { task?: TaskView; defaults?: TaskDefaults; onDone: () => void }) {
  const { today, goals } = useShell();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [goalId, setGoalId] = useState<string | null>(task ? task.goalId : (defaults?.goalId ?? null));
  const [date, setDate] = useState<LocalDate>(task?.scheduledDate ?? defaults?.scheduledDate ?? today);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(
    task ? task.timeOfDay : (defaults?.timeOfDay ?? null),
  );
  const [deadline, setDeadline] = useState<LocalDate | "">(task?.deadline ?? "");
  const [softLimit, setSoftLimit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(overrides: { goalId?: string | null; confirmSoftLimit?: boolean } = {}) {
    setError(null);
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
      className="flex flex-col gap-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] tracking-[0.08em] text-muted">{task ? "EDITAR TAREFA" : "NOVA TAREFA"}</span>
        <button type="button" onClick={onDone} className="-m-2.5 p-2.5 text-[13px] text-muted hover:text-ink">
          Fechar
        </button>
      </div>

      <input
        autoFocus={!task}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="O que você quer fazer?"
        aria-label="Título"
        className="border-b border-divider bg-transparent pt-2 pb-3 text-base font-medium outline-none placeholder:text-faint focus-visible:border-ink focus-visible:outline-none lg:text-[17px] lg:font-semibold"
      />

      <div className="flex flex-col text-[13px]">
        <label className={cn(rowClass, "border-t-0")}>
          <span className="text-muted">Meta</span>
          <select
            value={goalId ?? ""}
            onChange={(e) => {
              setGoalId(e.target.value || null);
              setSoftLimit(null);
            }}
            className="max-w-[60%] bg-transparent text-right text-base font-semibold outline-none lg:text-[13px]"
          >
            <option value="">Sem meta</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <label className={rowClass}>
          <span className="text-muted">Dia</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSoftLimit(null);
            }}
            className="bg-transparent text-right text-base outline-none lg:text-[13px]"
          />
        </label>
        <div className={cn(rowClass, "py-[9px]")}>
          <span className="text-muted">Período</span>
          <span className="flex gap-0.5" role="radiogroup" aria-label="Período" onKeyDown={arrowFocus}>
            {[null, ...TIMES_OF_DAY].map((t) => (
              <button
                key={t ?? "none"}
                type="button"
                role="radio"
                aria-checked={timeOfDay === t}
                onClick={() => setTimeOfDay(t)}
                className={cn(
                  "rounded-full px-2 py-[5px] text-xs",
                  timeOfDay === t ? "bg-ink text-on-ink" : "text-muted hover:text-ink",
                )}
              >
                {t ? TIME_OF_DAY_LABEL[t] : "Livre"}
              </button>
            ))}
          </span>
        </div>
        <label className={rowClass}>
          <span className="text-muted">Prazo</span>
          <span className="flex items-center gap-2">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={cn("bg-transparent text-right text-base outline-none lg:text-[13px]", !deadline && "text-faint")}
            />
            {deadline && (
              <button type="button" onClick={() => setDeadline("")} className="-m-2.5 p-2.5 text-faint" aria-label="Remover prazo">
                ×
              </button>
            )}
          </span>
        </label>
        <label className={cn(rowClass, "flex-col items-stretch gap-2")}>
          <span className="text-muted">Detalhes</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-faint lg:text-[13px]"
          />
        </label>
      </div>

      {softLimit !== null && goalId && (
        <div className="flex flex-col gap-2.5 rounded-[14px] bg-soft p-3.5" role="alert">
          <p className="text-[13px] leading-normal">
            Esta meta já tem {softLimit} tarefas ativas nesta semana — vincular mesmo assim?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" type="button" disabled={pending} onClick={() => submit({ confirmSoftLimit: true })}>
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

      {error && <p className="text-[13px] text-miss">{error}</p>}

      {softLimit === null && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={pending || !title.trim()} className="flex-1 py-3">
            {task ? "Salvar" : "Criar tarefa"}
          </Button>
          {task && !task.completed && date <= today && (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              className="py-3"
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
          confirmLabel="Sim, excluir"
          pending={pending}
          onConfirm={() =>
            startTransition(async () => {
              await deleteTask(task.id);
              onDone();
            })
          }
        />
      )}
    </form>
  );
}
