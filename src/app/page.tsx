import Link from "next/link";
import Image from "next/image";
import { getAllRecipes, getFeaturedRecipes } from "@/lib/store";
import { categories } from "@/lib/recipes-data";
import Newsletter from "@/components/Newsletter";
import AffiliateProducts from "@/components/AffiliateProducts";
import SearchBox from "@/components/SearchBox";

const featured = getFeaturedRecipes();
const allRecipes = getAllRecipes();

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FFF5EB 0%, #FFE8CC 50%, #FFFAF5 100%)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5" style={{ color: "#1a1a1a" }}>
            Recetas para tu <span style={{ color: "var(--color-accent)" }}>Mambo</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            Recetas de Thermomix adaptadas automáticamente a la <strong className="text-gray-700">Cecotec Mambo Cooking Total Gourmet</strong>.
            Tiempos, temperaturas, accesorios y potencia calórica correctos.
          </p>
          <SearchBox />
        </div>
      </section>

      {/* Categorías — horizontal scroll */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h2 className="section-title">Categorías</h2>
        <div className="scroll-row">
          {categories.map((c) => (
            <Link key={c.slug} href={`/categorias/${c.slug}`} className="category-pill">
              <span className="text-lg">{c.icono}</span>
              {c.nombre}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured hero card */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
          <Link href={`/recetas/${featured[0].slug}`} className="hero-recipe block group">
            {featured[0].imagen ? (
              <Image
                src={featured[0].imagen}
                alt={featured[0].titulo}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: categoryColors[featured[0].categoria] ?? "#F5F5F5" }}>{categories.find((c) => c.slug === featured[0].categoria)?.icono ?? "🍽️"}</div>
            )}
            <div className="hero-overlay">
              <span className="inline-block self-start rounded-full px-3 py-1 text-xs font-semibold mb-3" style={{ background: "var(--color-accent)", color: "white" }}>
                ⭐ Destacada
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{featured[0].titulo}</h2>
              <p className="text-sm text-gray-200 max-w-lg line-clamp-2">{featured[0].descripcion}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-300">
                <span>⏱ {featured[0].tiempo_total_min} min</span>
                <span>👥 {featured[0].comensales} pax</span>
                <span>📊 {featured[0].dificultad}</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Últimas recetas grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">Últimas Recetas</h2>
          <Link href="/recetas" className="text-sm font-medium hover:underline" style={{ color: "var(--color-accent)" }}>
            Ver todas ({allRecipes.length}) →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allRecipes.slice(0, 12).map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      {/* Afiliados */}
      <AffiliateProducts />

      {/* Newsletter */}
      <Newsletter />

      {/* CTA */}
      <section className="py-16 px-4 text-center" style={{ background: "linear-gradient(135deg, #E85D04, #D35400)" }}>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">¿Tienes una receta de Thermomix?</h2>
        <p className="text-orange-100 mb-8 max-w-lg mx-auto">
          Pega la URL y la convertimos automáticamente a los ajustes de tu Mambo Cooking Total Gourmet.
        </p>
        <Link
          href="/convertir"
          className="inline-block rounded-full bg-white font-semibold px-8 py-3 hover:bg-gray-50 transition-colors"
          style={{ color: "var(--color-accent)" }}
        >
          Convertir Receta →
        </Link>
      </section>
    </div>
  );
}

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

function RecipeCard({ recipe }: { recipe: (typeof allRecipes)[0] }) {
  const cat = categories.find((c) => c.slug === recipe.categoria);
  return (
    <Link href={`/recetas/${recipe.slug}`} className="recipe-card block">
      <div className="card-image bg-gray-100">
        {recipe.imagen ? (
          <Image
            src={recipe.imagen}
            alt={recipe.titulo}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl" style={{ background: categoryColors[recipe.categoria] ?? "#F5F5F5" }}>{cat?.icono ?? "🍽️"}</div>
        )}
        {cat && (
          <span className="category-badge">
            {cat.icono} {cat.nombre}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base mb-1 text-gray-900 leading-snug">
          {recipe.titulo}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{recipe.descripcion}</p>
      </div>
      <div className="card-meta">
        <span>⏱ {recipe.tiempo_total_min} min</span>
        <span>👥 {recipe.comensales} pax</span>
        <span>📊 {recipe.dificultad}</span>
      </div>
    </Link>
  );
}

