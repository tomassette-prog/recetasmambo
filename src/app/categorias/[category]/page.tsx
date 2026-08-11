import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getRecipesByCategory } from "@/lib/store";
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
  const firstRecipeWithImage = recipes.find((r) => r.imagen);

  return (
    <div>
      {/* Hero banner */}
      <div className="hero-banner" style={{ height: 280 }}>
        {firstRecipeWithImage?.imagen ? (
          <Image
            src={firstRecipeWithImage.imagen}
            alt={cat.nombre}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full" style={{ background: categoryGradients[category] ?? "#888" }} />
        )}
        <div className="hero-banner-content mx-auto max-w-7xl">
          <nav className="breadcrumb mb-3 text-white/70">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span className="mx-1">›</span>
            <Link href="/categorias" className="hover:text-white">Categorías</Link>
          </nav>
          <h1 className="text-3xl md:text-4xl text-white mb-1" style={{ fontWeight: 400 }}>
            {cat.icono} {cat.nombre}
          </h1>
          <p className="text-sm text-white/80">{cat.descripcion}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <p className="text-sm font-medium mb-8" style={{ color: "#00AC46" }}>
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
                  {r.imagen ? (
                    <Image
                      src={r.imagen}
                      alt={r.titulo}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: categoryGradients[r.categoria] ?? "#f5f5f5" }}>{cat.icono}</div>
                  )}
                  <span className="category-badge">
                    {cat.icono} {cat.nombre}
                  </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
