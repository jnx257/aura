"use client";

import { useState, useTransition } from "react";
import { EVERY_DAY, WEEKDAYS_ONLY, WEEKEND_ONLY, daysOf, maskOf } from "@/domain/habits";
import type { HabitView } from "@/lib/views";
import { deleteHabit, saveHabit } from "@/server/actions/habits";
import { Button, ConfirmDelete, Field, Pill, Sheet, inputClass } from "./ui";

const DAY_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_NAME = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

const PRESETS = [
  { label: "Todos os dias", mask: EVERY_DAY },
  { label: "Dias úteis", mask: WEEKDAYS_ONLY },
  { label: "Fim de semana", mask: WEEKEND_ONLY },
];

export function HabitEditor({
  open,
  habit,
  onClose,
}: {
  open: boolean;
  habit?: HabitView;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} label={habit ? "Editar hábito" : "Novo hábito"}>
      <HabitForm key={habit?.id ?? "new"} habit={habit} onDone={onClose} />
    </Sheet>
  );
}

function HabitForm({ habit, onDone }: { habit?: HabitView; onDone: () => void }) {
  const [title, setTitle] = useState(habit?.title ?? "");
  const [mask, setMask] = useState(habit?.days ?? EVERY_DAY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleDay = (d: number) => setMask(maskOf(daysOf(mask).includes(d) ? daysOf(mask).filter((x) => x !== d) : [...daysOf(mask), d]));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await saveHabit({ id: habit?.id, title, days: mask });
          if (!result.ok) return setError(result.error);
          onDone();
        });
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{habit ? "Editar hábito" : "Novo hábito"}</h2>
        <button type="button" onClick={onDone} className="-m-2.5 p-2.5 text-[13px] text-muted hover:text-ink">
          Fechar
        </button>
      </div>

      <Field label="Hábito">
        <input
          autoFocus={!habit}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Beber dois litros de água"
          className={inputClass}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted" id="habit-days-label">
          Dias da semana
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Atalhos de dias">
          {PRESETS.map((p) => (
            <Pill key={p.label} type="button" active={mask === p.mask} onClick={() => setMask(p.mask)}>
              {p.label}
            </Pill>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-labelledby="habit-days-label">
          {DAY_LABEL.map((label, d) => (
            <Pill
              key={label}
              type="button"
              active={(mask & (1 << d)) !== 0}
              aria-label={DAY_NAME[d]}
              onClick={() => toggleDay(d)}
              className="px-0 text-center lg:px-0"
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      {error && <p className="animate-rise text-[13px] text-miss">{error}</p>}
      <Button type="submit" size="lg" disabled={pending || !title.trim() || mask === 0}>
        {habit ? "Salvar" : "Criar hábito"}
      </Button>
      {habit && (
        <ConfirmDelete
          label="Excluir hábito (apaga também o histórico)"
          prompt="Excluir este hábito e o histórico dele? Não dá para desfazer."
          confirmLabel="Segure para excluir"
          pending={pending}
          onConfirm={() =>
            startTransition(async () => {
              await deleteHabit(habit.id);
              onDone();
            })
          }
        />
      )}
    </form>
  );
}
