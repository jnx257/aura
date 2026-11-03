import { AppShell } from "@/components/shell";
import { getAppContext } from "@/server/context";
import { loadUserData } from "@/server/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, local } = await getAppContext();
  const data = await loadUserData(user.id);
  return (
    <AppShell userName={user.name} today={local.date} goals={data.goalOptions()}>
      {children}
    </AppShell>
  );
}
