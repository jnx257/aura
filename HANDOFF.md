# Aura — Handoff notes

What was built on `feat/mvp` (commit `0e7f457`), which product rules were invented because the
docs didn't cover them, what to watch out for in the code, and what's still to do.

Related docs: [`idea.md`](idea.md) (product), [`architecture.md`](architecture.md) (engineering), [`README.md`](README.md) (run / deploy).

---

## 1. Decisions I made that you didn't specify

The design and `idea.md` didn't cover these, so I picked a behavior. **Review them first.** They
are product decisions, and each is easy to change in one place.

| # | What I decided | Why | Where to change it |
|---|----------------|-----|--------------------|
| 1 | **When a task counts as missed:** a morning task at 12:00, afternoon at 18:00, evening at **22:00**, a task with no period at the end of the day. A deadline can make it earlier. | `idea.md` didn't give times. Evening ends before midnight so the prompt can still be answered the same day. | `src/domain/missed.ts` → `PERIOD_END_MINUTES` |
| 2 | **Undone tasks carry over.** An unfinished goal task is "missed" again each following day, at most one prompt per day and one pending at a time. | Without this, "auto-adjust after the 3rd declined cycle" could never happen unless the person rescheduled the task themselves. | `src/domain/missed.ts` → `nextMissDay`, `planReconcile` |
| 3 | **Ignoring a prompt counts as declining once a new day starts** (in the user's timezone), not after a fixed number of hours. | "Ignoring = declining" needed a cut-off. | `src/server/reconcile.ts` + `planReconcile` |
| 4 | **If the suggestion to auto-apply is already in the past, it is recomputed** relative to today. | Otherwise the task would be moved into the past. | `src/domain/suggest.ts` → `freshenSuggestion` |
| 5 | **"Imprevisto" on a Saturday suggests *next* Saturday.** | "Coming Saturday" is ambiguous on a Saturday. | `src/domain/suggest.ts` |
| 6 | **Drift counts distinct tasks, not missed days.** A task undone for 3 days is 1 miss. | The design's numbers ("3 perdidas · 2 em aberto") only work this way. | `src/domain/goals.ts` → `goalHealth` |
| 7 | **Closing the loop yourself counts:** completing, rescheduling or unlinking a task marks its pending prompt `resolved`. | Otherwise a goal would stay "drifting" after you fixed it. ⚠️ Open question: should a manual "Mover para amanhã" count as *accepted* instead? (`architecture.md` §15) | `src/server/actions/tasks.ts` |
| 8 | **Only goal-linked tasks get the "O que atrapalhou?" prompt.** Orphan tasks just stay undone. | `idea.md` talks about "milestone tasks". | `planReconcile` |
| 9 | **Soft limit triggers at the 6th active task** (≥ 5 existing) per goal per week (Mon–Sun). | Matches "5 active tasks". | `src/domain/goals.ts` → `exceedsSoftLimit` |
| 10 | **"Hoje" is the dashboard.** There is no separate Home page. | The design merges them. | — |
| 11 | **The journal title is derived from the text** if left empty. Drafts autosave. | Writing should never be blocked. | `src/server/actions/journal.ts` |
| 12 | **Deleting a goal keeps its tasks** (they become orphans). Deleting a task unlinks its journal entries (entries are kept). | Never lose user writing. | DB foreign keys in `schema.ts` |
| 13 | **Timezone is captured once at sign-up** from the browser. | No settings page exists to change it. | `cadastro/sign-up-form.tsx` |
| 14 | **Sessions last 30 days.** | Common default. | `src/server/auth.ts` → `SESSION_DAYS` |
| 15 | **Own login system instead of Auth.js; Next 16 instead of 15.** | Auth.js credentials can't use DB sessions; Next 15 / older Drizzle had security advisories. | `architecture.md` §16 |

---

## 2. Things to understand as you work in this codebase

### This is Next.js 16, not the Next.js in most tutorials
- `middleware.ts` is now **`src/proxy.ts`**.
- `params` and `searchParams` are **Promises**: write `const { id } = await params`.
- `cookies()` / `headers()` are async.
- Before writing new Next code, read the docs in `node_modules/next/dist/docs/` (that's what `AGENTS.md` says). Blog posts and older AI answers are often wrong for v16.
- `next dev` re-adds a block to `AGENTS.md`. That's expected; leave it committed.

### Server vs client components
- Components are **Server Components by default**. Only files with `"use client"` run in the browser.
- A server component **must not call a function exported from a `"use client"` file**. That's why `cn()` lives in `src/lib/cn.ts` and not only in `ui.tsx`. You'll get "Attempted to call cn() from the server" if you get this wrong.
- Anything under `src/server/` imports `"server-only"`, so the build fails if client code imports it. That's a safety net for DB code and secrets; keep it.

### Where the logic lives (keep it this way)
```
src/domain/   pure functions, no DB, no dates from the clock → easy to unit test
src/server/   DB reads (queries.ts), writes (actions/*), auth, reconcile
src/app/      pages: fetch data, render components
src/components/ UI only — no business rules
```
If you add a rule (e.g. "streaks"), write it in `src/domain/` with a test first, then call it from the server.

### Security rules you must never break
- **Every query filters by `userId` from the session** (`getAppContext()` / `requireUser()`), never a user id sent by the browser.
- **Any id from the browser is re-checked for ownership** (e.g. a journal entry linking to a `taskId` checks the task belongs to the user). Copy this pattern in new actions.
- **Every server action validates input with Zod** (`src/lib/schemas.ts`). Server actions are public HTTP endpoints, even if no button calls them.
- `src/proxy.ts` only checks that a cookie *exists*. It's a convenience redirect, **not** security. The real check is `requireUser()`.
- Never commit `.env`. Production secrets go in Vercel settings.

### Dates and time are the trickiest part
- A "day" is a **`LocalDate` string `"YYYY-MM-DD"` in the user's timezone**, not a JS `Date`. Use the helpers in `src/lib/dates.ts` (`addDays`, `startOfWeek`, `localNow`, …). Don't do `new Date()` math for calendar days; it breaks around midnight and DST.
- Weeks start on **Monday**.
- **Never call `new Date()` / `Date.now()` for business logic.** Use `now()` from `src/server/clock.ts`, so `AURA_NOW` can freeze time in dev.
- To test time rules by hand: set `AURA_NOW=2026-11-02T15:00:00-03:00` in `.env` and restart `npm run dev`. Remove it afterwards, or you'll be confused why "today" never changes. It's ignored in production.

### "Reconcile" runs on every page load
- There's no cron. `reconcile()` runs at the start of each signed-in request and opens / expires / auto-applies feedback cycles.
- It **must stay idempotent**: running it twice must change nothing the second time. The unique index `(task_id, missed_on)` + `onConflictDoNothing` guarantees no duplicate prompts. If you change it, add a test.
- Side effect: a GET request can write to the DB. That's intentional here.

### Database workflow
- Change `src/server/db/schema.ts` → `npm run db:generate` → review the SQL in `drizzle/` → `npm run db:migrate` → commit the migration file.
- **Never edit a migration that has already been applied** (locally or in production). Generate a new one.
- Run migrations against production **before** deploying code that needs them.
- `npm run db:studio` opens a UI to look at the data.

### Seed data and tests
- `npm run db:seed` **deletes and recreates the user `ana@mail.com`**. Other users are untouched.
- `npm run test:e2e` **re-seeds first**, so anything you did as Ana is wiped. Use your own account for real personal data.
- The seed has **no production guard**. Never run it with a Neon `DATABASE_URL`.
- Seed dates are relative to "today", so the screens always look like the design.
- E2E tests run one at a time (`workers: 1`) because the last test changes the data the others read.

### Before every commit
```bash
npm run lint && npm run typecheck && npm test
npm run test:e2e   # when you touched UI or flows
```

---

## 3. What has and hasn't been verified

**Verified:**
- 30 unit tests on the business rules (missed detection, suggestions, carry-over, 3rd-cycle auto-apply, drift, timezone edges).
- Lint, typecheck and `next build` pass.
- Playwright at 390px and 1280px: sign-in redirect, every main screen, and the loop *miss → reflect → accept → new linked task*.
- Screenshots compared against the design.

**Not verified by hand yet** (please try these yourself):
- The full 3-day decline → auto-apply flow in the browser, using `AURA_NOW` to move across days (it's only covered by unit tests).
- Sign up as a brand-new user and use the app for a few real days.
- Real phones (only browser emulation at 390px was used). Check iOS Safari especially: bottom sheets, `<dialog>`, the keyboard over inputs.
- Keyboard-only / screen-reader navigation (the basics are there; not audited).
- Anything on Vercel / Neon. It has never been deployed.

---

## 4. Known gaps and limitations

- **No settings page:** you can't change name, email, password or timezone, or delete the account.
- **No password reset.** A forgotten password needs a manual DB fix.
- **No rate limiting** on sign-in / sign-up, so brute force is possible. Fine for personal use, not for public use.
- **Expired sessions are never deleted** from the `sessions` table (they're ignored, just never cleaned up).
- **`loadUserData` loads all of a user's data on every request.** Fine for one person's data for a long time; it will need date-range queries if history grows to thousands of rows.
- **"+ Vincular tarefa ou meta" in the journal is a disabled placeholder** (planned feature).
- **No error tracking / logging in production**; you won't know when something breaks.
- **No CI**; checks only run when you run them.
- **No database backups configured** beyond whatever Neon's plan includes.

---

## 5. To-do list

### Now: personal use
- [ ] Review the decisions in section 1 and change any you disagree with.
- [ ] Do the manual checks in section 3.
- [ ] Push the branch and open a PR to `main` (even working solo, it gives you a diff to review): `git push -u origin feat/mvp`.
- [ ] Deploy (see `README.md`): create a Neon project → `DATABASE_URL=<neon> npm run db:migrate` → import the repo in Vercel → set `DATABASE_URL` → deploy.
- [ ] Sign up with your real account on the deployed app and use it daily. Write down what feels wrong.

### Before letting other people in: production
- [ ] **Rate limiting** on `signIn` / `signUp` (e.g. Upstash Ratelimit or Vercel's firewall).
- [ ] **Password reset** + email verification (needs an email provider, e.g. Resend).
- [ ] **Account settings:** change name / password / timezone; **delete account** (cascade is already in the schema). Needed for LGPD.
- [ ] **Privacy policy / terms page.** The app stores personal journal entries, so you need a privacy policy under LGPD.
- [ ] **CI** (GitHub Actions): lint + typecheck + unit tests on every PR; e2e with a Postgres service.
- [ ] **Error monitoring** (e.g. Sentry) and basic logging.
- [ ] **Clean up expired sessions** (delete on sign-in, or a small cron).
- [ ] **Guard the seed script** so it refuses to run when `NODE_ENV=production` or the URL isn't localhost.
- [ ] Decide the open question: does a manual reschedule while a prompt is pending count as "accepted"?
- [ ] Test on real iOS and Android devices; run an accessibility check (Lighthouse / axe).
- [ ] Set up Neon backups / point-in-time restore, and practice a restore once.

### Later: planned product features (`architecture.md` §14)
- [ ] Link journal entries to existing tasks / goals after the fact.
- [ ] See all reflections for one goal together, plus an indicator on goals that have reflections.
- [ ] Drift summary (most common miss reasons this month).
- [ ] Dashboard "week at a glance" (completion rate and mood as separate trends).
- [ ] Dashboard quick actions.
- [ ] Notifications (a Vercel Cron can call `reconcile()` per user).
