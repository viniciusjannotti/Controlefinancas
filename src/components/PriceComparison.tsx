"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/index";
import { formatCurrency } from "@/lib/utils";
import { getPurchases } from "@/lib/firebase/db";
import { normalizeName } from "@/lib/nfce/parseItems";
import { useAuth } from "@/lib/auth/AuthContext";

interface PlaceStat {
  place: string;
  amount: number;
  qty: number;
  visits: number;
}

export function PriceComparison() {
  const { accountId } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accountId) return;
    getPurchases(accountId).then(setPurchases).catch(err => console.error("Erro ao buscar compras:", err));
  }, [accountId]);

  const products = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; places: Map<string, PlaceStat> }>();

    for (const purchase of purchases) {
      const placeKey = normalizeName(purchase.placeName || "Sem local");
      for (const item of purchase.items || []) {
        const name = normalizeName(item.name || "");
        if (!name) continue;
        const key = `${name}|${item.unit}`;
        if (!map.has(key)) map.set(key, { name, unit: item.unit, places: new Map() });
        const product = map.get(key)!;
        const stat = product.places.get(placeKey) ?? { place: purchase.placeName, amount: 0, qty: 0, visits: 0 };
        stat.amount += Number(item.amount) || 0;
        stat.qty += Number(item.qty) || 0;
        stat.visits += 1;
        product.places.set(placeKey, stat);
      }
    }

    return Array.from(map.values())
      .map(product => ({
        ...product,
        places: Array.from(product.places.values())
          .filter(p => p.qty > 0)
          .map(p => ({ ...p, unitPrice: p.amount / p.qty }))
          .sort((a, b) => a.unitPrice - b.unitPrice),
      }))
      .filter(product => product.places.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [purchases]);

  const term = normalizeName(search);
  const visible = products.filter(p => !term || p.name.includes(term));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Preços</CardTitle>
        <CardDescription>Preço médio por local de compra, do mais barato ao mais caro.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />

        {visible.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {products.length === 0 ? "Nenhuma compra com itens salva ainda." : "Nenhum produto encontrado."}
          </p>
        ) : (
          <div className="space-y-4">
            {visible.map(product => (
              <div key={`${product.name}|${product.unit}`} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {product.name} <span className="text-xs font-normal text-slate-400">(por {product.unit === "KG" ? "kg" : "unidade"})</span>
                </p>
                <div className="mt-2 space-y-1">
                  {product.places.map((p, i) => (
                    <div key={p.place} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>
                        {i === 0 && <span className="text-emerald-600 font-semibold mr-1">★</span>}
                        {p.place} <span className="text-slate-400">({p.visits}x)</span>
                      </span>
                      <span className="font-semibold">{formatCurrency(p.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
