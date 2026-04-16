import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { GameProvider } from "@/lib/game/GameContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "M & V Finanças | Gestão Financeira",
  description: "Sistema de gestão financeira para o casal Maria Cecília e Vinícius",
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
          <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 min-h-screen relative">
              <div className="max-w-6xl mx-auto relative">
                <div className="absolute top-0 right-0 z-50">
                  <NotificationsDropdown />
                </div>
                <div className="pt-2">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </GameProvider>
      </body>
    </html>
  );
}
