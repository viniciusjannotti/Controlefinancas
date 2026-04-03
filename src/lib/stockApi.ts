export async function fetchStockPrices(tickers: string[]) {
  if (tickers.length === 0) return {};

  try {
    // Brapi requires authentication for most assets.
    // Only PETR4, MGLU3, VALE3, ITUB4 work without a token (testing only).
    const symbols = tickers
      .map(t => t.includes('.') ? t.toUpperCase() : t.toUpperCase())
      .join(',');
    
    const token = process.env.NEXT_PUBLIC_BRAPI_TOKEN || '';
    const url = token
      ? `https://brapi.dev/api/quote/${symbols}?token=${token}`
      : `https://brapi.dev/api/quote/${symbols}`;
    
    const response = await fetch(url);

    // If 401, the token is missing or invalid
    if (response.status === 401) {
      throw new Error('BRAPI_AUTH_REQUIRED');
    }

    if (!response.ok) {
      throw new Error(`HTTP_ERROR_${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.error("Brapi: No results found for tickers:", symbols);
      return {};
    }

    const prices: Record<string, number> = {};
    data.results.forEach((result: any) => {
      const symbol = result.symbol?.replace('.SA', '').toUpperCase();
      if (symbol && result.regularMarketPrice) {
        prices[symbol] = result.regularMarketPrice;
        prices[`${symbol}.SA`] = result.regularMarketPrice;
      }
    });

    return prices;
  } catch (error: any) {
    if (error.message === 'BRAPI_AUTH_REQUIRED') {
      throw error; // Re-throw so the caller can show a specific message
    }
    console.error("Error fetching stock prices:", error);
    return {};
  }
}
