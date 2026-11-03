"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import type { DriftState } from "@/domain/goals";
import { cn } from "@/lib/cn";

export { cn };

// ---------- Buttons ----------

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-opacity disabled:opacity-50",
        size === "sm" && "px-3 py-2 text-xs",
        size === "md" && "px-4 py-[9px] text-[13px]",
        size === "lg" && "px-4 py-[14px] text-sm",
        variant === "primary" && "bg-ink text-on-ink hover:opacity-90",
        variant === "secondary" && "border border-line font-normal text-ink hover:bg-sunken",
        variant === "ghost" && "font-normal text-muted hover:text-ink",
        variant === "link" && "px-1 font-normal text-ink underline underline-offset-[3px]",
        className,
      )}
    />
  );
}

// ---------- Destructive action ----------

/** A quiet delete link that asks once, inline, before acting. Cancel takes focus so Enter never deletes by accident. */
export function ConfirmDelete({
  label,
  prompt,
  confirmLabel,
  pending,
  onConfirm,
}: {
  label: string;
  prompt: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="-my-2 self-start py-2 text-[13px] text-muted underline underline-offset-[3px] hover:text-miss"
      >
        {label}
      </button>
    );
  }
  return (
    <div role="group" aria-label={prompt} className="flex flex-wrap items-center gap-x-4 gap-y-1 self-start text-[13px]">
      <span>{prompt}</span>
      <button
        type="button"
        autoFocus
        onClick={() => setAsking(false)}
        className="-my-2 py-2 text-muted underline underline-offset-[3px] hover:text-ink"
      >
        Cancelar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onConfirm}
        className="-my-2 py-2 font-semibold text-miss underline underline-offset-[3px] disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  );
}

// ---------- Keyboard ----------

/**
 * Arrow keys (and Home/End) move focus between the `role="radio"` buttons of a group. Attach to the
 * `role="radiogroup"` container. Focus only: Space/Enter still choose, so nothing is selected by browsing.
 */
export function arrowFocus(e: KeyboardEvent<HTMLElement>) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  const isEdge = e.key === "Home" || e.key === "End";
  if (!step && !isEdge) return;
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)'));
  const i = radios.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const next = isEdge ? (e.key === "Home" ? 0 : radios.length - 1) : (i + step! + radios.length) % radios.length;
  radios[next].focus();
}

// ---------- Checkbox ----------

export type CheckState = "open" | "orphan" | "missed" | "done";

export function Checkbox({
  state,
  size = "md",
  onToggle,
  label,
  disabled,
}: {
  state: CheckState;
  size?: "sm" | "md";
  onToggle?: () => void;
  label: string;
  disabled?: boolean;
}) {
  // The visible box stays small; a transparent ::before grows the tap area (44px at md, 28px at sm where neighbours are close).
  const box =
    size === "md"
      ? "size-[22px] rounded-[7px] before:-inset-[11px]"
      : "size-4 rounded-[5px] before:-inset-1.5";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "done"}
      aria-label={label}
      onClick={onToggle}
      disabled={disabled || !onToggle}
      className={cn(
        "relative flex flex-none items-center justify-center transition-colors before:absolute before:content-['']",
        box,
        state === "done" && "bg-ok",
        state === "open" && "border border-ink hover:bg-sunken",
        state === "orphan" && "border border-dashed border-dash hover:bg-sunken",
        state === "missed" && "border border-miss hover:bg-miss-bg",
      )}
    >
      {state === "done" && (
        <svg width={size === "md" ? 12 : 9} height={size === "md" ? 12 : 9} viewBox="0 0 12 12" aria-hidden>
          <path
            d="M2.5 6.2l2.3 2.3 4.7-5"
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth={size === "md" ? 1.8 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

// ---------- Goal state ----------

export function DriftBadge({ drift, size = "sm" }: { drift: DriftState; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center rounded-full font-semibold",
        size === "sm" ? "px-2 py-[3px] text-[11px]" : "px-3 py-[5px] text-xs",
        drift === "drifting" ? "bg-miss-bg text-miss" : "bg-ok-bg text-ok",
      )}
    >
      {drift === "drifting" ? "Desviando" : "No rumo"}
    </span>
  );
}

export function ProgressBar({ done, total, drift }: { done: number; total: number; drift: DriftState }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className="h-1 grow rounded-sm bg-divider"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-sm", drift === "drifting" ? "bg-miss" : "bg-ok")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------- Text & containers ----------

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-[11px] tracking-[0.08em] text-muted uppercase", className)}>{children}</div>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-surface", className)}>{children}</div>;
}

export function Pill({
  active,
  dashed,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; dashed?: boolean }) {
  return (
    <button
      type="button"
      // A pill used as a radio reports aria-checked; aria-pressed is not valid on that role.
      aria-pressed={props.role ? undefined : active}
      {...props}
      className={cn(
        "rounded-full border px-[13px] py-[9px] text-[13px] transition-colors lg:px-[14px] lg:text-sm",
        active ? "border-ink bg-ink text-on-ink" : "border-line text-ink hover:bg-sunken",
        dashed && !active && "border-dashed border-dash-strong text-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Tag({ children, outline }: { children: ReactNode; outline?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-[9px] py-1 text-[11px]",
        outline ? "border border-line text-muted" : "bg-chip text-ink-soft",
      )}
    >
      {children}
    </span>
  );
}

// ---------- Fields ----------

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted">
        {label}
        {optional && <span className="text-faint"> · opcional</span>}
      </span>
      {children}
      {(error || hint) && <span className={cn("text-[11px]", error ? "text-miss" : "text-muted")}>{error ?? hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[14px] border border-field-line bg-surface px-4 py-[15px] text-base text-ink outline-none lg:text-[15px] placeholder:text-faint focus:border-ink focus:border-[1.5px]";

// ---------- Sheet / dialog ----------

/**
 * One overlay, two shapes: a bottom sheet on phones, a centered dialog (or right panel) on desktop.
 * Built on <dialog> for focus trapping, Esc and the top layer.
 */
export function Sheet({
  open,
  onClose,
  children,
  label,
  variant = "dialog",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  variant?: "dialog" | "panel";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto bg-surface text-ink",
        // phone: bottom sheet
        "mt-auto rounded-t-[28px] px-[22px] pt-3 pb-10",
        variant === "dialog" &&
          "lg:m-auto lg:w-[540px] lg:rounded-3xl lg:p-7 lg:shadow-sheet",
        variant === "panel" &&
          "lg:mt-0 lg:mr-0 lg:ml-auto lg:h-dvh lg:max-h-none lg:w-[360px] lg:rounded-none lg:border-l lg:border-line lg:p-6",
      )}
    >
      <div className="mx-auto mb-4 h-[5px] w-[38px] rounded-[3px] bg-line lg:hidden" aria-hidden />
      {open && children}
    </dialog>
  );
}
