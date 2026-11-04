/**
 * Development seed: the sample person from the design ("Ana"), with dates relative to today.
 * Sign in with ana@mail.com / aura1234. Re-running replaces Ana's data.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { addDays, localNow, type LocalDate } from "@/lib/dates";
import * as schema from "./schema";
import { feedbackCycles, goals, journalEntries, tasks, users } from "./schema";

const TZ = "America/Sao_Paulo";
if (process.env.NODE_ENV === "production" || !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) {
  throw new Error("Refusing to seed: DATABASE_URL is not a local database.");
}
const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema, casing: "snake_case" });

const T = localNow(TZ, new Date()).date;
const d = (offset: number): LocalDate => addDays(T, offset);
const at = (day: LocalDate, hour: number) => new Date(`${day}T${String(hour).padStart(2, "0")}:00:00-03:00`);

async function main() {
  await db.delete(users).where(eq(users.email, "ana@mail.com"));
  const [ana] = await db
    .insert(users)
    .values({
      name: "Ana",
      email: "ana@mail.com",
      passwordHash: await bcrypt.hash("aura1234", 12),
      timezone: TZ,
    })
    .returning();
  const userId = ana.id;

  const goal = async (title: string, category: string, horizon: "quarterly" | "monthly" | "yearly") =>
    (await db.insert(goals).values({ userId, title, category, horizon, createdOn: d(-42) }).returning())[0];
  const piano = await goal("Aprender piano", "Criatividade", "quarterly");
  const run = await goal("Correr 10 km", "Saúde", "quarterly");
  const books = await goal("Ler 12 livros", "Mente", "yearly");
  const portfolio = await goal("Lançar portfólio", "Trabalho", "monthly");

  type NewTask = typeof tasks.$inferInsert;
  const task = async (t: Omit<NewTask, "userId"> & { doneOn?: LocalDate }) => {
    const { doneOn, ...rest } = t;
    return (
      await db
        .insert(tasks)
        .values({ ...rest, userId, completedOn: doneOn, completedAt: doneOn ? at(doneOn, 9) : undefined })
        .returning()
    )[0];
  };

  // Aprender piano — 2 of 8 done, drifting.
  const metronome = await task({ goalId: piano.id, title: "Praticar com metrônomo", scheduledDate: d(-2), timeOfDay: "morning" });
  const scales = await task({ goalId: piano.id, title: "Escalas, 20 min", scheduledDate: d(-2), timeOfDay: "evening" });
  const bars = await task({ goalId: piano.id, title: "Aprender compassos 1–8", scheduledDate: d(-3), timeOfDay: "evening", doneOn: d(-3), rescheduleCount: 1 });
  await task({ goalId: piano.id, title: "Primeiras escalas em um tempo", scheduledDate: d(-6), timeOfDay: "evening", doneOn: d(-6) });
  await task({ goalId: piano.id, title: "Escalas, 20 min", scheduledDate: d(1), timeOfDay: "morning" });
  await task({ goalId: piano.id, title: "Compassos 9–16", scheduledDate: d(2), timeOfDay: "evening" });
  await task({ goalId: piano.id, title: "Ler à primeira vista uma peça curta", scheduledDate: d(3), timeOfDay: "evening" });
  await task({ goalId: piano.id, title: "Tocar compassos 1–16 devagar", scheduledDate: d(4) });

  // Correr 10 km — 2 of 4, one miss already resolved.
  await task({ goalId: run.id, title: "Corrida leve, 5 km", scheduledDate: T, timeOfDay: "morning", doneOn: T });
  const easyRun = await task({ goalId: run.id, title: "Rodagem 6 km", scheduledDate: d(-4), timeOfDay: "morning", doneOn: d(-4), rescheduleCount: 1 });
  await task({ goalId: run.id, title: "Tiros 6×400 m", scheduledDate: d(5), timeOfDay: "morning" });
  await task({ goalId: run.id, title: "Longão, 7 km", scheduledDate: d(6), timeOfDay: "morning" });

  // Ler 12 livros — 2 of 3.
  await task({ goalId: books.id, title: "Ler 30 páginas", scheduledDate: T, timeOfDay: "evening" });
  await task({ goalId: books.id, title: "Terminar o capítulo 3", scheduledDate: d(-2), timeOfDay: "evening", doneOn: d(-2) });
  await task({ goalId: books.id, title: "Ler 30 páginas", scheduledDate: d(-1), timeOfDay: "evening", doneOn: d(-1) });

  // Lançar portfólio — 2 of 4.
  await task({ goalId: portfolio.id, title: "Rascunhar intro do case", scheduledDate: T, timeOfDay: "afternoon", deadline: d(2) });
  await task({ goalId: portfolio.id, title: "Exportar imagens dos projetos", scheduledDate: d(1), timeOfDay: "afternoon" });
  await task({ goalId: portfolio.id, title: "Escolher 3 projetos", scheduledDate: d(-5), doneOn: d(-5) });
  await task({ goalId: portfolio.id, title: "Comprar o domínio", scheduledDate: d(-3), doneOn: d(-3) });

  // Loose tasks.
  await task({ title: "Ligar para o dentista", scheduledDate: T, timeOfDay: "afternoon" });
  await task({ title: "Mercado", scheduledDate: T, timeOfDay: "evening" });
  await task({ title: "Renovar passaporte", scheduledDate: d(3), deadline: d(6) });

  // Feedback cycles.
  type NewCycle = typeof feedbackCycles.$inferInsert;
  const cycle = async (c: Omit<NewCycle, "userId" | "openedOn"> & { openedOn?: LocalDate }) =>
    (
      await db
        .insert(feedbackCycles)
        .values({ ...c, userId, openedOn: c.openedOn ?? c.missedOn, createdAt: at(c.missedOn, 13) })
        .returning()
    )[0];

  // "Praticar com metrônomo": left twice, now the 3rd time — leaving it again auto-applies.
  await cycle({ taskId: metronome.id, missedOn: d(-2), cycleNumber: 1, reason: "too_tired", suggestedDate: d(-1), suggestedTimeOfDay: "morning", outcome: "declined", resolvedOn: d(-2) });
  await cycle({ taskId: metronome.id, missedOn: d(-1), cycleNumber: 2, suggestedDate: T, suggestedTimeOfDay: "morning", outcome: "ignored", resolvedOn: T });
  const metronomeNow = await cycle({ taskId: metronome.id, missedOn: T, openedOn: T, cycleNumber: 3, reason: "too_tired", suggestedDate: d(1), suggestedTimeOfDay: "morning", outcome: "pending" });
  const scalesMiss = await cycle({ taskId: scales.id, missedOn: d(-2), cycleNumber: 1, reason: "too_tired", suggestedDate: d(-1), suggestedTimeOfDay: "morning", outcome: "declined", resolvedOn: d(-2) });
  await cycle({ taskId: bars.id, missedOn: d(-4), cycleNumber: 1, reason: "no_time", suggestedDate: d(-3), suggestedTimeOfDay: "evening", outcome: "accepted", resolvedOn: d(-4) });
  await cycle({ taskId: easyRun.id, missedOn: d(-5), cycleNumber: 1, reason: "unexpected", suggestedDate: d(-4), suggestedTimeOfDay: "morning", outcome: "accepted", resolvedOn: d(-5) });

  // Journal.
  type NewEntry = typeof journalEntries.$inferInsert;
  const entry = (e: Omit<NewEntry, "userId" | "createdAt" | "updatedAt">) =>
    db.insert(journalEntries).values({ ...e, userId, createdAt: at(e.entryDate, 21), updatedAt: at(e.entryDate, 21) });

  await entry({
    title: "As manhãs também não estão funcionando",
    body: {
      kind: "guided",
      happened: "Acordei tarde e o trabalho começou logo em seguida.",
      hindered: "Sinceramente, o metrônomo. Ele faz a prática parecer uma prova.",
      helps: "",
    },
    mood: "frustrated",
    taskId: metronome.id,
    goalId: piano.id,
    cycleId: metronomeNow.id,
    status: "draft",
    entryDate: T,
  });
  await entry({
    title: "Choveu",
    body: { kind: "free", text: "Acordei com um temporal, então os tiros foram para sábado. Fiquei tranquilo com isso, sinceramente." },
    mood: "neutral",
    goalId: run.id,
    status: "saved",
    entryDate: d(-1),
  });
  await entry({
    title: "Cansado demais para as escalas de novo",
    body: {
      kind: "guided",
      happened: "O trabalho se estendeu e às nove eu não tinha mais nada.",
      hindered: "Continuo deixando o piano para o fim do dia…",
      helps: "Talvez tentar de manhã.",
    },
    mood: "tired",
    taskId: scales.id,
    goalId: piano.id,
    cycleId: scalesMiss.id,
    status: "saved",
    entryDate: d(-2),
  });
  await entry({
    title: "Uma boa caminhada longa",
    body: { kind: "free", text: "Saí sem fones, pela primeira vez. A cidade soava diferente." },
    mood: "good",
    status: "saved",
    entryDate: d(-3),
  });
  await entry({
    title: "O piano anda pesado",
    body: { kind: "free", text: "Não sei se é a peça ou o horário." },
    mood: "low",
    goalId: piano.id,
    status: "saved",
    entryDate: d(-4),
  });

  console.log(`Seeded Ana (ana@mail.com / aura1234), today = ${T}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
