import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { PwaRegister } from "@/components/pwa";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Aura", template: "%s · Aura" },
  description: "Fique perto do que importa.",
  applicationName: "Aura",
  // Home-screen install: opens without browser bars. (Android reads manifest.ts; these are for Safari.)
  appleWebApp: { capable: true, title: "Aura", statusBarStyle: "default" },
  icons: { icon: "/favicon.ico", apple: "/pwa-icon/192" },
};

export const viewport: Viewport = {
  themeColor: "#F6F3EE",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-mode="do">
      <body className={`${figtree.variable} font-sans`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
