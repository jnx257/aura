"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLongPress } from "@/lib/use-long-press";
import { useShell } from "./shell";
import { cn } from "./ui";

/**
 * A link to a goal. Tapping opens the goal; holding starts a new task already linked to it (the same thing "+ Tarefa"
 * does on the goal's own page, so the hold is a shortcut and never the only way).
 */
export function GoalLink({ goalId, className, ...props }: ComponentProps<typeof Link> & { goalId: string }) {
  const { openTaskEditor } = useShell();
  const hold = useLongPress(() => openTaskEditor(undefined, { goalId }));
  return (
    <Link
      {...props}
      {...hold.props}
      draggable={false}
      data-holding={hold.holding}
      className={cn("holdable", className)}
    />
  );
}
