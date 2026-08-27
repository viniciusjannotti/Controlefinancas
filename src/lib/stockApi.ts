/**
 * Busca cotações via API Route interna do Next.js (/api/quotes).
 * Isso evita problemas de CORS e mantém o token seguro no servidor.
 */
export async function fetchStockPrices(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};

  // Remove duplicatas e normaliza (remove .SA duplicado antes de enviar)
  const uniqueTickers = Array.from(
    new Set(tickers.map((t) => t.toUpperCase().trim().replace(/\.SA$/i, "")))
  );

  const response = await fetch(
    `/api/quotes?tickers=${encodeURIComponent(uniqueTickers.join(","))}`
  );

  if (response.status === 401) {
    throw new Error("BRAPI_AUTH_REQUIRED");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API_ERROR_${response.status}_${text.substring(0, 100)}`);
  }

  const data = await response.json();
  return data.prices ?? {};
}
