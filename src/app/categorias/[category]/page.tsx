import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getRecipesByCategory } from "@/lib/store";
import { categories } from "@/lib/recipes-data";

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return { title: "Categoría no encontrada" };
  return {
    title: `${cat.nombre} — Recetas Mambo`,
    description: cat.descripcion,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return notFound();

  const recipes = getRecipesByCategory(category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-emerald-600">Inicio</Link>
        <span className="mx-2">→</span>
        <Link href="/categorias" className="hover:text-emerald-600">Categorías</Link>
        <span className="mx-2">→</span>
        <span className="text-gray-600">{cat.nombre}</span>
      </nav>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">{cat.icono}</span>
        <div>
          <h1 className="text-3xl font-bold">{cat.nombre}</h1>
          <p className="text-gray-500">{cat.descripcion}</p>
        </div>
      </div>

      {recipes.length === 0 ? (
        <p className="text-gray-400 py-16 text-center">
          Aún no hay recetas en esta categoría. ¡Usa el conversor para añadir!
        </p>
      ) : (
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
                <h2 className="font-semibold text-lg mb-1 group-hover:text-emerald-700 transition-colors">
                  {r.titulo}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-2">{r.descripcion}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span>⏱ {r.tiempo_total_min} min</span>
                  <span>👥 {r.comensales} pax</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
