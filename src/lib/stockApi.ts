export async function fetchStockPrices(tickers: string[]) {
  if (tickers.length === 0) return {};

  try {
    const symbols = tickers
      .map(t => t.includes('.') ? t.toUpperCase() : `${t.toUpperCase()}.SA`)
      .join(',');
    
    const token = process.env.NEXT_PUBLIC_BRAPI_TOKEN || '';
    const url = token
      ? `https://brapi.dev/api/quote/${symbols}?token=${token}`
      : `https://brapi.dev/api/quote/${symbols}`;
    
    const response = await fetch(url);

    if (response.status === 401) {
      throw new Error('BRAPI_AUTH_REQUIRED');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API_ERROR_${response.status}_${errorText.substring(0, 50)}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
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
    // Repassa o erro para o handleRefreshQuotes tratar
    throw error;
  }
}
