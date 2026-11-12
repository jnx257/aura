"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { DriftState } from "@/domain/goals";
import { cn } from "@/lib/cn";
import { useLongPress } from "@/lib/use-long-press";
import { usePresence } from "@/lib/use-presence";

export { cn };

/** Deleting asks for a longer hold than a shortcut does: it should feel deliberate. */
const DELETE_HOLD_MS = 700;

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
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[opacity,background-color,color,scale] duration-(--dur-feedback) enabled:active:scale-[0.97] disabled:opacity-50 motion-reduce:enabled:active:scale-100",
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

/**
 * A quiet delete link that asks once, inline, before acting. Cancel takes focus so Enter never deletes by accident.
 * With a pointer the confirmation has to be held (a soft fill shows it charging); a tap does nothing, so a stray
 * touch cannot delete. From the keyboard, Enter or Space confirms at once: there is nothing to hold.
 */
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
  const hold = useLongPress(onConfirm, { ms: DELETE_HOLD_MS, disabled: pending });
  const hintId = useId();
  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="-my-2 animate-fade self-start py-2 text-[13px] text-muted underline underline-offset-[3px] hover:text-miss"
      >
        {label}
      </button>
    );
  }
  return (
    <div
      role="group"
      aria-label={prompt}
      className="flex animate-fade flex-wrap items-center gap-x-4 gap-y-1 self-start text-[13px]"
    >
      <span>{prompt}</span>
      <span id={hintId} className="sr-only">
        Com o teclado, Enter ou Espaço confirmam. Com o mouse ou toque, mantenha pressionado.
      </span>
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
        {...hold.props}
        data-holding={hold.holding}
        // detail is 0 for a keyboard-initiated click; a mouse or touch click has to be a hold instead.
        onClick={(e) => e.detail === 0 && onConfirm()}
        aria-describedby={hintId}
        style={{ "--hold-ms": `${DELETE_HOLD_MS}ms`, "--hold-color": "var(--miss-bg)" } as CSSProperties}
        className="holdable -mx-2 -my-2 rounded-lg px-2 py-2 font-semibold text-miss underline underline-offset-[3px] disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  );
}

// ---------- Menu ----------

export type ActionMenuItem = { label: string; hint?: string; onSelect: () => void };

/**
 * A small menu opened from a long press. Esc or a press outside closes it and hands focus back; the arrow keys
 * move between items. Place it with `className` inside a `relative` parent.
 */
export function ActionMenu({
  title,
  items,
  onClose,
  className,
  closing,
  onExited,
}: {
  title: string;
  items: ActionMenuItem[];
  onClose: () => void;
  className?: string;
  /** With `usePresence`: true while the menu is leaving, and what to call once it has (see NewTaskButton). */
  closing?: boolean;
  onExited?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  // Focus goes back to whatever opened the menu as soon as it starts to leave, not when it is finally gone.
  useEffect(() => {
    if (!closing) return;
    opener.current?.focus?.();
    opener.current = null;
    // In case the exit animation never reports back, so the menu cannot stay mounted and invisible.
    const timer = window.setTimeout(() => onExited?.(), 320);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  useEffect(() => {
    const menu = ref.current;
    opener.current = document.activeElement as HTMLElement | null;
    const entries = () => Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    entries()[0]?.focus();
    const away = (e: Event) => {
      if (!menu?.contains(e.target as Node)) close.current();
    };
    const keys = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const list = entries();
        const at = list.indexOf(document.activeElement as HTMLElement);
        list[(at + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
      }
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", keys);
      opener.current?.focus?.();
    };
  }, []);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={title}
      onAnimationEnd={(e) => closing && e.target === e.currentTarget && onExited?.()}
      className={cn(
        "z-30 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-menu",
        closing ? "pointer-events-none animate-pop-out" : "animate-pop",
        className,
      )}
    >
      <div className="px-3 pt-1.5 pb-1 text-[11px] text-muted" aria-hidden>
        {title}
      </div>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          onClick={() => {
            close.current();
            item.onSelect();
          }}
          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-sunken focus-visible:bg-sunken"
        >
          <span className="font-medium">{item.label}</span>
          {item.hint && <span className="text-[11px] text-muted">{item.hint}</span>}
        </button>
      ))}
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
  const next = isEdge
    ? e.key === "Home"
      ? 0
      : radios.length - 1
    : (i + step! + radios.length) % radios.length;
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
  justDone,
}: {
  state: CheckState;
  size?: "sm" | "md";
  onToggle?: () => void;
  label: string;
  disabled?: boolean;
  /** True only while a completion the person just made is on screen; draws the tick instead of showing it. */
  justDone?: boolean;
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
        state === "done" && justDone && "animate-check",
      )}
    >
      {state === "done" && (
        <svg width={size === "md" ? 12 : 9} height={size === "md" ? 12 : 9} viewBox="0 0 12 12" aria-hidden>
          <path
            className={justDone ? "animate-tick" : undefined}
            pathLength={1}
            strokeDasharray={justDone ? 1 : undefined}
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
      className="h-1 grow overflow-hidden rounded-sm bg-divider"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* A full-width fill pushed left by the share that is not done: progress moves it, the track clips it. */}
      <div
        className={cn(
          "h-full w-full animate-bar rounded-sm transition-[translate] duration-(--dur-layout) motion-reduce:animate-none",
          drift === "drifting" ? "bg-miss" : "bg-ok",
        )}
        style={{ translate: `${pct - 100}% 0` }}
      />
    </div>
  );
}

// ---------- Text & containers ----------

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[11px] tracking-[0.08em] text-muted uppercase", className)}>{children}</div>
  );
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
        "chip-fade rounded-full border px-[13px] py-[9px] text-[13px] active:scale-[0.97] motion-reduce:active:scale-100 lg:px-[14px] lg:text-sm",
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
      {(error || hint) && (
        <span className={cn("text-[11px]", error ? "text-miss" : "text-muted")}>{error ?? hint}</span>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[14px] border border-field-line bg-surface px-4 py-[15px] text-base text-ink outline-none lg:text-[15px] placeholder:text-faint focus:border-ink focus:border-[1.5px]";

// ---------- Sheet / dialog ----------

/** How far (as a share of the sheet’s height) it has to be pulled down to go, and how fast a flick has to be. */
const DISMISS_DISTANCE = 0.3;
const DISMISS_VELOCITY = 0.6; // px per ms

/**
 * Makes the phone’s bottom sheet draggable by its grabber: it follows the finger, the backdrop fades with it, and on
 * release it either leaves (pulled far enough, or flicked) or settles back. Spread the returned props on the handle.
 * Dragging is an extra: Esc, Fechar and a tap on the backdrop still close the sheet. Does nothing from the `lg`
 * breakpoint up, where the dialog is centred and has no grabber.
 */
function useSheetDrag(onClose: () => void) {
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ startY: number; lastY: number; lastT: number; velocity: number } | null>(null);

  const finish = (cancelled: boolean) => {
    const d = drag.current;
    const el = dialog.current;
    drag.current = null;
    if (!d || !el) return;
    const pulled = d.lastY - d.startY;
    delete el.dataset.dragging;
    el.style.willChange = "";
    const leaves =
      !cancelled &&
      (pulled > el.offsetHeight * DISMISS_DISTANCE || (d.velocity > DISMISS_VELOCITY && pulled > 24));
    if (leaves) {
      // Carry on in the direction it was going, a little faster than it came, and close once it is off screen
      // (the timer is only for a transition that never reports back).
      let closed = false;
      const done = (e?: TransitionEvent) => {
        if (closed || (e && (e.target !== el || e.propertyName !== "translate"))) return;
        closed = true;
        el.removeEventListener("transitionend", done);
        el.dataset.gone = ""; // already off screen: the Sheet closes it without playing an exit
        onClose();
      };
      el.addEventListener("transitionend", done);
      window.setTimeout(done, 400);
      el.style.transition = "translate var(--dur-exit) var(--ease-in)";
      el.style.translate = "0 100%";
      el.style.setProperty("--drag", "1");
    } else {
      // Settle back: clearing the inline values lets the dialog’s own transition ease it home.
      el.style.transition = "";
      el.style.translate = "";
      el.style.removeProperty("--drag");
    }
  };

  const handle = {
    onPointerDown(e: React.PointerEvent<HTMLElement>) {
      const el = dialog.current;
      if (!el || window.matchMedia("(min-width: 1024px)").matches) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId); // keep the drag if the finger slips off the handle
      } catch {
        // not every pointer can be captured; the drag still works while it stays on the handle
      }
      drag.current = { startY: e.clientY, lastY: e.clientY, lastT: e.timeStamp, velocity: 0 };
      el.dataset.dragging = ""; // no transitions while it is following the finger (see globals.css)
      el.style.willChange = "translate"; // only while it is being dragged
    },
    onPointerMove(e: React.PointerEvent<HTMLElement>) {
      const d = drag.current;
      const el = dialog.current;
      if (!d || !el) return;
      const dt = e.timeStamp - d.lastT;
      if (dt > 0) d.velocity = (e.clientY - d.lastY) / dt;
      d.lastY = e.clientY;
      d.lastT = e.timeStamp;
      const pulled = e.clientY - d.startY;
      // Down follows the finger exactly; up resists, so it feels anchored to the bottom edge.
      const y = pulled > 0 ? pulled : pulled * 0.12;
      el.style.translate = `0 ${y}px`;
      el.style.setProperty("--drag", String(Math.min(1, Math.max(0, y / el.offsetHeight))));
    },
    onPointerUp: () => finish(false),
    onPointerCancel: () => finish(true),
  };
  return { dialog, handle };
}

/**
 * One overlay, two shapes: a bottom sheet on phones, a centered dialog on desktop. `size="lg"` is for forms with
 * several fields (the task editor): a taller sheet on phones and a 720px dialog on desktop, instead of 540px.
 * Built on <dialog> for focus trapping, Esc and the top layer.
 */
export function Sheet({
  open,
  onClose,
  children,
  label,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  size?: "md" | "lg";
}) {
  const { dialog: ref, handle } = useSheetDrag(onClose);
  // The content stays mounted while the sheet leaves, so it is the sheet that leaves and not an empty box.
  const { mounted, exited } = usePresence(open);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      delete el.dataset.closing; // reopened while it was leaving
      if (!el.open) {
        // A sheet that was dragged away left its inline values behind; start the next one clean.
        el.style.transition = "";
        el.style.translate = "";
        el.style.removeProperty("--drag");
        el.style.willChange = "";
        delete el.dataset.dragging;
        delete el.dataset.gone;
        el.showModal();
      }
      return;
    }
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      delete el.dataset.closing;
      if (el.open) el.close();
      exited();
    };
    // Nothing to play if the dialog is already closed (Esc pressed twice) or was dragged off screen.
    const plays = el.open && !("gone" in el.dataset);
    if (plays) el.dataset.closing = ""; // globals.css eases it out
    const onEnd = (e: TransitionEvent) => e.target === el && finish();
    el.addEventListener("transitionend", onEnd);
    // The timer covers a transition that never reports back; it is longer than any exit.
    const timer = window.setTimeout(finish, plays ? 320 : 0);
    return () => {
      el.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timer);
    };
  }, [open, ref, exited]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      // Esc asks to close, so the sheet can leave like it does from any other way out. The browser's own close
      // (Esc pressed again) still arrives as `close`; it is only passed on while the sheet is meant to be open, so
      // the close this component makes itself can never dismiss whatever was opened next.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => open && onClose()}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto bg-surface text-ink",
        // phone: bottom sheet
        "mt-auto rounded-t-[28px] px-[22px] pt-3 pb-10",
        "lg:m-auto lg:max-w-[calc(100vw-4rem)] lg:rounded-3xl lg:shadow-sheet",
        size === "md" && "lg:w-[540px] lg:p-7",
        size === "lg" && "min-h-[78dvh] lg:max-h-[88dvh] lg:min-h-0 lg:w-[720px] lg:p-9",
      )}
    >
      {/* The grabber. A full-width strip, tall enough for a thumb, that drags the whole sheet. */}
      <div
        {...handle}
        aria-hidden
        className="-mx-[22px] -mt-3 flex h-[33px] cursor-grab touch-none items-start justify-center pt-3 active:cursor-grabbing lg:hidden"
      >
        <span className="h-[5px] w-[38px] rounded-[3px] bg-dash-strong" />
      </div>
      {mounted && children}
    </dialog>
  );
}
