import { scrapeRecipe } from "@/lib/scrape";
import { convertScrapedRecipe } from "@/lib/convert";
import { addRecipe } from "@/lib/store";
import type { Recipe } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return Response.json({ ok: false, error: "Falta la URL." }, { status: 400 });
    }

    const scraped = await scrapeRecipe(url);
    const converted = convertScrapedRecipe(scraped);

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      ...converted,
      slug: converted.slug || crypto.randomUUID().slice(0, 8),
      imagen:
        converted.imagen ||
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      fuente_url: url,
      creado_en: new Date().toISOString().slice(0, 10),
    };

    addRecipe(newRecipe);

    return Response.json({ ok: true, result: newRecipe });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
