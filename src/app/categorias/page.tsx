import Link from "next/link";
import { categories } from "@/lib/recipes-data";
import { getRecipesByCategory } from "@/lib/store";

export const metadata = {
  title: "Categorías — MamboRecetas",
  description: "Explora recetas por categorías para tu Mambo Cooking Total Gourmet.",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Categorías</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((c) => {
          const count = getRecipesByCategory(c.slug).length;
          return (
            <Link
              key={c.slug}
              href={`/categorias/${c.slug}`}
              className="group rounded-xl border border-gray-200 p-6 hover:border-emerald-400 hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-3">{c.icono}</div>
              <h2 className="text-xl font-semibold mb-1 group-hover:text-emerald-700 transition-colors">
                {c.nombre}
              </h2>
              <p className="text-sm text-gray-500 mb-2">{c.descripcion}</p>
              <span className="text-xs text-emerald-600 font-medium">
                {count} {count === 1 ? "receta" : "recetas"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
