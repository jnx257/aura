import type { Metadata } from "next";
import Link from "next/link";
import { getAppContext } from "@/server/context";
import { loadUserData } from "@/server/queries";
import { JournalList, ReflectSplit, parseFilter } from "./journal-list";

export const metadata: Metadata = { title: "Refletir" };

export default async function ReflectPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { user, local } = await getAppContext();
  const data = await loadUserData(user.id);
  const filter = parseFilter((await searchParams).filtro);

  return (
    <ReflectSplit
      listOnMobile
      list={
        <JournalList entries={data.journal(filter)} filter={filter} today={local.date} total={data.entries.length} />
      }
      floating={
        <Link
          href="/refletir/escrever"
          className="fixed right-5 bottom-9 left-5 rounded-full bg-ink p-[15px] text-center text-sm font-medium text-on-ink lg:hidden"
        >
          Escrever
        </Link>
      }
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-12 text-center">
        <h1 className="sr-only">Reflexões</h1>
        {data.entries.length === 0 ? (
          <>
            <h2 className="text-lg font-semibold tracking-[-0.01em]">Entenda o porquê, não só o quê.</h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Escreva sobre o seu dia ou sobre uma tarefa que não saiu como planejado. As reflexões que nascem de “O
              que atrapalhou?” já vêm ligadas à tarefa e à meta, e ficam juntas para você ver o que se repete.
            </p>
          </>
        ) : (
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Escolha uma reflexão ao lado para reler ou editar, ou escreva uma nova.
          </p>
        )}
        <Link href="/refletir/escrever" className="text-sm font-semibold underline underline-offset-[3px]">
          Escrever uma reflexão
        </Link>
      </div>
    </ReflectSplit>
  );
}
