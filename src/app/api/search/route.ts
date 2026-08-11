import { searchRecipes } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return Response.json({ results: [] });
  }

  const results = searchRecipes(q).map((r) => ({
    id: r.id,
    slug: r.slug,
    titulo: r.titulo,
    descripcion: r.descripcion,
    categoria: r.categoria,
    tiempo_total_min: r.tiempo_total_min,
    comensales: r.comensales,
  }));

  return Response.json({ results });
}
