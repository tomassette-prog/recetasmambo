import Link from "next/link";
import { categories } from "@/lib/recipes-data";
import { getRecipesByCategory } from "@/lib/store";

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
  title: "Categorías — Recetas Mambo",
  description: "Explora recetas por categorías para tu Mambo Cooking Total Gourmet.",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl mb-2" style={{ fontWeight: 400 }}>Categorías</h1>
      <p className="text-gray-500 mb-8">Explora nuestras recetas por tipo de plato</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map((c) => {
          const count = getRecipesByCategory(c.slug).length;
          return (
            <Link
              key={c.slug}
              href={`/categorias/${c.slug}`}
              className="category-tile block"
              style={{ width: "100%", height: 160 }}
            >
              <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: categoryGradients[c.slug] ?? "#888" }} />
              <div className="category-tile-overlay">
                <div>{c.icono} {c.nombre}</div>
                <div className="text-xs font-normal text-white/70 mt-0.5">{count} {count === 1 ? "receta" : "recetas"}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
