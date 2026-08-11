import type { MetadataRoute } from "next";
import { getAllRecipes } from "@/lib/store";
import { categories } from "@/lib/recipes-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://recetasmambo.com";

  const recipes = getAllRecipes().map((r) => ({
    url: `${base}/recetas/${r.slug}`,
    lastModified: new Date(r.creado_en),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const cats = categories.map((c) => ({
    url: `${base}/categorias/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/recetas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categorias`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/convertir`, changeFrequency: "monthly", priority: 0.5 },
    ...cats,
    ...recipes,
  ];
}
