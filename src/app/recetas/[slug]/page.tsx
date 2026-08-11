import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRecipes, getRecipeBySlug } from "@/lib/store";
import { categories } from "@/lib/recipes-data";
import AffiliateProducts from "@/components/AffiliateProducts";

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
      <div className="relative w-full h-64 md:h-96">
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
          <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: categoryColors[recipe.categoria] ?? "#F5F5F5" }}>{cat?.icono ?? "🍽️"}</div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-6 md:pb-8 mx-auto max-w-7xl">
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{recipe.titulo}</h1>
          <p className="text-sm text-gray-200 max-w-2xl">{recipe.descripcion}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Meta info bar */}
        <div className="recipe-info-bar">
          <span className="recipe-info-pill">⏱ {recipe.tiempo_total_min} min</span>
          <span className="recipe-info-pill">👥 {recipe.comensales} comensales</span>
          <span className="recipe-info-pill">📊 {recipe.dificultad}</span>
          {cat && <span className="recipe-info-pill">{cat.icono} {cat.nombre}</span>}
          <span className="recipe-info-pill">🍳 Mambo Cooking Total Gourmet</span>
          {recipe.destacada && <span className="recipe-info-pill" style={{ background: "#FEF3C7", color: "#92400E" }}>⭐ Destacada</span>}
        </div>

        {/* Two-column: ingredients + steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          {/* Ingredients sidebar */}
          <div className="md:col-span-1">
            <div className="ingredients-sidebar">
              <h2 className="text-xl font-bold mb-4">Ingredientes</h2>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <ul className="space-y-3">
                  {recipe.ingredientes.map((ing, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0" style={{ background: "var(--color-accent)" }} />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Steps main content */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-5">Preparación en Mambo</h2>
            <div className="space-y-5">
              {recipe.pasos_mambo.map((paso) => (
                <div key={paso.paso_numero} className="step-card">
                  <div className="flex items-start gap-4 mb-3">
                    <span className="step-number">{paso.paso_numero}</span>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed">{paso.instruccion}</p>
                    </div>
                  </div>
                  <div className="step-mambo-grid">
                    <div className="step-mambo-cell">
                      <div className="label">Accesorio</div>
                      <div className="value">{paso.accesorio}</div>
                    </div>
                    <div className="step-mambo-cell">
                      <div className="label">Velocidad</div>
                      <div className="value">{String(paso.velocidad)}</div>
                    </div>
                    <div className="step-mambo-cell">
                      <div className="label">Potencia</div>
                      <div className="value">{paso.potencia_calorifica ?? "—"}</div>
                    </div>
                    <div className="step-mambo-cell">
                      <div className="label">Temperatura</div>
                      <div className="value">{paso.temperatura_c ? `${paso.temperatura_c} °C` : "—"}</div>
                    </div>
                    <div className="step-mambo-cell">
                      <div className="label">Tiempo</div>
                      <div className="value">{paso.tiempo_minutos ? `${paso.tiempo_minutos} min` : "—"}</div>
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
            <a href={recipe.fuente_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }} className="hover:underline">
              {recipe.fuente_url}
            </a>
          </div>
        )}
      </div>
    </>
  );
}
