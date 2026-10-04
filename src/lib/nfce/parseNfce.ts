export interface NfceData {
  total: number | null;
  date: string | null; // YYYY-MM-DD
  establishment: string | null;
}

const BRL = /(\d{1,3}(?:\.\d{3})*,\d{2})/;

function parseBrl(raw: string): number {
  return Number(raw.replace(/\./g, "").replace(",", "."));
}

export function parseNfceHtml(html: string): NfceData {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n");

  let total: number | null = null;
  const labelIdx = text.search(/Valor\s+(?:total|a\s+pagar)/i);
  if (labelIdx >= 0) {
    const amount = text.slice(labelIdx, labelIdx + 120).match(BRL);
    if (amount) total = parseBrl(amount[1]);
  }

  const dateMatch =
    text.match(/Emiss[ãa]o[^\d\n]{0,40}(\d{2})\/(\d{2})\/(\d{4})/i) ??
    text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : null;

  const nameMatch = text.match(/Raz[ãa]o\s+Social\s*:?\s*([^\n]{3,80})/i);
  const establishment = nameMatch ? nameMatch[1].trim() : null;

  return { total, date, establishment };
}
