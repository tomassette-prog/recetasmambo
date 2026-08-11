import Link from "next/link";
import Image from "next/image";
import { getAllRecipes } from "@/lib/store";
import { categories } from "@/lib/recipes-data";

const categoryGradients: Record<string, string> = {
  "sopas-y-cremas": "linear-gradient(135deg, #f59e0b, #d97706)",
  arroces: "linear-gradient(135deg, #eab308, #ca8a04)",
  carnes: "linear-gradient(135deg, #ef4444, #dc2626)",
  pescados: "linear-gradient(135deg, #06b6d4, #0891b2)",
  postres: "linear-gradient(135deg, #ec4899, #db2777)",
  salsas: "linear-gradient(135deg, #f59e0b, #d97706)",
  "panes-masas": "linear-gradient(135deg, #a16207, #854d0e)",
  verduras: "linear-gradient(135deg, #22c55e, #16a34a)",
  bebidas: "linear-gradient(135deg, #3b82f6, #2563eb)",
  legumbres: "linear-gradient(135deg, #a855f7, #9333ea)",
};

export const metadata = {
  title: "Todas las Recetas — Recetas Mambo",
  description: "Explora todas las recetas adaptadas a la Mambo Cooking Total Gourmet.",
};

export default function RecipesPage() {
  const recipes = getAllRecipes();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl mb-2" style={{ fontWeight: 400 }}>Todas las Recetas</h1>
      <p className="text-gray-500 mb-6">{recipes.length} recetas adaptadas a tu Mambo</p>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
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
                  <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: categoryGradients[r.categoria] ?? "#f5f5f5" }}>{cat?.icono ?? "🍽️"}</div>
                )}
                {cat && (
                  <span className="category-badge">
                    {cat.icono} {cat.nombre}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-base mb-1 leading-snug" style={{ fontWeight: 700, color: "#23282A" }}>
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
