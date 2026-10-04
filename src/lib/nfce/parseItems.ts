export interface PurchaseItem {
  name: string;
  qty: number;
  unit: "KG" | "UN";
  unitPrice: number;
  amount: number;
}

const ITEM_RE = /(\d+(?:[,.]\d+)?)\s*(KG|K6|UN)\s*[xX×]\s*(\d+)(?:[\s,.](\d{2}))?/gi;

export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanProductName(segment: string): string {
  const words = segment
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(w => w && !/^\d+$/.test(w) && !/^\d*[.,]\d+$/.test(w) && /[A-Za-z]/.test(w));
  return words.slice(-6).join(" ").replace(/[.,;:]+$/g, "").trim();
}

function extractPrintedAmounts(source: string): number[] {
  const label = source.match(/Vlr\.?\s*\S*?\s*((?:\d+[,.]\d{2}\s*)+)/i);
  if (!label) return [];
  return label[1]
    .trim()
    .split(/\s+/)
    .map(v => Number(v.replace(",", ".")))
    .filter(v => v > 0);
}

export function parsePastedItems(text: string): PurchaseItem[] {
  const source = text.replace(/、/g, ",").replace(/\s+/g, " ");
  const items: PurchaseItem[] = [];
  let lastEnd = 0;

  for (const match of source.matchAll(ITEM_RE)) {
    const start = match.index ?? 0;
    const segment = source.slice(lastEnd, start);
    lastEnd = start + match[0].length;

    const qty = Number(match[1].replace(",", "."));
    const unit = match[2].toUpperCase() === "UN" ? "UN" : "KG";
    const unitPrice = Number(match[3] + (match[4] ? `.${match[4]}` : ""));
    if (!qty || !unitPrice) continue;

    items.push({
      name: cleanProductName(segment) || "Item sem nome",
      qty,
      unit,
      unitPrice,
      amount: Math.round(qty * unitPrice * 100) / 100,
    });
  }

  const printed = extractPrintedAmounts(source);
  if (printed.length === items.length) {
    items.forEach((item, i) => {
      if (Math.abs(printed[i] - item.amount) > 0.01) {
        item.amount = printed[i];
        if (item.unit === "UN") item.unitPrice = Math.round((printed[i] / item.qty) * 100) / 100;
      }
    });
  }

  return items;
}
