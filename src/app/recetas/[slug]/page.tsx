import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRecipes, getRecipeBySlug } from "@/lib/store";
import { categories } from "@/lib/recipes-data";
import AffiliateProducts from "@/components/AffiliateProducts";
import PinterestShare from "@/components/PinterestShare";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllRecipes().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return { title: "Receta no encontrada" };
  return {
    title: `${recipe.titulo} — Recetas Mambo`,
    description: recipe.descripcion,
    openGraph: {
      title: recipe.titulo,
      description: recipe.descripcion,
      images: [recipe.imagen],
    },
  };
}

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return notFound();

  const cat = categories.find((c) => c.slug === recipe.categoria);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.titulo,
    description: recipe.descripcion,
    image: recipe.imagen,
    recipeCategory: cat?.nombre,
    recipeCuisine: "Española",
    keywords: `Mambo, Cooking Total Gourmet, ${recipe.titulo}`,
    recipeYield: `${recipe.comensales} personas`,
    totalTime: `PT${recipe.tiempo_total_min}M`,
    recipeIngredient: recipe.ingredientes,
    recipeInstructions: recipe.pasos_mambo.map((s) => ({
      "@type": "HowToStep",
      text: s.instruccion,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero image — full width */}
      <div className="hero-banner" style={{ height: 380 }}>
        {recipe.imagen ? (
          <Image
            src={recipe.imagen}
            alt={recipe.titulo}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: "#f5f5f5" }}>{cat?.icono ?? "🍽️"}</div>
        )}
        <div className="hero-banner-content mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav className="breadcrumb mb-3 text-white/70">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span className="separator mx-1">›</span>
            <Link href="/recetas" className="hover:text-white">Recetas</Link>
            {cat && (
              <>
                <span className="separator mx-1">›</span>
                <Link href={`/categorias/${cat.slug}`} className="hover:text-white">{cat.nombre}</Link>
              </>
            )}
          </nav>
          <h1 className="text-3xl md:text-4xl lg:text-5xl text-white mb-2" style={{ fontWeight: 400 }}>{recipe.titulo}</h1>
          <p className="text-sm text-white/80 max-w-2xl">{recipe.descripcion}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Meta info bar — Cookidoo style */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
            🍳 Mambo Cooking Total Gourmet
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
            ⏱ {recipe.tiempo_total_min} min
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
            👥 {recipe.comensales} comensales
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
            {recipe.dificultad === "Fácil" ? "🟢" : recipe.dificultad === "Media" ? "🟡" : "🔴"} {recipe.dificultad}
          </span>
          {cat && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: "#e6f7ed", color: "#00AC46" }}>
              {cat.icono} {cat.nombre}
            </span>
          )}
        </div>

        {/* Two-column: ingredients + steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ingredients sidebar — Cookidoo style */}
          <div className="md:col-span-1">
            <div className="ingredients-sidebar sticky top-20">
              <h2 className="text-lg mb-4" style={{ fontWeight: 500, color: "#23282A" }}>Ingredientes</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs text-gray-400 mb-3">Para {recipe.comensales} comensales</p>
                <ul className="space-y-3">
                  {recipe.ingredientes.map((ing, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: "#23282A" }}>
                      <span className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0" style={{ background: "#00AC46" }} />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Steps — Cookidoo detailed format */}
          <div className="md:col-span-2">
            <h2 className="text-lg mb-5" style={{ fontWeight: 500, color: "#23282A" }}>Preparación</h2>
            <div className="space-y-6">
              {recipe.pasos_mambo.map((paso) => (
                <div key={paso.paso_numero} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  {/* Step header */}
                  <div className="flex items-center gap-4 px-5 py-4" style={{ background: "#f8faf8" }}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full text-white text-base font-bold" style={{ background: "#00AC46" }}>
                      {paso.paso_numero}
                    </span>
                    <div className="flex-1">
                      <p className="text-[15px] leading-relaxed" style={{ color: "#23282A", fontWeight: 500 }}>
                        {paso.instruccion}
                      </p>
                    </div>
                  </div>
                  {/* Mambo settings — clean grid like Cookidoo */}
                  <div className="grid grid-cols-5 divide-x divide-gray-100 border-t border-gray-100">
                    <div className="px-3 py-3 text-center">
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Accesorio</div>
                      <div className="text-sm font-medium" style={{ color: "#23282A" }}>
                        {paso.accesorio === "Pala MamboMix" ? "🥄 Pala" : paso.accesorio === "Cuchillas" ? "🔪 Cuchillas" : "—"}
                      </div>
                    </div>
                    <div className="px-3 py-3 text-center">
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Velocidad</div>
                      <div className="text-sm font-medium" style={{ color: "#23282A" }}>
                        {paso.velocidad === "Turbo" ? "⚡ Turbo" : paso.velocidad}
                      </div>
                    </div>
                    <div className="px-3 py-3 text-center">
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Potencia</div>
                      <div className="text-sm font-medium" style={{ color: "#23282A" }}>
                        {paso.potencia_calorifica ?? "—"}
                      </div>
                    </div>
                    <div className="px-3 py-3 text-center">
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Temperatura</div>
                      <div className="text-sm font-medium" style={{ color: "#23282A" }}>
                        {paso.temperatura_c ? `${paso.temperatura_c}°C` : "—"}
                      </div>
                    </div>
                    <div className="px-3 py-3 text-center">
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Tiempo</div>
                      <div className="text-sm font-medium" style={{ color: "#00AC46" }}>
                        {paso.tiempo_minutos ? `${paso.tiempo_minutos} min` : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Affiliate sidebar at bottom */}
        <div className="mt-12">
          <AffiliateProducts compact />
        </div>

        {/* Fuente */}
        {recipe.fuente_url && (
          <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-400">
            Receta original:{" "}
            <a href={recipe.fuente_url} target="_blank" rel="noopener noreferrer" style={{ color: "#00AC46" }} className="hover:underline">
              {recipe.fuente_url}
            </a>
          </div>
        )}
      </div>

      {/* Pinterest Share floating button */}
      <PinterestShare
        slug={recipe.slug}
        title={recipe.titulo}
        description={recipe.descripcion}
        imageUrl={recipe.imagen}
      />
    </>
  );
}
