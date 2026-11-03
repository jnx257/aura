"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { signIn } from "@/server/actions/auth";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="flex flex-1 flex-col gap-9 pt-12 lg:flex-none lg:pt-0">
      <div>
        <h1 className="text-[30px] leading-[1.1] font-medium tracking-[-0.03em] lg:text-[34px] lg:font-semibold">
          Aura
        </h1>
        <p className="mt-3 text-[13px] text-muted lg:mt-2.5 lg:text-[15px]">Fique perto do que importa.</p>
      </div>
      <div className="flex flex-col gap-3">
        <Field label="E-mail">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state?.values?.email}
            key={state?.values?.email}
            className={inputClass}
          />
        </Field>
        <Field label="Senha">
          <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </Field>
        {state?.error && (
          <p role="alert" className="text-[13px] text-miss">
            {state.error}
          </p>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-[18px] lg:mt-0">
        <Button type="submit" size="lg" disabled={pending} className="py-4 text-[15px]">
          Entrar
        </Button>
        <p className="text-center text-[13px] text-muted lg:text-sm">
          Primeira vez?{" "}
          <Link href="/cadastro" className="font-semibold text-ink">
            Criar uma conta
          </Link>
        </p>
      </div>
    </form>
  );
}
