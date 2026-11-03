import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Aura", template: "%s · Aura" },
  description: "Fique perto do que importa.",
};

export const viewport: Viewport = {
  themeColor: "#F6F3EE",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-mode="do">
      <body className={`${figtree.variable} font-sans`}>{children}</body>
    </html>
  );
}
