"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PaneLink, leavePane } from "@/components/pane-swap";
import { ConfirmDelete, arrowFocus, cn } from "@/components/ui";
import { MOODS, type Mood } from "@/domain/types";
import { formatDayCapsMonth, type LocalDate } from "@/lib/dates";
import { MOOD_LABEL } from "@/lib/labels";
import type { JournalInput } from "@/lib/schemas";
import { deleteEntry, saveEntry } from "@/server/actions/journal";

type Body = JournalInput["body"];

export type EditorSeed = {
  id?: string;
  status: "draft" | "saved";
  entryDate: LocalDate;
  title: string;
  body: Body;
  mood: Mood | null;
  taskId: string | null;
  goalId: string | null;
  cycleId: string | null;
  chips: string[];
  reasonChip: string | null;
};

const GUIDED: { key: "happened" | "hindered" | "helps"; label: string }[] = [
  { key: "happened", label: "O QUE ACONTECEU?" },
  { key: "hindered", label: "O QUE ATRAPALHOU?" },
  { key: "helps", label: "O QUE PODERIA AJUDAR?" },
];

const AUTOSAVE_MS = 1500;

// A writing field still has to look like one: a visible boundary (3:1), a surface a shade off the page, and a
// stronger edge while writing. The look stays quiet; it is the contrast that carries it.
const textareaClass =
  "w-full resize-none rounded-[14px] border border-field-line bg-surface px-4 py-3 text-base leading-[1.7] text-body outline-none focus:border-ink [field-sizing:content] placeholder:text-faint lg:px-5 lg:py-4 lg:text-[17px] min-h-[3.5em]";

/** One mood in the row under the editor. The underline and label cross-fade when it is chosen. */
function MoodChoice({ mood, selected, onToggle }: { mood: Mood; selected: boolean; onToggle: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "-my-2 py-2 transition-colors duration-(--dur-fade) ease-(--ease-fade)",
        selected ? "text-ink" : "hover:text-ink",
      )}
    >
      <span
        className={cn(
          "inline-block border-b pb-[3px] transition-[border-color] duration-(--dur-fade) ease-(--ease-fade)",
          selected ? "border-ink" : "border-transparent",
        )}
      >
        {MOOD_LABEL[mood]}
      </span>
    </button>
  );
}

/** Calm writing surface. Drafts save themselves; nothing here is required. */
export function JournalEditor({ seed }: { seed: EditorSeed }) {
  const router = useRouter();
  const [id, setId] = useState(seed.id);
  const [title, setTitle] = useState(seed.title);
  const [body, setBody] = useState<Body>(seed.body);
  const [mood, setMood] = useState<Mood | null>(seed.mood);
  const [status, setStatus] = useState(seed.status);
  // What the person needs to know about their text: is it kept, and does it still need Salvar.
  const [touched, setTouched] = useState(false);
  const [autosave, setAutosave] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = useRef(false);
  // Autosave and Salvar share one in-flight write so a first save never creates two entries.
  const inflight = useRef<Promise<string | undefined>>(Promise.resolve(seed.id));

  const hasContent =
    title.trim() !== "" ||
    (body.kind === "free" ? body.text.trim() !== "" : GUIDED.some((g) => body[g.key].trim() !== ""));

  const payload = (nextStatus: "draft" | "saved", currentId: string | undefined): JournalInput => ({
    id: currentId,
    title,
    body,
    mood,
    taskId: seed.taskId,
    goalId: seed.goalId,
    cycleId: seed.cycleId,
    status: nextStatus,
  });

  // Autosave drafts quietly while writing.
  useEffect(() => {
    if (!dirty.current || status !== "draft" || !hasContent) return;
    const timer = setTimeout(() => {
      setAutosave("saving");
      inflight.current = inflight.current.then(async (currentId) => {
        const result = await saveEntry(payload("draft", currentId));
        if (!result.ok) {
          setAutosave("failed");
          return currentId;
        }
        setAutosave("saved");
        if (!currentId) {
          setId(result.id);
          window.history.replaceState(null, "", `/refletir/escrever?id=${result.id}`);
        }
        return result.id;
      });
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, mood]);

  function edit<T>(setter: (v: T) => void) {
    return (v: T) => {
      dirty.current = true;
      setTouched(true);
      setter(v);
    };
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveEntry(payload("saved", await inflight.current));
      if (!result.ok) return setError(result.error);
      setStatus("saved");
      leavePane("prev");
      router.push("/refletir");
    });
  }

  // Autosave only applies to drafts. A reflection that is already saved keeps what it had until Salvar, which is
  // exactly the thing worth saying out loud.
  const statusText =
    status === "saved"
      ? touched
        ? "Mudanças ainda não salvas. Toque em Salvar para guardá-las."
        : "Reflexão salva."
      : autosave === "saving"
        ? "Salvando o rascunho…"
        : autosave === "saved"
          ? "Rascunho salvo. Toque em Salvar quando terminar."
          : autosave === "failed"
            ? "Não deu para salvar o rascunho agora. Tente Salvar."
            : "Enquanto você escreve, o texto vira rascunho. Salvar conclui a reflexão.";

  const setGuided = (key: (typeof GUIDED)[number]["key"]) =>
    edit((v: string) => setBody((b) => (b.kind === "guided" ? { ...b, [key]: v } : b)));

  return (
    <div className="flex min-h-dvh flex-col lg:min-h-[calc(100dvh-4rem)]">
      {/* Phone top bar */}
      <div className="flex items-center justify-between px-[22px] pt-4 text-[13px] lg:hidden">
        <PaneLink
          direction="prev"
          href="/refletir"
          aria-label="Voltar para as reflexões"
          className="-m-2.5 p-2.5 text-muted"
        >
          Voltar
        </PaneLink>
        <span className="text-[11px] tracking-[0.08em] text-muted">{formatDayCapsMonth(seed.entryDate)}</span>
        <button
          onClick={save}
          disabled={pending || !hasContent}
          className="-m-2.5 p-2.5 font-medium disabled:opacity-40"
        >
          Salvar
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[620px] flex-1 flex-col gap-5 px-6 pt-[30px] pb-48 lg:gap-[22px] lg:px-0 lg:pt-10 lg:pb-32">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {seed.chips.map((c) => (
              <span key={c} className="rounded-full bg-chip px-2.5 py-[5px] text-[11px] text-ink lg:text-xs">
                {c}
              </span>
            ))}
            {seed.reasonChip && (
              <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted lg:text-xs">
                {seed.reasonChip}
              </span>
            )}
            {seed.chips.length === 0 && (
              <span
                aria-disabled
                className="cursor-not-allowed rounded-full border border-dashed border-dash px-2.5 py-1 text-[11px] text-muted"
              >
                Vincular a tarefa ou meta · em breve
              </span>
            )}
          </div>
          <span className="hidden text-[11px] tracking-[0.08em] whitespace-nowrap text-muted lg:inline">
            {formatDayCapsMonth(seed.entryDate)}
          </span>
        </div>

        <input
          value={title}
          onChange={(e) => edit(setTitle)(e.target.value)}
          placeholder="Título (opcional)"
          aria-label="Título"
          className="border-b border-field-line bg-transparent pb-3 text-xl leading-[1.35] font-medium tracking-[-0.01em] outline-none placeholder:text-faint focus:border-ink lg:text-[30px] lg:leading-[1.25] lg:font-semibold lg:tracking-[-0.02em]"
        />

        {body.kind === "guided" ? (
          GUIDED.map((g, i) => (
            <label key={g.key} className="flex flex-col gap-2">
              <span
                className={cn(
                  "text-[11px] tracking-[0.06em]",
                  body[g.key] || i === 0 ? "text-muted" : "text-faint",
                )}
              >
                {g.label}
              </span>
              <textarea
                value={body[g.key]}
                onChange={(e) => setGuided(g.key)(e.target.value)}
                autoFocus={i === 0 && !seed.id}
                className={textareaClass}
              />
            </label>
          ))
        ) : (
          <>
            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.06em] text-muted">O QUE ESTÁ NA SUA CABEÇA?</span>
              <textarea
                value={body.text}
                onChange={(e) => edit((v: string) => setBody({ kind: "free", text: v }))(e.target.value)}
                autoFocus={!seed.id}
                className={cn(textareaClass, "min-h-[30vh]")}
              />
            </label>
          </>
        )}
        <p className="text-xs text-muted">
          {body.kind === "guided"
            ? "Responda só o que fizer sentido. Nada é obrigatório."
            : "Escrita livre: escreva como quiser. Nada é obrigatório."}
        </p>
        <p role="status" className="-mt-2 text-xs text-muted">
          {statusText}
        </p>

        {error && <p className="animate-rise text-[13px] text-miss">{error}</p>}
        {id && (
          <ConfirmDelete
            label="Apagar reflexão"
            prompt="Apagar esta reflexão? Não dá para desfazer."
            confirmLabel="Segure para apagar"
            pending={pending}
            onConfirm={() =>
              startTransition(async () => {
                await deleteEntry(id);
                router.push("/refletir");
              })
            }
          />
        )}
      </div>

      {/* Mood + save */}
      <div className="fixed right-0 bottom-0 left-0 border-t border-line bg-bg px-[22px] pt-4 pb-[38px] lg:absolute lg:px-0 lg:pt-[18px] lg:pb-[22px]">
        <div className="mx-auto flex max-w-[620px] flex-col gap-3 lg:flex-row lg:items-center lg:gap-7">
          <span className="text-[11px] tracking-[0.06em] text-muted">HUMOR · OPCIONAL</span>
          <div
            className="flex justify-between text-xs text-muted lg:gap-[22px] lg:text-[13px]"
            role="radiogroup"
            aria-label="Humor"
            onKeyDown={arrowFocus}
          >
            {MOODS.map((m) => (
              <MoodChoice
                key={m}
                mood={m}
                selected={mood === m}
                onToggle={() => edit(setMood)(mood === m ? null : m)}
              />
            ))}
          </div>
          <button
            onClick={save}
            disabled={pending || !hasContent}
            className="ml-auto hidden rounded-full bg-ink px-[18px] py-[9px] text-[13px] font-semibold text-on-ink disabled:opacity-40 lg:block"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
