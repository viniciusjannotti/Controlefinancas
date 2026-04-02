export async function fetchStockPrices(tickers: string[]) {
  if (tickers.length === 0) return {};

  try {
    // Brapi API allows comma-separated tickers. 
    // We append .SA to B3 tickers if not present, as required by Brapi for full support.
    const symbols = tickers.map(t => t.includes('.') ? t.toUpperCase() : `${t.toUpperCase()}.SA`).join(',');
    
    // Using the public endpoint. 
    // Note: In production, moving the token to .env.local is recommended.
    const url = `https://brapi.dev/api/quote/${symbols}?token=${process.env.NEXT_PUBLIC_BRAPI_TOKEN || ''}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      console.error("Brapi Error:", data.message || "Unknown error");
      return {};
    }

    const prices: Record<string, number> = {};
    data.results.forEach((result: any) => {
      // Map back to original ticker (without .SA if that's how it was stored)
      const symbol = result.symbol;
      prices[symbol] = result.regularMarketPrice;
      // Also map to the version without .SA for convenience
      if (symbol.endsWith('.SA')) {
        prices[symbol.replace('.SA', '')] = result.regularMarketPrice;
      }
    });

    return prices;
  } catch (error) {
    console.error("Error fetching stock prices:", error);
    return {};
  }
}
