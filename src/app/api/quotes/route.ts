import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get("tickers");

  if (!tickers) {
    return NextResponse.json({ error: "Nenhum ticker informado" }, { status: 400 });
  }

  // O token fica seguro no servidor — sem NEXT_PUBLIC_
  const token = process.env.BRAPI_TOKEN || process.env.NEXT_PUBLIC_BRAPI_TOKEN || "";

  const tickerList = tickers
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  const prices: Record<string, number> = {};

  for (const ticker of tickerList) {
    // brapi aceita o ticker sem o .SA (ex: PETR4, não PETR4.SA)
    const cleanTicker = ticker.replace(/\.SA$/i, "");
    const url = `https://brapi.dev/api/quote/${cleanTicker}${token ? `?token=${token}` : ""}`;

    try {
      const response = await fetch(url, {
        // cache revalidado a cada 5 minutos no servidor
        next: { revalidate: 300 },
      });

      if (response.status === 401) {
        return NextResponse.json(
          { error: "BRAPI_AUTH_REQUIRED", message: "Token inválido ou ausente" },
          { status: 401 }
        );
      }

      if (!response.ok) {
        // Ticker não encontrado — pula e continua para o próximo
        console.warn(`[quotes] Ticker ${cleanTicker} retornou status ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.results && data.results[0]) {
        const price = data.results[0].regularMarketPrice;
        if (price) {
          // Salva com e sem .SA para compatibilidade com os tickers já cadastrados
          prices[cleanTicker] = price;
          prices[`${cleanTicker}.SA`] = price;
        }
      }
    } catch (err) {
      console.warn(`[quotes] Erro ao buscar ticker ${cleanTicker}:`, err);
    }
  }

  return NextResponse.json({ prices });
}
