import { NextRequest, NextResponse } from "next/server";
import { parseNfceHtml } from "@/lib/nfce/parseNfce";

const ALLOWED_SUFFIX = "fazenda.mg.gov.br";

export async function GET(request: NextRequest) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "URL da NFC-e não informada" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !target.hostname.endsWith(ALLOWED_SUFFIX)) {
    return NextResponse.json({ error: "Apenas notas da SEFAZ-MG são suportadas" }, { status: 400 });
  }

  try {
    const response = await fetch(target.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!response.ok) {
      return NextResponse.json({ error: `SEFAZ respondeu ${response.status}` }, { status: 502 });
    }
    const data = parseNfceHtml(await response.text());
    if (data.total === null) {
      return NextResponse.json({ error: "Não foi possível localizar o valor total na nota" }, { status: 422 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Falha ao consultar a SEFAZ-MG" }, { status: 502 });
  }
}
