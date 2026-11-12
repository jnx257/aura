"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useLongPress } from "@/lib/use-long-press";
import { exitTiming, prefersReducedMotion } from "@/lib/motion";
import type { LocalDate } from "@/lib/dates";
import type { GoalOption, GoalSummaryView, MissedPromptView, TaskView } from "@/lib/views";
import { signOut } from "@/server/actions/auth";
import { GoalEditor } from "./goal-editor";
import { MissedPrompt } from "./missed-prompt";
import { TaskEditor, type TaskDefaults } from "./task-editor";
import { SlidingHighlight, useSlidingHighlight } from "./sliding";
import { ActionMenu, cn } from "./ui";

type ShellContext = {
  today: LocalDate;
  goals: GoalOption[];
  openTaskEditor: (task?: TaskView, defaults?: TaskDefaults) => void;
  openMissed: (prompt: MissedPromptView) => void;
  openGoalEditor: (goal?: GoalSummaryView) => void;
};

const Ctx = createContext<ShellContext | null>(null);

export function useShell() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShell outside AppShell");
  return ctx;
}

type Overlay =
  | { kind: "task"; task?: TaskView; defaults?: TaskDefaults }
  | { kind: "missed"; prompt: MissedPromptView }
  | { kind: "goal"; goal?: GoalSummaryView }
  | null;

const DO_TABS = [
  { href: "/hoje", label: "Hoje" },
  { href: "/semana", label: "Semana" },
  { href: "/metas", label: "Metas" },
];

export function AppShell({
  userName,
  today,
  goals,
  children,
}: {
  userName: string;
  today: LocalDate;
  goals: GoalOption[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // The room (Fazer or Refletir) normally follows the route. When the switch is used it changes first and the
  // navigation follows, so the lamp comes on instantly instead of waiting for the next page to render. The change
  // only holds for the page it was made on; once the route actually changes, the route is the truth again.
  const [pending, setPending] = useState<{ mode: Mode; from: string } | null>(null);
  const routeMode: Mode = pathname.startsWith("/refletir") ? "reflect" : "do";
  const mode = pending && pending.from === pathname ? pending.mode : routeMode;
  const reflect = mode === "reflect";
  // Which of Hoje / Semana / Metas is active. Like the room, a tap selects it at once (so the highlight slides
  // immediately) and the route catches up; the tap only counts for the page it was made on.
  const [tabPending, setTabPending] = useState<{ href: string; from: string } | null>(null);
  const routeTab = DO_TABS.find((t) => pathname.startsWith(t.href))?.href ?? null;
  const activeTab = tabPending && tabPending.from === pathname ? tabPending.href : routeTab;
  const selectTab = (href: string) => setTabPending({ href, from: pathname });
  const [overlay, setOverlay] = useState<Overlay>(null);

  // Going between Fazer and Refletir dims (or lights) the whole room instead of snapping. The class has to be on
  // <html> before the new mode's colours are computed, so it goes on in a layout effect, and only on a real change.
  const previousMode = useRef(mode);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const changed = previousMode.current !== mode;
    previousMode.current = mode;
    // Keep <html> in the same mode so overscroll and the browser chrome match. Done here, in the same commit as
    // the shell's own mode, so a view transition's "new" snapshot already has the whole window in the new palette.
    root.dataset.mode = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", reflect ? "#1F1D1A" : "#F6F3EE");
    if (!changed) return;
    // When the switch started a view transition (the circular reveal) it owns the change. Otherwise (browser back,
    // a deep link, a browser without view transitions) fall back to the colour cross-fade.
    if (viewTransitionActive(root)) return;
    root.classList.add("mode-shift");
    const timer = setTimeout(() => root.classList.remove("mode-shift"), 700);
    return () => {
      clearTimeout(timer);
      root.classList.remove("mode-shift");
    };
  }, [mode, reflect]);

  function switchMode(target: Mode, href: string, e: MouseEvent<HTMLElement>) {
    // Let the browser handle new-tab clicks and the like.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (target === mode) {
      router.push(href);
      return;
    }
    router.prefetch(href);
    const apply = () => setPending({ mode: target, from: pathname });
    let navigated = false;
    const go = () => {
      if (navigated) return;
      navigated = true;
      router.push(href);
    };
    if (!("startViewTransition" in document) || prefersReducedMotion()) {
      // No reveal: the colour cross-fade in the layout effect above does the work.
      apply();
      go();
      return;
    }
    markRevealOrigin(e);
    const reveal = document.startViewTransition({ update: () => flushSync(apply), types: ["mode-shift"] });
    // The browser rejects these when a transition is skipped or overlaps another; that is fine, so say so.
    // The content changes in two beats with the lamp: the old page fades out as the light starts to spread, and the
    // new page rises in when it arrives (its normal entrance). Neither starts before the transition is `ready`: it
    // has to capture the old room first, or it would capture the new page in the old colours. `finished` is the
    // safety net for the navigation.
    reveal.ready.then(
      () => {
        fadeOutPage(pathname);
        go();
      },
      () => {},
    );
    reveal.updateCallbackDone.catch(() => {});
    reveal.finished.catch(() => {}).finally(go);
  }

  const ctx: ShellContext = {
    today,
    goals,
    openTaskEditor: (task, defaults) => setOverlay({ kind: "task", task, defaults }),
    openMissed: (prompt) => setOverlay({ kind: "missed", prompt }),
    openGoalEditor: (goal) => setOverlay({ kind: "goal", goal }),
  };
  const close = () => setOverlay(null);

  // Full-screen mobile views bring their own top bar.
  const bareOnMobile = pathname.startsWith("/refletir/escrever") || /^\/metas\/[^/]+/.test(pathname);
  const onGoals = pathname.startsWith("/metas");

  return (
    <Ctx.Provider value={ctx}>
      <div data-mode={mode} className="min-h-dvh bg-bg text-ink">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-10 hidden h-16 items-center gap-7 border-b border-line bg-bg px-7 lg:flex">
          <Link href="/hoje" className="text-[15px] font-semibold">
            Aura
          </Link>
          <ModeSwitch reflect={reflect} size="sm" onSwitch={switchMode} />
          {!reflect && <SectionTabs variant="desktop" active={activeTab} onSelect={selectTab} />}
          <div className="ml-auto flex items-center gap-3">
            {reflect ? (
              <Link
                href="/refletir/escrever"
                className="animate-fade rounded-full bg-ink px-4 py-[9px] text-[13px] font-semibold text-on-ink"
              >
                Escrever
              </Link>
            ) : onGoals ? (
              <button
                onClick={() => ctx.openGoalEditor()}
                className="animate-fade rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:bg-sunken"
              >
                + Nova meta
              </button>
            ) : (
              <NewTaskButton placement="bar" />
            )}
            <AccountMenu name={userName} />
          </div>
        </header>

        {/* Mobile header */}
        {!bareOnMobile && (
          <header className="lg:hidden">
            <div className="flex items-center justify-between px-5 pt-4">
              <ModeSwitch reflect={reflect} size="md" onSwitch={switchMode} />
              <AccountMenu name={userName} />
            </div>
            {!reflect && <SectionTabs variant="mobile" active={activeTab} onSelect={selectTab} />}
          </header>
        )}

        {children}

        {/* Mobile floating action */}
        {!reflect && !onGoals && <NewTaskButton placement="fab" />}

        <TaskEditor
          open={overlay?.kind === "task"}
          task={overlay?.kind === "task" ? overlay.task : undefined}
          defaults={overlay?.kind === "task" ? overlay.defaults : undefined}
          onClose={close}
        />
        <MissedPrompt prompt={overlay?.kind === "missed" ? overlay.prompt : null} onClose={close} />
        <GoalEditor
          open={overlay?.kind === "goal"}
          goal={overlay?.kind === "goal" ? overlay.goal : undefined}
          onClose={close}
        />
      </div>
    </Ctx.Provider>
  );
}

/**
 * The "new task" button, in the desktop bar and as the phone's floating +. A tap opens the task editor; holding
 * it opens the three things people start from: a task, a goal, a reflection. (Each also has its own button
 * elsewhere, so the hold is a shortcut and never the only way.)
 */
function NewTaskButton({ placement }: { placement: "bar" | "fab" }) {
  const { openTaskEditor, openGoalEditor } = useShell();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const hold = useLongPress(() => setOpen(true));
  const closeMenu = useCallback(() => setOpen(false), []);
  const fab = placement === "fab";
  const hintId = useId();

  return (
    <div className={cn("animate-fade", fab ? "fixed right-5 bottom-10 lg:hidden" : "relative")}>
      <span id={hintId} className="sr-only">
        Segure para ver mais atalhos
      </span>
      <button
        type="button"
        onClick={() => openTaskEditor()}
        {...hold.props}
        data-holding={hold.holding}
        aria-label={fab ? "Nova tarefa" : undefined}
        aria-describedby={hintId}
        style={{ "--hold-color": "color-mix(in oklch, var(--on-ink) 24%, transparent)" } as CSSProperties}
        className={cn(
          "holdable bg-ink text-on-ink transition-[scale] duration-(--dur-feedback) active:scale-95 motion-reduce:active:scale-100",
          fab
            ? "flex size-14 items-center justify-center rounded-full text-2xl font-light shadow-fab"
            : "rounded-full px-4 py-[9px] text-[13px] font-semibold",
        )}
      >
        {fab ? "+" : "+ Nova tarefa"}
      </button>
      {open && (
        <ActionMenu
          title="Começar com"
          onClose={closeMenu}
          className={fab ? "absolute right-0 bottom-full mb-3" : "absolute top-full right-0 mt-2"}
          items={[
            { label: "Nova tarefa", onSelect: () => openTaskEditor() },
            { label: "Nova meta", onSelect: () => openGoalEditor() },
            { label: "Escrever uma reflexão", onSelect: () => router.push("/refletir/escrever") },
          ]}
        />
      )}
    </div>
  );
}

/**
 * Fades out the page that is leaving, on that element only (so the page that replaces it is untouched). Exits are
 * quicker than arrivals. If the navigation never happens, the page comes back instead of staying invisible.
 */
function fadeOutPage(fromPath: string) {
  const page = document.querySelector<HTMLElement>(".route-enter");
  if (!page) return;
  const fade = page.animate([{ opacity: 1 }, { opacity: 0 }], { ...exitTiming(), fill: "forwards" });
  window.setTimeout(() => {
    if (window.location.pathname === fromPath) fade.cancel();
  }, 2500);
}

function viewTransitionActive(root: HTMLElement) {
  try {
    return root.matches(":active-view-transition");
  } catch {
    return false; // the selector is not supported
  }
}

/**
 * Tells the Fazer <-> Refletir view transition where the new room should spread from: the switch itself. Sets the
 * circle's centre and the radius needed to reach the farthest corner of the window.
 */
function markRevealOrigin(e: MouseEvent<HTMLElement>) {
  const box = e.currentTarget.getBoundingClientRect();
  // A keyboard-initiated click has no pointer position; spread from the middle of the control instead.
  const x = e.detail === 0 ? box.x + box.width / 2 : e.clientX;
  const y = e.detail === 0 ? box.y + box.height / 2 : e.clientY;
  const root = document.documentElement.style;
  root.setProperty("--reveal-x", `${Math.round(x)}px`);
  root.setProperty("--reveal-y", `${Math.round(y)}px`);
  root.setProperty(
    "--reveal-r",
    `${Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)))}px`,
  );
}

type Mode = "do" | "reflect";

function ModeSwitch({
  reflect,
  size,
  onSwitch,
}: {
  reflect: boolean;
  size: "sm" | "md";
  onSwitch: (target: Mode, href: string, e: MouseEvent<HTMLElement>) => void;
}) {
  const router = useRouter();
  const item = size === "md" ? "px-5 py-2 text-sm" : "px-[18px] py-1.5 text-[13px]";
  const inset = size === "md" ? "top-1 bottom-1 left-1 w-[calc(50%-4px)]" : "top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)]";
  return (
    <nav
      className={cn("relative grid grid-cols-2 rounded-full bg-sunken", size === "md" ? "p-1" : "p-[3px]")}
      aria-label="Modo"
    >
      {/* One thumb that travels between the two halves, so the switch reads as a single control changing state. */}
      <span
        aria-hidden
        className={cn(
          "absolute rounded-full bg-raised shadow-thumb transition-[translate] duration-(--dur-spring) ease-(--ease-spring) motion-reduce:transition-none",
          inset,
          reflect && "translate-x-full",
        )}
      />
      {(
        [
          { href: "/hoje", label: "Fazer", target: "do", active: !reflect },
          { href: "/refletir", label: "Refletir", target: "reflect", active: reflect },
        ] as const
      ).map((m) => (
        <Link
          key={m.label}
          href={m.href}
          // Warm the other room as soon as the pointer or focus reaches it, so the click only has to swap.
          onPointerEnter={() => !m.active && router.prefetch(m.href)}
          onFocus={() => !m.active && router.prefetch(m.href)}
          onClick={(e) => onSwitch(m.target, m.href, e)}
          aria-current={m.active ? "page" : undefined}
          className={cn(
            "relative rounded-full text-center transition-colors",
            item,
            m.active ? "font-semibold" : "text-muted",
          )}
        >
          {m.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Hoje / Semana / Metas. One component for both layouts: a bar with a sliding pill on desktop, and a text row with a
 * sliding underline on phones. The highlight travels between tabs instead of jumping.
 */
function SectionTabs({
  variant,
  active,
  onSelect,
}: {
  variant: "desktop" | "mobile";
  active: string | null;
  onSelect: (href: string) => void;
}) {
  const { container, highlight, item } = useSlidingHighlight(active);
  const desktop = variant === "desktop";
  return (
    <nav
      ref={container}
      aria-label="Seções"
      className={cn(
        "relative flex animate-fade",
        desktop ? "gap-1 text-sm" : "mt-4 gap-6 border-b border-line px-5 text-[13px]",
      )}
    >
      <SlidingHighlight
        highlightRef={highlight}
        className={desktop ? "top-0 h-full rounded-lg bg-sunken" : "-bottom-px h-0.5 bg-ink"}
      />
      {DO_TABS.map((t) => {
        const current = t.href === active;
        return (
          <Link
            key={t.href}
            ref={item(t.href)}
            href={t.href}
            onClick={() => onSelect(t.href)}
            aria-current={current ? "page" : undefined}
            className={cn(
              "relative z-10 transition-colors",
              desktop ? "rounded-lg px-3 py-[7px]" : "-mb-px pb-2.5",
              current ? (desktop ? "font-semibold" : "font-medium") : desktop ? "text-muted hover:text-ink" : "text-muted",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenu({ name }: { name: string }) {
  const ref = useRef<HTMLDetailsElement>(null);

  // A <details> menu stays open until its summary is clicked again; close it on outside click and Esc.
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) {
        el.open = false;
        if (e instanceof KeyboardEvent) el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details ref={ref} className="menu-pop relative">
      <summary
        aria-label="Conta"
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full bg-sunken text-[13px] font-semibold lg:size-[34px] [&::-webkit-details-marker]:hidden"
      >
        {name.trim().charAt(0).toUpperCase()}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-menu">
        <div className="px-3 py-2 text-[13px] font-semibold">{name}</div>
        <p className="px-3 pb-2 text-[11px] leading-snug text-muted">
          Atalho: segure uma tarefa, uma meta ou o botão de nova tarefa.
        </p>
        <form action={signOut}>
          <button className="w-full rounded-xl px-3 py-2 text-left text-[13px] text-muted hover:bg-sunken hover:text-ink">
            Sair
          </button>
        </form>
      </div>
    </details>
  );
}
