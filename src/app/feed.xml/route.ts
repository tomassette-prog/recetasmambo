import { NextResponse } from "next/server";
import { getAllRecipes } from "@/lib/store";

export async function GET() {
  const recipes = getAllRecipes();
  const base = "https://recetasmambo.com";
  const now = new Date().toISOString();

  const items = recipes
    .slice(0, 50)
    .map(
      (r) => `    <item>
      <title><![CDATA[${r.titulo}]]></title>
      <link>${base}/recetas/${r.slug}</link>
      <description><![CDATA[${r.descripcion}]]></description>
      <pubDate>${new Date(r.creado_en).toUTCString()}</pubDate>
      <guid isPermaLink="true">${base}/recetas/${r.slug}</guid>
      <category>${r.categoria}</category>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mambo Cooking Total Gourmet — Recetas</title>
    <link>${base}</link>
    <description>Recetas de Thermomix adaptadas a la Cecotec Mambo Cooking Total Gourmet</description>
    <language>es</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${base}/images/hero-banner.jpg</url>
      <title>Mambo Cooking Total Gourmet</title>
      <link>${base}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
