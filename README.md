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

## On your phone (Android): install the app

Aura is a PWA: it installs from the browser, opens full screen from the home screen, and can send reminders. There
is nothing to publish in a store and updates arrive as soon as you deploy.

1. Open the deployed address in **Chrome on Android**, sign in, open the menu (your initial, top right) and tap
   **Instalar o app**. (Or Chrome's ⋮ menu → *Instalar app* / *Adicionar à tela inicial*.)
2. Open Aura from the new icon. It starts on **Hoje**.

### Routine reminders (optional)

A reminder is a push notification at the time you choose, sent only while habits for today are still unmarked.

1. **Generate the keys once**: `npx web-push generate-vapid-keys`. Set these in Vercel (Settings → Environment
   Variables), then **redeploy** (the public key is baked into the build):
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: the public key
   - `VAPID_PRIVATE_KEY`: the private key (secret; never commit it)
   - `VAPID_SUBJECT`: a contact URL such as the repo address (`https://github.com/<you>/aura`)
   - `CRON_SECRET`: any long random string (`openssl rand -hex 24`)
2. **Run the migration** on Neon before the deploy: `DATABASE_URL=<neon url> npm run db:migrate`.
3. **Call the sender every 5 minutes.** It is the route `GET /api/cron/reminders` with the header
   `Authorization: Bearer <CRON_SECRET>`. It is safe to call as often as you like: one reminder per person per day,
   and only within 3 hours after the chosen time. Vercel's Hobby plan only runs cron jobs once a day, so use a free
   external scheduler instead, for example [cron-job.org](https://cron-job.org): URL
   `https://<your-app>/api/cron/reminders`, every 5 minutes, with that header. (On a Vercel Pro plan, a `crons`
   entry in `vercel.json` with `*/5 * * * *` also works, since Vercel sends the secret itself.)
4. In the app: Hoje → **Rotina → Lembrete**, pick the time, **Ativar lembrete**, allow notifications, then
   **Enviar um teste**.

## Schema changes

Edit `src/server/db/schema.ts`, then `npm run db:generate` and commit the new file in `drizzle/`.
