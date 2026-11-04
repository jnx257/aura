"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { isValidTimeZone } from "@/lib/dates";
import { signInSchema, signUpSchema } from "@/lib/schemas";
import { createSession, destroySession } from "../auth";
import { db } from "../db/client";
import { users } from "../db/schema";
import { signUpOpen } from "../signup";

export type AuthFormState =
  | { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> }
  | undefined;

/** Echo non-secret fields back so a failed submit doesn't clear the form. */
function echo(form: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));
}

// Computed once so unknown e-mails take as long as wrong passwords (no account enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("aura-timing-guard", 10);

export async function signUp(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  if (!signUpOpen()) return { error: "O cadastro está fechado." };
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors, values: echo(form, ["name", "email", "birthDate"]) };
  }
  const { name, email, password, birthDate, timezone } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing)
    return {
      fieldErrors: { email: "Já existe uma conta com este e-mail" },
      values: echo(form, ["name", "email", "birthDate"]),
    };

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      birthDate,
      timezone: timezone && isValidTimeZone(timezone) ? timezone : undefined,
    })
    .returning({ id: users.id });
  await createSession(user.id);
  redirect("/hoje");
}

export async function signIn(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: echo(form, ["email"]) };
  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "E-mail ou senha incorretos", values: echo(form, ["email"]) };

  await createSession(user.id);
  redirect("/hoje");
}

export async function signOut() {
  await destroySession();
  redirect("/entrar");
}
