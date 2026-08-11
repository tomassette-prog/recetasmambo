import Link from "next/link";
import Image from "next/image";
import { getAllRecipes } from "@/lib/store";
import { categories } from "@/lib/recipes-data";

const categoryColors: Record<string, string> = {
  "sopas-y-cremas": "#FFF3E0",
  arroces: "#FFF8E1",
  carnes: "#FFEBEE",
  pescados: "#E0F7FA",
  postres: "#FCE4EC",
  salsas: "#FFF9C4",
  "panes-masas": "#EFEBE9",
  verduras: "#E8F5E9",
  bebidas: "#E3F2FD",
  legumbres: "#F3E5F5",
};

export const metadata = {
  title: "Todas las Recetas — Recetas Mambo",
  description: "Explora todas las recetas adaptadas a la Mambo Cooking Total Gourmet.",
};

export default function RecipesPage() {
  const recipes = getAllRecipes();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Todas las Recetas</h1>
      <p className="text-gray-500 mb-6">{recipes.length} recetas adaptadas a tu Mambo</p>

      {/* Category filter pills */}
      <div className="scroll-row mb-8">
        {categories.map((c) => (
          <Link key={c.slug} href={`/categorias/${c.slug}`} className="category-pill">
            <span className="text-base">{c.icono}</span>
            {c.nombre}
          </Link>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((r) => {
          const cat = categories.find((c) => c.slug === r.categoria);
          return (
            <Link key={r.id} href={`/recetas/${r.slug}`} className="recipe-card block">
              <div className="card-image bg-gray-100">
                {r.imagen ? (
                  <Image
                    src={r.imagen}
                    alt={r.titulo}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl" style={{ background: categoryColors[r.categoria] ?? "#F5F5F5" }}>{cat?.icono ?? "🍽️"}</div>
                )}
                {cat && (
                  <span className="category-badge">
                    {cat.icono} {cat.nombre}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-base mb-1 text-gray-900 leading-snug">
                  {r.titulo}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{r.descripcion}</p>
              </div>
              <div className="card-meta">
                <span>⏱ {r.tiempo_total_min} min</span>
                <span>👥 {r.comensales} pax</span>
                <span>📊 {r.dificultad}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
