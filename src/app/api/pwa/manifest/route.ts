import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level") || "1";

  const manifest = {
    name: "M & V Finanças",
    short_name: "MV Finanças",
    description: "Gestão financeira para Maria e Vinícius",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      {
        src: `/api/pwa/icon?level=${level}`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `/api/pwa/icon?level=${level}`,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: `/api/pwa/icon?level=${level}`,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      }
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
