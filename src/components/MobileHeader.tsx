"use client";

import { Menu, X } from "lucide-react";

export function MobileHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-xl font-bold text-slate-900 bg-primary/5 px-3 py-1 rounded-lg">
        M & V <span className="text-primary italic">Finanças</span>
      </h1>
      <button 
        onClick={onToggle}
        className="p-2 -mr-2 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Menu className="w-6 h-6 text-slate-600" />
      </button>
    </header>
  );
}
