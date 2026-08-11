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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="breadcrumb mb-6">
        <Link href="/">Inicio</Link>
        <span className="separator mx-1">›</span>
        <Link href="/categorias">Categorías</Link>
        <span className="separator mx-1">›</span>
        <span className="current">{cat.nombre}</span>
      </nav>

      {/* Category header */}
      <div className="flex items-center gap-4 mb-2">
        <span className="text-5xl">{cat.icono}</span>
        <div>
          <h1 className="text-3xl font-bold">{cat.nombre}</h1>
          <p className="text-gray-500">{cat.descripcion}</p>
        </div>
      </div>
      <p className="text-sm font-medium mb-8" style={{ color: "var(--color-accent)" }}>
        {recipes.length} {recipes.length === 1 ? "receta" : "recetas"}
      </p>

      {recipes.length === 0 ? (
        <p className="text-gray-400 py-16 text-center">
          Aún no hay recetas en esta categoría. ¡Usa el conversor para añadir!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <Link key={r.id} href={`/recetas/${r.slug}`} className="recipe-card block">
              <div className="card-image bg-gray-100">
                <Image
                  src={r.imagen}
                  alt={r.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span className="category-badge">
                  {cat.icono} {cat.nombre}
                </span>
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
          ))}
        </div>
      )}
    </div>
  );
}
