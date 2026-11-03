"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HORIZONS, type Horizon } from "@/domain/types";
import { HORIZON_LABEL } from "@/lib/labels";
import type { GoalSummaryView } from "@/lib/views";
import { deleteGoal, saveGoal } from "@/server/actions/goals";
import { Button, Field, Sheet, cn, inputClass } from "./ui";

export function GoalEditor({ open, goal, onClose }: { open: boolean; goal?: GoalSummaryView; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label={goal ? "Editar meta" : "Nova meta"}>
      <GoalForm key={goal?.id ?? "new"} goal={goal} onDone={onClose} />
    </Sheet>
  );
}

function GoalForm({ goal, onDone }: { goal?: GoalSummaryView; onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [category, setCategory] = useState(goal?.category ?? "");
  const [horizon, setHorizon] = useState<Horizon>(goal?.horizon ?? "quarterly");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveGoal({ id: goal?.id, title, category, horizon });
          if (!result.ok) return setError(result.error);
          onDone();
          if (!goal) router.push(`/metas/${result.id}`);
        });
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{goal ? "Editar meta" : "Nova meta"}</h2>
        <button type="button" onClick={onDone} className="text-[13px] text-muted hover:text-ink">
          Fechar
        </button>
      </div>
      <Field label="Meta">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Aprender piano"
          className={inputClass}
        />
      </Field>
      <Field label="Categoria" optional>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Criatividade"
          className={inputClass}
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Horizonte</span>
        <div className="flex gap-2" role="radiogroup" aria-label="Horizonte">
          {HORIZONS.map((h) => (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={horizon === h}
              onClick={() => setHorizon(h)}
              className={cn(
                "flex-1 rounded-full border px-3 py-2.5 text-sm",
                horizon === h ? "border-ink bg-ink text-on-ink" : "border-line hover:bg-sunken",
              )}
            >
              {HORIZON_LABEL[h]}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-[13px] text-miss">{error}</p>}
      <Button type="submit" size="lg" disabled={pending || !title.trim()}>
        {goal ? "Salvar" : "Criar meta"}
      </Button>
      {goal && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteGoal(goal.id);
              onDone();
              router.push("/metas");
            })
          }
          className="self-start text-[13px] text-muted underline underline-offset-[3px] hover:text-miss"
        >
          Excluir meta (as tarefas continuam, sem meta)
        </button>
      )}
    </form>
  );
}
