# Aura

Stay aligned with the goals you care about — and understand why you drift from them.
Product definition: [`idea.md`](idea.md) · Engineering: [`architecture.md`](architecture.md).

## Run locally

Requirements: Node 20+, Docker.

```bash
npm install
cp .env.example .env          # DATABASE_URL points at the docker Postgres
docker compose up -d          # Postgres 17 on :5432
npm run db:migrate
npm run db:seed               # optional: sample user ana@mail.com / aura1234
npm run dev                   # http://localhost:3000
```

To test time-based rules (missed tasks, end of day, auto-adjust), set `AURA_NOW` in `.env`
(e.g. `AURA_NOW=2026-10-26T15:00:00-03:00`) and restart the dev server. Ignored in production.

## Checks

```bash
npm run lint && npm run typecheck
npm test                      # business rules (Vitest)
npm run test:e2e              # Playwright at 390px and 1280px; re-seeds the sample user
```

## Deploy (Vercel + Neon)

1. Create a Neon project and copy its pooled connection string.
2. Run migrations against it: `DATABASE_URL=<neon url> npm run db:migrate`.
3. Import the repo in Vercel and set `DATABASE_URL` in Project → Settings → Environment Variables.
4. Set `ALLOW_SIGNUP=true`, deploy, create your account, then remove the variable and redeploy: in production
   sign-up is closed unless it is `true`.
5. Don't run the seed in production (it refuses to run against a non-local database).

Before opening it to other people: add rate limiting on sign-in/sign-up and a password-reset flow
(see `architecture.md` §13 and §15).

## Schema changes

Edit `src/server/db/schema.ts`, then `npm run db:generate` and commit the new file in `drizzle/`.
