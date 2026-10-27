# Aura — Architecture

> Engineering definition. This document describes **how the product is built**: stack, structure, data, and technical rules. For what the product is and how it behaves, see [`idea.md`](idea.md).

<!-- Fill every section. Write "TBD" if undecided, "N/A" if not applicable. Delete the hint comments when done. -->

## 1. Overview

Aura is a full-stack web application built with Next.js, used on both desktop and mobile. It helps people stay aligned with their mid- and long-term goals and see how their daily activities affect them.

Users enter their data through two modules: a ToDo list (goals and tasks) and a Journal for reflecting on their activities. In return, the server derives goal progress, missed-task feedback cycles with suggested adjustments, and a drift state for each goal. The Home dashboard combines all of this into a single view, showing whether the user is still moving toward their goals or has drifted.

- **Type:** Full-stack web app
- **Platforms:** Web, with mobile and desktop both first-class (responsive)
- **Main constraints:** TBD <!-- e.g. solo dev, free-tier hosting, MVP in X weeks -->

## 2. Tech stack

| Layer                 | Choice | Why |
| --------------------- | ------ | --- |
| Framework             |        |     |
| Language              |        |     |
| Styling               |        |     |
| UI components         |        |     |
| State / data fetching |        |     |
| Forms / validation    |        |     |
| Database              |        |     |
| ORM / query layer     |        |     |
| Authentication        |        |     |
| Hosting / deploy      |        |     |
| Testing               |        |     |
| Lint / format         |        |     |

## 3. Project structure

<!-- Folder tree + one line explaining what lives in each folder. -->

```
/
├──
└──
```

## 4. Conventions

- **Naming:** <!-- files, components, functions, DB columns -->
- **Components:** <!-- server vs client, where logic lives -->
- **Imports / aliases:**
- **Commits / branches:**
- **Error handling:**
- **Code that must NOT be written:** <!-- e.g. no `any`, no inline styles, no business logic inside components -->

## 5. Design implementation

- **Design source:** <!-- link/path to the design file -->
- **Design tokens:** <!-- where colors, typography, spacing live (e.g. tailwind config / CSS variables) -->
- **Component strategy:** <!-- base components first, then screens -->
- **Responsive approach:** <!-- breakpoints, mobile-first? -->
- **Theming (light/dark):**

## 6. Data model

<!-- One block per entity. Fields, types, required/optional, relations. -->

### User

<!-- name, email, password hash, optional birth date, timezone -->

### Goal

<!-- title, optional category, horizon (quarterly | monthly | yearly), owner -->

### Task

<!-- title, optional description, scheduled date, optional time of day (morning | afternoon | evening), optional deadline, completed state, optional goal link, owner -->

### Missed-task record / Feedback cycle

<!-- missed reason (preset or free text), suggested adjustment, outcome (accepted | declined | ignored | auto-applied), cycle count per task -->

### Journal entry

<!-- title, body, optional mood (Good | Neutral | Low | Frustrated | Tired), optional task link, optional goal link, owner -->

### Relationships

<!-- e.g. User 1—N Goal, Goal 1—N Task, Task 1—N Feedback cycle, Task/Goal 1—N Journal entry -->

### Indexes and constraints

<!-- e.g. per-user isolation, indexes for "tasks today / this week", deletion behavior (what happens to tasks when a goal is deleted) -->

## 7. Business rules (technical implementation)

<!-- For each rule from idea.md: where it is computed (DB, server, client) and how. -->

| Rule                                                                                                                  | Where it lives | Notes                                   |
| --------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------- |
| Goal progress = completed / total linked tasks                                                                        |                |                                         |
| Soft warning at 6th active task per goal per week                                                                     |                | Warning only, never blocks              |
| Task is "missed" (time of day / day / deadline passed)                                                                |                | How and when is this detected?          |
| Suggested adjustment by reason (default → tomorrow; Too tired → tomorrow morning; Unexpected event → coming Saturday) |                |                                         |
| Ignoring until end of day = declining                                                                                 |                | Needs scheduled job or lazy evaluation? |
| Auto-adjust after 3rd declined cycle (apply last suggestion)                                                          |                |                                         |
| Drift: 2+ missed milestone tasks in trailing 7 days with at least one unresolved loop                                 |                | Computed on read or stored?             |
| Adjustment suggestion only in the live flow                                                                           |                |                                         |
| Weeks start on Monday, user's own calendar day                                                                        |                | Timezone handling                       |

## 8. API / data access

<!-- Route handlers, server actions, or REST/tRPC endpoints. -->

| Operation | Method / action | Auth | Notes |
| --------- | --------------- | ---- | ----- |
|           |                 |      |       |

## 9. Authentication and authorization

- **Sign up fields:** name, email, password, optional birth date
- **Method:** <!-- sessions, JWT, provider -->
- **Password handling:**
- **Per-user data isolation:** <!-- how every query is scoped to the owner -->
- **Protected routes:**

## 10. Background jobs / scheduling

<!-- End-of-day resolution of ignored prompts, missed-task detection, etc. Cron, queue, or lazy computation? -->

## 11. Environments and configuration

- **Environments:** <!-- local, preview, production -->
- **Environment variables:** <!-- list names only, never values -->
- **Secrets handling:**

## 12. Testing strategy

- **What must be tested:** <!-- business rules in section 7 first -->
- **Tools:**
- **CI:**

## 13. Performance, accessibility, security

- **Performance targets:**
- **Accessibility:** <!-- e.g. WCAG AA -->
- **Security checklist:** <!-- input validation, rate limiting, CSRF, etc. -->

## 14. MVP scope

- **In MVP:** the single main flow: sign up → create goal → create task (optionally linked to a goal) → mark complete / miss → failure feedback loop → optional journal reflection → see goal progress and drift on the dashboard.
  - **Accounts:** sign up (name, email, password, optional birth date), sign in, per-user data isolation.
  - **ToDo:** create goals (title, category, horizon) and tasks (date, time of day, deadline); mark complete/incomplete; reschedule; unlink from goal; today / this week / by-goal views.
  - **Goals:** progress (`completed / total linked tasks`), consistency info (misses this week, weeks on track), soft warning at the 6th active task per goal per week.
  - **Failure feedback loop:** missed-task detection, reason (preset or free text), suggested reschedule (default → tomorrow; Too tired → tomorrow morning; Unexpected event → coming Saturday), accept/decline, ignoring = declining, auto-apply after the 3rd declined cycle.
  - **Drift:** on track / drifting state per goal.
  - **Journal:** write entries (title, body, optional mood), browse newest first, filter (all / linked to goals / free), link to a task and/or goal, inbound link from a failed task with pre-filled context.
  - **Home / Dashboard:** today's snapshot, goals overview (progress + drift), recent activity timeline.
  - **Platform:** responsive web, mobile and desktop; weeks start on Monday in the user's own calendar day.
- **Planned, not in MVP:**
  - Manual, retroactive linking of journal entries to existing tasks or goals.
  - Viewing all reflections tied to one goal together.
  - Goal indicator showing whether it has accumulated reflection.
  - Drift summary for a drifting goal (most common failure reasons of the month, with a path to related entries and upcoming tasks).
  - Dashboard "Week at a glance": completion rate and journal mood as two separate trends, 7 or 30 days.
  - Dashboard quick actions: add task, write entry, review a drifting goal.
- **Explicitly out of scope:**
  - Weighted goal progress (needs an importance field that doesn't exist yet).
  - Adjustments other than rescheduling (reduce scope, break the task down).
  - Auto-generated insights, causal claims or correlation figures between mood and completion.
  - Sharing, collaboration or any cross-user data visibility.
  - Suggesting adjustments for retroactively linked (past) tasks.

## 15. Open decisions

<!-- Technical questions still unresolved. -->

- [ ]

## 16. Decision log

| Date | Decision | Reason |
| ---- | -------- | ------ |
|      |          |        |
