import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { GameProvider } from "@/lib/game/GameContext";
import { ClientLayout } from "@/components/ClientLayout";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "M & V Finanças | Gestão Financeira",
  description: "Sistema de gestão financeira para o casal Maria Cecília e Vinícius",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "M & V Finanças",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-slate-50`}>
        <GameProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </GameProvider>
      </body>
    </html>
  );
}
