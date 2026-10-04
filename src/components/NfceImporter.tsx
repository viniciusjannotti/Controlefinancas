"use client";

import { useState } from "react";
import jsQR from "jsqr";
import { Button, Input } from "@/components/ui/index";

export interface NfceImport {
  total: number;
  date: string | null;
  establishment: string | null;
}

async function decodeQrFromImage(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data, width, height)?.data ?? null;
}

export function NfceImporter({ onImport }: { onImport: (nota: NfceImport) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");

  const consult = async (url: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/nfce?url=${encodeURIComponent(url)}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Erro ao consultar a nota");
        return;
      }
      onImport(body as NfceImport);
      setManualUrl("");
    } catch {
      setError("Falha de rede ao consultar a nota");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    let qrText: string | null = null;
    try {
      qrText = await decodeQrFromImage(file);
    } catch {
      qrText = null;
    }
    setLoading(false);
    if (!qrText) {
      setError("Não consegui ler o QR code. Tente outra foto ou cole o link abaixo.");
      return;
    }
    await consult(qrText);
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Importar NFC-e (Minas Gerais)</p>
      <Input
        type="file"
        accept="image/*"
        capture="environment"
        disabled={loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <Input
          placeholder="Ou cole o link do QR code"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
        />
        <Button type="button" variant="outline" disabled={loading || !manualUrl} onClick={() => consult(manualUrl.trim())}>
          Buscar
        </Button>
      </div>
      {loading && <p className="text-xs text-slate-500 dark:text-slate-400">Consultando nota...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
