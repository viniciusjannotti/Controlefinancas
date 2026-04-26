import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string } }
) {
  const { searchParams } = new URL(request.url);
  const level = parseInt(searchParams.get("level") || "1");

  const stages = [
    { emoji: "🌱", color: "#10b981" }, // Semente - Emerald
    { emoji: "🌿", color: "#059669" }, // Broto - Emerald
    { emoji: "🌳", color: "#15803d" }, // Árvore jovem - Green
    { emoji: "🌲", color: "#166534" }, // Árvore forte - Green
    { emoji: "🌴", color: "#065f46" }, // Floresta - Teal
  ];

  const stage = stages[Math.min(level - 1, stages.length - 1)] || stages[0];

  // Create an SVG with a premium look
  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f1f5f9;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
          <feOffset dx="0" dy="10" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />
      <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" font-size="320" filter="url(#shadow)">${stage.emoji}</text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
