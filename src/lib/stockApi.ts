export async function fetchStockPrices(tickers: string[]) {
  if (tickers.length === 0) return {};

  // Remove duplicatas para economizar requisições
  const uniqueTickers = Array.from(new Set(tickers.map(t => t.toUpperCase().trim())));
  const prices: Record<string, number> = {};
  const token = process.env.NEXT_PUBLIC_BRAPI_TOKEN || '';

  try {
    // Buscamos um por um para evitar o limite de "X ativos por requisição" do plano gratuito
    for (const ticker of uniqueTickers) {
      const symbol = ticker.includes('.') ? ticker : `${ticker}.SA`;
      const url = token
        ? `https://brapi.dev/api/quote/${symbol}?token=${token}`
        : `https://brapi.dev/api/quote/${symbol}`;
      
      const response = await fetch(url);

      if (response.status === 401) {
        throw new Error('BRAPI_AUTH_REQUIRED');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API_ERROR_${response.status}_${errorText.substring(0, 50)}`);
      }

      const data = await response.json();

      if (data.results && data.results[0]) {
        const result = data.results[0];
        const price = result.regularMarketPrice;
        if (price) {
          prices[ticker] = price;
          prices[`${ticker}.SA`] = price;
        }
      }
    }

    return prices;
  } catch (error: any) {
    throw error;
  }
}
