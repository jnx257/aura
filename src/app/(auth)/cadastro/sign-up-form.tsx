"use client";

import Link from "next/link";
import { useActionState, useSyncExternalStore } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { signUp } from "@/server/actions/auth";

const noop = () => () => {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);
  // The person's calendar day depends on their timezone; capture it from the browser.
  const timezone = useSyncExternalStore(
    noop,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "",
  );
  const err = state?.fieldErrors ?? {};
  const values = state?.values ?? {};

  return (
    // Re-key on each failed submit so defaultValues refill after React resets the form.
    <form key={JSON.stringify(values)} action={action} className="flex flex-1 flex-col gap-7 lg:flex-none">
      <Link href="/entrar" aria-label="Voltar" className="-mt-8 text-sm text-muted lg:hidden">
        ←
      </Link>
      <h1 className="text-[26px] leading-[1.2] font-medium tracking-[-0.03em] lg:text-[30px] lg:font-semibold">
        Crie sua conta
      </h1>
      <div className="flex flex-col gap-3">
        <Field label="Nome" error={err.name}>
          <input
            name="name"
            autoComplete="given-name"
            required
            defaultValue={values.name}
            className={inputClass}
          />
        </Field>
        <Field label="E-mail" error={err.email}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={values.email}
            className={inputClass}
          />
        </Field>
        <Field label="Senha" hint="Pelo menos 8 caracteres" error={err.password}>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Data de nascimento" optional error={err.birthDate}>
          <input name="birthDate" type="date" defaultValue={values.birthDate} className={inputClass} />
        </Field>
        <input type="hidden" name="timezone" value={timezone} />
      </div>
      <p className="text-xs leading-relaxed text-muted lg:text-[13px]">Tudo o que você escreve fica só com você.</p>
      <div className="mt-auto flex flex-col gap-[18px] lg:mt-0">
        <Button type="submit" size="lg" disabled={pending} className="py-4 text-[15px]">
          Continuar
        </Button>
        <p className="hidden text-center text-sm text-muted lg:block">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-ink">
            Entrar
          </Link>
        </p>
      </div>
    </form>
  );
}
