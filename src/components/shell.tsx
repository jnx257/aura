"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { LocalDate } from "@/lib/dates";
import type { GoalOption, GoalSummaryView, MissedPromptView, TaskView } from "@/lib/views";
import { signOut } from "@/server/actions/auth";
import { GoalEditor } from "./goal-editor";
import { MissedPrompt } from "./missed-prompt";
import { TaskEditor, type TaskDefaults } from "./task-editor";
import { cn } from "./ui";

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
  const reflect = pathname.startsWith("/refletir");
  const mode = reflect ? "reflect" : "do";
  const [overlay, setOverlay] = useState<Overlay>(null);

  // Keep <html> in the same mode so overscroll and the browser chrome match.
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", reflect ? "#1F1D1A" : "#F6F3EE");
  }, [mode, reflect]);

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
          <ModeSwitch reflect={reflect} size="sm" />
          {!reflect && <TabsDesktop pathname={pathname} />}
          <div className="ml-auto flex items-center gap-3">
            {reflect ? (
              <Link
                href="/refletir/escrever"
                className="rounded-full bg-ink px-4 py-[9px] text-[13px] font-semibold text-on-ink"
              >
                Escrever
              </Link>
            ) : onGoals ? (
              <button
                onClick={() => ctx.openGoalEditor()}
                className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:bg-sunken"
              >
                + Nova meta
              </button>
            ) : (
              <button
                onClick={() => ctx.openTaskEditor()}
                className="rounded-full bg-ink px-4 py-[9px] text-[13px] font-semibold text-on-ink"
              >
                + Nova tarefa
              </button>
            )}
            <AccountMenu name={userName} />
          </div>
        </header>

        {/* Mobile header */}
        {!bareOnMobile && (
          <header className="lg:hidden">
            <div className="flex items-center justify-between px-5 pt-4">
              <ModeSwitch reflect={reflect} size="md" />
              <AccountMenu name={userName} />
            </div>
            {!reflect && (
              <nav className="mt-4 flex gap-6 border-b border-line px-5 text-[13px]" aria-label="Seções">
                {DO_TABS.map((t) => {
                  const active = pathname.startsWith(t.href);
                  return (
                    <Link
                      key={t.href}
                      href={t.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "-mb-px pb-2.5",
                        active ? "border-b-2 border-ink font-medium" : "text-muted",
                      )}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </header>
        )}

        {children}

        {/* Mobile floating action */}
        {!reflect && !onGoals && (
          <button
            onClick={() => ctx.openTaskEditor()}
            aria-label="Nova tarefa"
            className="fixed right-5 bottom-10 flex size-14 items-center justify-center rounded-full bg-ink text-2xl font-light text-on-ink shadow-fab lg:hidden"
          >
            +
          </button>
        )}

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

function ModeSwitch({ reflect, size }: { reflect: boolean; size: "sm" | "md" }) {
  const item = size === "md" ? "px-5 py-2 text-sm" : "px-[18px] py-1.5 text-[13px]";
  return (
    <nav className={cn("flex rounded-full bg-sunken", size === "md" ? "p-1" : "p-[3px]")} aria-label="Modo">
      {[
        { href: "/hoje", label: "Fazer", active: !reflect },
        { href: "/refletir", label: "Refletir", active: reflect },
      ].map((m) => (
        <Link
          key={m.label}
          href={m.href}
          aria-current={m.active ? "page" : undefined}
          className={cn(
            "rounded-full",
            item,
            m.active ? "bg-raised font-semibold shadow-thumb" : "text-muted",
          )}
        >
          {m.label}
        </Link>
      ))}
    </nav>
  );
}

function TabsDesktop({ pathname }: { pathname: string }) {
  return (
    <nav className="flex gap-1 text-sm" aria-label="Seções">
      {DO_TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn("rounded-lg px-3 py-[7px]", active ? "bg-sunken font-semibold" : "text-muted hover:text-ink")}
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
    <details ref={ref} className="relative">
      <summary
        aria-label="Conta"
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full bg-sunken text-[13px] font-semibold lg:size-[34px] [&::-webkit-details-marker]:hidden"
      >
        {name.trim().charAt(0).toUpperCase()}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-line bg-surface p-2 shadow-menu">
        <div className="px-3 py-2 text-[13px] font-semibold">{name}</div>
        <form action={signOut}>
          <button className="w-full rounded-xl px-3 py-2 text-left text-[13px] text-muted hover:bg-sunken hover:text-ink">
            Sair
          </button>
        </form>
      </div>
    </details>
  );
}
