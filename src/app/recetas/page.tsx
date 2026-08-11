import Link from "next/link";
import Image from "next/image";
import { getAllRecipes } from "@/lib/store";
import { categories } from "@/lib/recipes-data";

export const metadata = {
  title: "Todas las Recetas — Recetas Mambo",
  description: "Explora todas las recetas adaptadas a la Mambo Cooking Total Gourmet.",
};

export default function RecipesPage() {
  const recipes = getAllRecipes();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Todas las Recetas</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((r) => (
          <Link
            key={r.id}
            href={`/recetas/${r.slug}`}
            className="group rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-48 bg-gray-100">
              <Image
                src={r.imagen}
                alt={r.titulo}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <div className="text-xs text-emerald-600 font-medium mb-1">
                {categories.find((c) => c.slug === r.categoria)?.icono}{" "}
                {categories.find((c) => c.slug === r.categoria)?.nombre}
              </div>
              <h2 className="font-semibold text-lg mb-1 group-hover:text-emerald-700 transition-colors">
                {r.titulo}
              </h2>
              <p className="text-sm text-gray-500 line-clamp-2">{r.descripcion}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span>⏱ {r.tiempo_total_min} min</span>
                <span>👥 {r.comensales} pax</span>
                <span>📊 {r.dificultad}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
