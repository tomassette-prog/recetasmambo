import Link from "next/link";
import Image from "next/image";
import { getAllRecipes, getFeaturedRecipes } from "@/lib/store";
import { categories } from "@/lib/recipes-data";
import Newsletter from "@/components/Newsletter";
import AffiliateProducts from "@/components/AffiliateProducts";
import SearchBox from "@/components/SearchBox";

const featured = getFeaturedRecipes();
const allRecipes = getAllRecipes();

/* Category → background gradient for placeholder tiles */
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

function CarouselRecipeCard({ recipe }: { recipe: (typeof allRecipes)[0] }) {
  const cat = categories.find((c) => c.slug === recipe.categoria);
  return (
    <Link href={`/recetas/${recipe.slug}`} className="recipe-card carousel-item block" style={{ width: 320 }}>
      <div className="card-image bg-gray-100">
        {recipe.imagen ? (
          <Image
            src={recipe.imagen}
            alt={recipe.titulo}
            fill
            className="object-cover"
            sizes="320px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: categoryGradients[recipe.categoria] ?? "#f5f5f5" }}>{cat?.icono ?? "🍽️"}</div>
        )}
        <div className="recipe-card-overlay">
          <h3>{recipe.titulo}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="meta-badge">⏱ {recipe.tiempo_total_min} min</span>
            <span className="meta-badge">{recipe.dificultad}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function GridRecipeCard({ recipe }: { recipe: (typeof allRecipes)[0] }) {
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
          <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: categoryGradients[recipe.categoria] ?? "#f5f5f5" }}>{cat?.icono ?? "🍽️"}</div>
        )}
        {cat && (
          <span className="category-badge">{cat.icono} {cat.nombre}</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base mb-1 leading-snug" style={{ color: "#23282A", fontWeight: 700 }}>
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

export default function Home() {
  return (
    <div>
      {/* ── Section 1: Hero Banner (Cookidoo style) ── */}
      <section
        className="hero-banner"
        style={{
          backgroundImage: "url('/images/hero-banner.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="hero-banner-content mx-auto max-w-7xl">
          <h1 className="text-4xl md:text-6xl text-white mb-3" style={{ fontWeight: 300, lineHeight: 1.15 }}>
            Recetas para tu<br /><strong style={{ fontWeight: 600 }}>Mambo</strong>
          </h1>
          <p className="text-lg text-white/90 mb-6 max-w-lg" style={{ lineHeight: 1.5 }}>
            Miles de recetas de Thermomix adaptadas a la Cecotec Mambo Cooking Total Gourmet
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Link href="/recetas" className="btn-primary" style={{ fontSize: "1rem", padding: "14px 28px" }}>
              Explorar recetas
            </Link>
          </div>
          <div className="mt-6 max-w-lg w-full">
            <SearchBox />
          </div>
        </div>
      </section>

      {/* ── Section 2: Featured Carousel ── */}
      {featured.length > 0 && (
        <section className="py-10 px-4 sm:px-6 bg-white">
          <div className="mx-auto max-w-7xl">
            <div className="section-header">
              <h2 className="section-title mb-0">¡Lo que no te puedes perder!</h2>
              <Link href="/recetas" className="section-link">Ver más →</Link>
            </div>
            <div className="carousel">
              {featured.map((r) => (
                <CarouselRecipeCard key={r.id} recipe={r} />
              ))}
              {allRecipes.filter((r) => !r.destacada).slice(0, 6).map((r) => (
                <CarouselRecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 3: Category Tiles ── */}
      <section className="py-10 px-4 sm:px-6" style={{ background: "#f5f5f5" }}>
        <div className="mx-auto max-w-7xl">
          <div className="section-header">
            <h2 className="section-title mb-0">Categorías populares</h2>
            <Link href="/categorias" className="section-link">Ver todas →</Link>
          </div>
          <div className="carousel">
            {categories.map((c) => (
              <Link key={c.slug} href={`/categorias/${c.slug}`} className="category-tile">
                <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: categoryGradients[c.slug] ?? "#888" }} />
                <div className="category-tile-overlay">{c.icono} {c.nombre}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Latest Recipes Carousel ── */}
      <section className="py-10 px-4 sm:px-6 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="section-header">
            <h2 className="section-title mb-0">Últimas recetas</h2>
            <Link href="/recetas" className="section-link">Ver todas ({allRecipes.length}) →</Link>
          </div>
          <div className="carousel">
            {allRecipes.slice(0, 12).map((r) => (
              <CarouselRecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: CTA ── */}
      <section className="py-16 px-4 text-center" style={{ background: "linear-gradient(135deg, #00AC46, #008a38)" }}>
        <h2 className="text-3xl md:text-4xl text-white mb-4" style={{ fontWeight: 400 }}>¿Tienes una receta de Thermomix?</h2>
        <p className="text-white/80 mb-8 max-w-lg mx-auto">
          Pega la URL y la convertimos automáticamente a los ajustes de tu Mambo Cooking Total Gourmet.
        </p>
        <Link href="/recetas" className="inline-block bg-white font-semibold px-8 py-3 rounded-md hover:bg-gray-50 transition-colors" style={{ color: "#00AC46" }}>
          Ver todas las recetas →
        </Link>
      </section>

      {/* ── Section 6: Affiliate Products ── */}
      <AffiliateProducts />

      {/* ── Section 7: Newsletter ── */}
      <Newsletter />
    </div>
  );
}

