"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";
import { parsePastedItems, PurchaseItem } from "@/lib/nfce/parseItems";

export function PastedItemsImporter({
  items,
  onChange,
}: {
  items: PurchaseItem[];
  onChange: (items: PurchaseItem[]) => void;
}) {
  const [text, setText] = useState("");

  const updateItem = (index: number, patch: Partial<PurchaseItem>) => {
    onChange(
      items.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        next.amount = Math.round(next.amount * 100) / 100;
        return next;
      })
    );
  };

  const total = items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
      <Label>Colar itens da nota</Label>
      <textarea
        className="w-full min-h-[90px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs"
        placeholder="Cole aqui o texto copiado do cupom (itens e valores)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button type="button" variant="outline" className="w-full" disabled={!text.trim()} onClick={() => onChange(parsePastedItems(text))}>
        Analisar itens
      </Button>

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">Revise os itens antes de salvar:</p>
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                className="flex-1 min-w-0 h-9 text-xs"
                value={item.name}
                onChange={(e) => updateItem(i, { name: e.target.value })}
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {item.qty} {item.unit.toLowerCase()}
              </span>
              <Input
                className="w-24 h-9 text-xs"
                type="number"
                step="0.01"
                value={item.amount}
                onChange={(e) => updateItem(i, { amount: Number(e.target.value) })}
              />
              <button
                type="button"
                className="text-red-500 text-xs px-1"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </div>
          ))}
          <p className="text-sm font-semibold text-right">Total: {formatCurrency(total)}</p>
        </div>
      )}
    </div>
  );
}
