# Aura

> Product definition. This document describes **what the product is and how it behaves** — never how it looks. Interface, layout, navigation, visual style, and interaction patterns are intentionally left open for the designer (or design tool) to decide.

## Vision

Aura helps a person stay aligned with the long-term goals they care about, and understand _why_ they drift from them.

Most to-do apps only track completion: a box is checked or it isn't. Aura tracks **deviation**. When something tied to a goal doesn't get done, the app treats it as a signal worth understanding — not as a failure — and helps the person adjust and reflect, so they stay inside their intended "life flow" instead of accumulating unchecked boxes.

## Who it's for

An individual using the app privately for their own goals, daily routine, and reflection. Each person only ever sees their own data.

## Product principles

- **Non-punitive.** A missed task or a drifting goal is information, not an error. Nothing in the product should make the person feel judged or guilty.
- **Never forces a response.** The app asks and suggests; ignoring a prompt is always a valid answer.
- **A mirror, not a diagnosis.** The app shows patterns the person can read into themselves. It does not generate prescriptive insights or claim causes (e.g. never "you complete more tasks when you're happy").
- **Goal-linked work matters more.** Tasks that contribute to a goal carry more meaning to the product than loose tasks, and the experience should reflect that hierarchy.
- **Two modes of mind.** Planning and doing (tasks) is a different mindset from reflecting (journal). Reflection should feel calm and never like another chore.
- **Close the loop.** The product's core value is the loop **Goal → Task → Miss → Reflection → Adjustment**.

## Core concepts

| Concept | What it is |
| --- | --- |
| **Goal** | A longer-term objective with a title, an optional category, and a horizon: quarterly, monthly, or yearly. |
| **Task** | A short-term actionable item with a title, optional description, a scheduled date, an optional time of day (morning / afternoon / evening), and an optional deadline. |
| **Milestone task** | A task linked to a goal. Only milestone tasks trigger the failure feedback loop. |
| **Orphan task** | A task with no goal. It is tracked, but has no failure flow and carries less weight. |
| **Missed task** | A milestone task that was not completed by its scheduled time of day, its scheduled day, or its deadline. |
| **Missed reason** | Why a task was missed, given by the person. |
| **Adjustment** | A suggested change to a missed task that realigns it with the goal without abandoning it. |
| **Journal entry** | A reflection with a title, free-text body, an optional mood, and an optional link to a task and/or goal. |
| **Mood** | An optional emotional tag on a journal entry: Good, Neutral, Low, Frustrated, Tired. |
| **Drift** | A goal's state when the person is repeatedly missing its tasks without having resolved the pattern. |

## ToDo

### What the person can do

- Create tasks, optionally linking them to a goal, with a date, time of day, and deadline.
- Create goals with a title, category, and horizon.
- Mark tasks complete or incomplete.
- Reschedule a task (e.g. move to tomorrow).
- Unlink a task from its goal.
- See tasks across different time horizons: what's today, what's this week, and how everything ladders up to goals.

### Tasks and goals

- A task can optionally belong to one goal. A goal is made of the tasks linked to it.
- **Goal progress (MVP):** `completed / total linked tasks`, unweighted. This is a known simplification — a goal can read 75% while its single most important task is the one left. Weighting by importance would need an importance field that doesn't exist yet; revisit if it proves misleading.
- **Goal-bloat prevention:** at most **5 active (incomplete) tasks per goal per week**. This is a **soft warning, not a hard block**: when the person links a 6th active task to the same goal in the same week, the product warns ("This goal already has 5 active tasks this week — link anyway?") and lets them proceed. A hard block would create friction for legitimate cases (e.g. an urgent task that truly belongs to the goal); the aim is to discourage reflexive linking, not forbid it.
- A goal should convey, beyond progress, how consistent the person has been (e.g. misses this week, weeks on track).

## Failure Feedback Loop (core differentiator)

When a milestone task is missed, the product opens a lightweight, non-punitive moment: **"Couldn't complete '[Task]' — what got in the way?"**

1. **Reason.** The person picks a common reason — _No time_, _Too tired_, _Lost motivation_, _Unexpected event_ — or writes their own.
2. **Suggested adjustment.** Based on the reason, the app proposes a way back to the goal, such as rescheduling, reducing scope, or breaking the task down. Current behavior is always a reschedule:
   - Default → tomorrow.
   - _Too tired_ → tomorrow morning.
   - _Unexpected event_ → the coming Saturday.
3. **Accept or decline.** The person can accept the adjustment or decline it.
   - **Ignoring = declining.** Not responding by the end of the day counts the same as an explicit decline. The app never forces an answer.
   - **Auto-adjust after 3 cycles.** After the 3rd missed-and-declined cycle on the same task, the app applies the adjustment it last suggested. It commits to its own last offer rather than escalating to something new or more aggressive.
   - A decline/ignore loop that never ends in an accepted or auto-applied adjustment is itself a drift signal.
4. **Optional reflection.** The person can jump into the Journal with the task, its goal, and the reason pre-filled as context.

The adjustment suggestion only appears in this **live** flow (the task is still today or upcoming). It is never offered when an entry is linked to a past task after the fact.

## Journaling

The reflective counterpart to ToDo: the place where the person makes sense of _why_ things happened, not just _what_ happened. Its differentiator is linking reflections to specific tasks and goals, which turns journaling into a diagnostic tool rather than a disconnected diary.

### What the person can do

- Write a new entry: title (or derived from the text), free-text body, optional mood.
- Browse past entries, newest first, and filter them: all, linked to goals, or free (unlinked) entries.
- Link an entry to a task and/or goal.
- See all reflections tied to one goal together, to spot recurring patterns in why they drift from it _(planned)_.

### Linking

An entry can be linked to ToDo items in two ways:

1. **Inbound from a failed task.** Coming from the failure flow, the task, its goal, and the missed reason arrive pre-filled. This is the only path that can show the adjustment suggestion, because the task is still actionable.
2. **Manual, retroactive linking** _(planned)_. While writing, the person searches for and attaches any existing task or goal (e.g. writing a reflection first, then realizing it relates to "Learning Piano"). This path **never** suggests an adjustment — the task is already past. It still counts fully toward a goal's accumulated reflection and toward grouped-by-goal review.

A goal should reveal, at a glance, whether it has accumulated reflection over time or not _(planned)_.

## Drift (core differentiator)

Drift tells the person not just _how much_ of a goal is done, but its **trend** — an early warning before they fall far out of their intended flow.

- **On track:** fewer than 2 missed milestone tasks in the trailing 7 days, **or** any misses already have a resolved feedback loop.
- **Drifting:** 2 or more missed milestone tasks in the trailing 7 days **and** at least one of those misses has no resolved feedback loop (no adjustment accepted or auto-applied).
- A single miss the person already closed the loop on stays **on track** — the rule rewards resolving drift, not just avoiding misses.
- For a drifting goal, the person should be able to see a short summary: the most common failure reasons logged that month, with a path to review related journal entries or adjust upcoming tasks _(planned)_.

## Home / Dashboard

The entry point of the product. It exists to answer one question at a glance: **"Am I still moving toward my goals, or have I drifted?"** It synthesizes ToDo and Journaling data so the two aren't siloed.

### Information it should convey

- **Today's snapshot:** a personal greeting, how many tasks are on today, and how many of those are goal-linked.
- **Goals overview:** every goal with its progress and drift state, using the same goal summary as the ToDo module.
- **Recent activity:** one merged, chronological timeline of recent completions, misses, and journal entries, so task and journal activity appear side by side.
- **Week at a glance** _(planned)_: task completion rate and journal mood over the past 7 or 30 days, shown as **two separate trends**, never as one combined "correlation," and with **no auto-generated insight text** and no correlation figures (see principles: a mirror, not a diagnosis).
- **Quick ways to act** _(planned)_: add a task, write a journal entry, review a drifting goal.

## Accounts and privacy

- People sign up (name, email, password, optional birth date) and sign in.
- All tasks, goals, and journal entries belong to one person and are visible only to them.

## Platform

- Web application used on both **mobile and desktop**; both are first-class.
- Supports the person's own calendar day and week (weeks start on Monday).

## Out of scope for this document

How any of this looks or is navigated: layout, screens, navigation pattern, components, color, typography, iconography, motion, light/dark theme. These are deliberately undefined so they can be designed fresh. Engineering details live in [`architecture.md`](architecture.md).
