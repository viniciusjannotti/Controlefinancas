"use client";

import { useState } from "react";
import jsQR from "jsqr";
import { Button, Input } from "@/components/ui/index";

export interface NfceImport {
  total: number;
  date: string | null;
  establishment: string | null;
}

const LONG_SIDES = [1600, 1000, 600];
const THRESHOLDS: (number | null)[] = [null, 128, 170, 200];

function binarize(data: Uint8ClampedArray, threshold: number | null): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const v = threshold === null ? gray : gray > threshold ? 255 : 0;
    out[i] = out[i + 1] = out[i + 2] = v;
    out[i + 3] = 255;
  }
  return out;
}

async function decodeQrFromImage(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  for (const target of LONG_SIDES) {
    const scale = target / longest;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (const threshold of THRESHOLDS) {
      const data = binarize(raw.data, threshold);
      const found = jsQR(data, raw.width, raw.height, { inversionAttempts: "attemptBoth" });
      if (found?.data) return found.data;
    }
  }
  return null;
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
