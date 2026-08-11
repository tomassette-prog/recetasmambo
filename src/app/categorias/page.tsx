import Link from "next/link";
import { categories } from "@/lib/recipes-data";
import { getRecipesByCategory } from "@/lib/store";

export const metadata = {
  title: "Categorías — Recetas Mambo",
  description: "Explora recetas por categorías para tu Mambo Cooking Total Gourmet.",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Categorías</h1>
      <p className="text-gray-500 mb-8">Explora nuestras recetas por tipo de plato</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((c) => {
          const count = getRecipesByCategory(c.slug).length;
          return (
            <Link
              key={c.slug}
              href={`/categorias/${c.slug}`}
              className="recipe-card block p-6"
            >
              <div className="text-4xl mb-3">{c.icono}</div>
              <h2 className="text-lg font-semibold mb-1 text-gray-900">
                {c.nombre}
              </h2>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">{c.descripcion}</p>
              <span className="text-xs font-semibold rounded-full px-3 py-1" style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}>
                {count} {count === 1 ? "receta" : "recetas"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
