"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { suggestAdjustment } from "@/domain/suggest";
import { MISSED_REASONS, type MissedReason, type TimeOfDay } from "@/domain/types";
import { formatDayShort, formatRelativeDay, type LocalDate } from "@/lib/dates";
import { REASON_LABEL, SUGGESTION_TITLE, TIME_OF_DAY_LABEL } from "@/lib/labels";
import type { MissedPromptView } from "@/lib/views";
import { respondToCycle } from "@/server/actions/cycles";
import { Button, Pill, Sheet, arrowFocus } from "./ui";

const PERIOD_PHRASE: Record<TimeOfDay, string> = {
  morning: "de manhã",
  afternoon: "à tarde",
  evening: "à noite",
};

export function whenPhrase(day: LocalDate, timeOfDay: TimeOfDay | null, today: LocalDate) {
  const rel = formatRelativeDay(day, today);
  const dayWord = rel === "Hoje" || rel === "Ontem" ? rel.toLowerCase() : rel;
  return timeOfDay ? `${dayWord} ${PERIOD_PHRASE[timeOfDay]}` : dayWord;
}

/** "Couldn't complete X — what got in the way?" Non-punitive; every button, including closing, is a valid answer. */
export function MissedPrompt({
  open,
  prompt,
  onClose,
}: {
  open: boolean;
  /** Kept by the shell after closing, so the sheet still shows it while it leaves. */
  prompt: MissedPromptView | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={open && prompt !== null} onClose={onClose} label="O que atrapalhou?">
      {prompt && <PromptBody key={prompt.cycleId} prompt={prompt} onClose={onClose} />}
    </Sheet>
  );
}

function PromptBody({ prompt, onClose }: { prompt: MissedPromptView; onClose: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState<MissedReason | null>(prompt.reason);
  const [otherText, setOtherText] = useState(prompt.reasonText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const suggestion = suggestAdjustment(reason, prompt.taskTimeOfDay, prompt.today);
  const suggestionTitle =
    reason === "too_tired"
      ? SUGGESTION_TITLE.too_tired
      : reason === "unexpected"
        ? SUGGESTION_TITLE.unexpected
        : SUGGESTION_TITLE.default;

  function respond(action: "accept" | "decline" | "reflect") {
    setError(null);
    startTransition(async () => {
      const result = await respondToCycle({ cycleId: prompt.cycleId, action, reason, reasonText: otherText });
      if (!result.ok) return setError(result.error);
      onClose();
      if (action === "reflect") router.push(`/refletir/escrever?ciclo=${prompt.cycleId}`);
    });
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="text-xs text-muted lg:text-[13px]">
          {[prompt.goalTitle, whenPhrase(prompt.missedOn, prompt.taskTimeOfDay, prompt.today)]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <h2 className="mt-2 text-lg leading-[1.4] font-medium tracking-[-0.01em] lg:mt-1.5 lg:text-[21px] lg:leading-[1.35] lg:font-semibold">
          Não deu para concluir “{prompt.taskTitle}” — o que atrapalhou?
        </h2>
      </div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Motivo" onKeyDown={arrowFocus}>
        {MISSED_REASONS.map((r) => (
          <Pill
            key={r}
            role="radio"
            aria-checked={reason === r}
            active={reason === r}
            dashed={r === "other"}
            onClick={() => setReason(reason === r ? null : r)}
          >
            {r === "other" ? "Outro…" : REASON_LABEL[r]}
          </Pill>
        ))}
      </div>
      {reason === "other" && (
        <input
          autoFocus
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          maxLength={200}
          placeholder="Com suas palavras"
          aria-label="Outro motivo"
          className="-mt-2 rounded-[14px] border border-field-line bg-surface px-4 py-3 text-base outline-none focus:border-ink lg:text-sm"
        />
      )}

      <div className="flex flex-col gap-1 rounded-2xl bg-ok-bg px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
        <div>
          <div className="text-[11px] tracking-[0.06em] text-ok-ink">SUGESTÃO</div>
          <div className="text-base font-medium lg:mt-[3px] lg:text-[17px] lg:font-semibold">{suggestionTitle}</div>
        </div>
        <div className="text-xs text-muted lg:text-[13px]">
          {formatDayShort(suggestion.date)}
          {suggestion.timeOfDay && ` · ${TIME_OF_DAY_LABEL[suggestion.timeOfDay]}`}
        </div>
      </div>

      {prompt.priorStreak >= 2 && (
        <p className="text-xs leading-[1.55] text-muted lg:text-[13px]">
          Terceira vez que isso acontece. Se deixar de novo, ela será movida como sugerido.
        </p>
      )}
      {error && <p className="animate-rise text-[13px] text-miss">{error}</p>}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-2.5">
        <div className="flex flex-1 gap-2.5">
          <Button size="lg" className="flex-1" disabled={pending} onClick={() => respond("accept")}>
            Aceitar
          </Button>
          <Button size="lg" variant="secondary" className="flex-1" disabled={pending} onClick={() => respond("decline")}>
            Deixar assim
          </Button>
        </div>
        <Button variant="link" size="lg" disabled={pending} onClick={() => respond("reflect")}>
          Refletir sobre isso
        </Button>
      </div>
    </div>
  );
}
