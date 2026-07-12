import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/lib/game/GameContext";
import { ClientLayout } from "@/components/ClientLayout";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";

// Aplica o tema salvo antes do primeiro paint, evitando flash de tela clara
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "M & V Finanças | Gestão Financeira",
  description: "Sistema de gestão financeira para o casal Maria Cecília e Vinícius",
  manifest: "/api/pwa/manifest",
  icons: {
    icon: "/api/pwa/icon",
    apple: "/api/pwa/icon",
  },
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-950`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <GameProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </GameProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
