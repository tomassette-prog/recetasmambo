import { scrapeRecipe } from "@/lib/scrape";
import { convertToMambo, slugify } from "@/lib/convert";
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
    const result = convertToMambo(scraped);

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      slug: slugify(result.titulo) || crypto.randomUUID().slice(0, 8),
      titulo: result.titulo,
      descripcion: `Receta adaptada de Thermomix a Mambo Cooking Total Gourmet.`,
      imagen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      categoria: "sopas-y-cremas",
      tiempo_total_min: result.pasos_mambo.reduce((sum, s) => sum + (s.tiempo_minutos ?? 0), 0),
      comensales: 4,
      dificultad: "Media",
      ingredientes: result.ingredientes,
      pasos_mambo: result.pasos_mambo,
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
