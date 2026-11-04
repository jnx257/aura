# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

An individual using Aura privately for their own long-term goals, daily routine, and reflection. Each person only ever sees their own data. Mobile and desktop are both first-class. Brazilian Portuguese speakers; weeks start on Monday and "today" is the person's own calendar day in their own timezone.

Current audience: the author, using it daily. Intended next: public sign-ups (rate limiting, password reset, account settings and LGPD privacy pages are still to do).

## Product Purpose

Aura helps a person stay aligned with the goals they care about and understand _why_ they drift from them. Most to-do apps track completion; Aura tracks deviation. When a task tied to a goal isn't done, that is a signal worth understanding, not a failure. The core loop is **Goal → Task → Miss → Reflection → Adjustment**. Success is the person staying inside their intended "life flow" rather than accumulating unchecked boxes.

## Positioning

Aura tracks deviation, not completion. A missed goal-linked task opens a lightweight, non-punitive moment ("what got in the way?") that leads to a suggested adjustment and an optional journal reflection linked to the task and goal. Drift is a trend and early-warning state per goal, not a percentage. A plain to-do app cannot truthfully claim this.

## Operating Context

- Day-to-day use: plan today and the week (tasks), review goals (progress and drift), and reflect (journal). Planning/doing and reflecting are different mindsets.
- Time-based rules run on each signed-in page load (no cron): missed detection, expiry of ignored prompts, auto-adjust after the 3rd declined cycle.
- Missed times: morning 12:00, afternoon 18:00, evening 22:00, no period = end of day; unfinished goal tasks carry over daily.

## Capabilities and Constraints

- Language: pt-BR only; all copy, dates and labels in Brazilian Portuguese. No i18n planned.
- Concepts: Goal (title, category, quarterly/monthly/yearly horizon), Task (date, optional time of day, optional deadline), Milestone task (goal-linked; only these trigger the failure loop), Orphan task, Missed task, Missed reason, Adjustment, Journal entry (optional mood: Good, Neutral, Low, Frustrated, Tired), Drift.
- Goal progress is completed / total linked tasks, unweighted (known simplification). Soft warning (not a block) at the 6th active task per goal per week.
- Failure loop: reason (preset or free text) → suggested reschedule (default tomorrow; "too tired" tomorrow morning; "unexpected event" the coming Saturday) → accept or decline; ignoring = declining; auto-apply the last suggestion after the 3rd declined cycle; optional jump into the journal with context pre-filled. Adjustment is only offered in this live flow, never for retroactive links.
- Drift: on track = fewer than 2 missed milestone tasks in trailing 7 days, or misses already have a resolved loop; drifting = 2+ misses and at least one unresolved. Counts distinct tasks, not missed days.
- Home ("Hoje") is the dashboard: today's snapshot, goals overview, merged recent-activity timeline.
- Planned, not built: link journal entries to existing tasks/goals after the fact; all reflections for one goal; drift summary of common reasons; "week at a glance" with completion rate and mood as two separate trends; dashboard quick actions; notifications.
- Open decision: whether a manual reschedule while a prompt is pending counts as "accepted".
- Stack (existing): Next.js 16, React 19, Tailwind 4, Drizzle + Postgres, own session auth. Details in `architecture.md`.

## Brand Commitments

Name: Aura. Never forces a response; never judges or induces guilt. Voice follows the principles below. No logo or brand identity assets exist beyond what the MVP built from the "Wellness Hub PT" design file.

## Evidence on Hand

- `idea.md` (product definition), `architecture.md` (engineering), local-only `HANDOFF.md` notes (invented rules, gaps, to-do; not in the repo).
- Sample user via `npm run db:seed` (ana@mail.com) for realistic screens.
- Absent, do not fabricate: real users, testimonials, usage data, pricing, press.

## Product Principles

1. **Non-punitive.** A miss or drifting goal is information, not an error; nothing should make the person feel judged or guilty.
2. **Never forces a response.** The app asks and suggests; ignoring a prompt is always a valid answer.
3. **A mirror, not a diagnosis.** Show patterns the person can read themselves; no prescriptive insights, no claimed causes, no auto-generated insight text or correlation figures.
4. **Goal-linked work carries more weight** than loose tasks, and the experience reflects that hierarchy.
5. **Reflection is calm.** Journaling should never feel like another chore. Close the loop: Goal → Task → Miss → Reflection → Adjustment.

## Accessibility & Inclusion

No product-specific standard has been set yet. Basics exist; keyboard-only and screen-reader use are not audited, and real iOS/Android devices are untested (see the local `HANDOFF.md` notes, §3).
