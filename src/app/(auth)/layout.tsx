import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/hoje");
  return (
    <main className="flex min-h-dvh justify-center px-7 pt-[72px] pb-11 lg:items-center lg:pt-0 lg:pb-0">
      <div className="flex w-full max-w-[400px] flex-col">{children}</div>
    </main>
  );
}
