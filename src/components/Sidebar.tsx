"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  PieChart,
  Settings as SettingsIcon,
  Gamepad2,
  Sprout,
  ChevronDown,
  ChevronRight,
  Droplet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ganhos", href: "/ganhos", icon: TrendingUp },
  { name: "Gastos", href: "/gastos", icon: Wallet },
  { name: "Investimentos", href: "/investments", icon: PieChart },
];

const bottomNav = [
  { name: "Configurações", href: "/settings", icon: SettingsIcon },
];

const gamesSubmenu = [
  { name: "Criando Vida", href: "/jogos/criando-vida", icon: Sprout },
  { name: "Sociedade", href: "/jogos/sociedade", icon: Droplet },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const isUnderGames = pathname.startsWith("/jogos");
  const [gamesOpen, setGamesOpen] = useState(isUnderGames);

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
      pathname === href || (pathname === "/" && href === "/dashboard")
        ? "bg-primary/10 text-primary shadow-sm"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    );

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "flex flex-col h-full bg-white border-r border-slate-200 w-64 fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">CF</span>
          </div>
          <span className="tracking-tight italic">Finanças</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {/* Main nav items */}
        {navigation.map((item) => (
          <Link key={item.name} href={item.href} className={linkClass(item.href)}>
            <item.icon
              className={cn(
                "w-5 h-5",
                pathname === item.href ? "text-primary" : "text-slate-400"
              )}
            />
            {item.name}
          </Link>
        ))}

        {/* ── Jogos (expandable) ──────────────────────────── */}
        <div>
          <button
            onClick={() => setGamesOpen((o) => !o)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              isUnderGames
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Gamepad2
              className={cn("w-5 h-5", isUnderGames ? "text-primary" : "text-slate-400")}
            />
            <span className="flex-1 text-left">Jogos</span>
            {gamesOpen ? (
              <ChevronDown className="w-4 h-4 opacity-50" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-50" />
            )}
          </button>

          {/* Submenu */}
          {gamesOpen && (
            <div className="ml-5 mt-1 space-y-1 border-l-2 border-slate-100 pl-3 animate-in slide-in-from-top-2 duration-200">
              {gamesSubmenu.map((item) => (
                <Link key={item.name} href={item.href} className={linkClass(item.href)}>
                  <item.icon
                    className={cn(
                      "w-4 h-4",
                      pathname === item.href ? "text-primary" : "text-slate-400"
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="px-4 pb-2 space-y-1">
        {bottomNav.map((item) => (
          <Link key={item.name} href={item.href} className={linkClass(item.href)}>
            <item.icon
              className={cn(
                "w-5 h-5",
                pathname === item.href ? "text-primary" : "text-slate-400"
              )}
            />
            {item.name}
          </Link>
        ))}
      </div>

      {/* User card */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold">
            MV
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">M &amp; V</p>
            <p className="text-xs text-slate-500 truncate">Plano Familiar</p>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
