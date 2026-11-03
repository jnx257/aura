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
        <>
          <JournalList entries={data.journal(filter)} filter={filter} today={local.date} />
          <Link
            href="/refletir/escrever"
            className="fixed right-5 bottom-9 left-5 rounded-full bg-ink p-[15px] text-center text-sm font-medium text-on-ink lg:hidden"
          >
            Escrever
          </Link>
        </>
      }
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="max-w-xs text-sm leading-relaxed text-muted">
          Um lugar calmo para entender o porquê, não só o quê.
        </p>
        <Link href="/refletir/escrever" className="text-sm font-semibold underline underline-offset-[3px]">
          Começar a escrever
        </Link>
      </div>
    </ReflectSplit>
  );
}
