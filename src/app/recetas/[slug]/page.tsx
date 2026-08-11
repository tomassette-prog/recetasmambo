import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllRecipes, getRecipeBySlug } from "@/lib/store";
import { categories } from "@/lib/recipes-data";
import AffiliateProducts from "@/components/AffiliateProducts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllRecipes().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return { title: "Receta no encontrada" };
  return {
    title: `${recipe.titulo} — MamboRecetas`,
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

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-emerald-600">Inicio</Link>
          <span className="mx-2">→</span>
          <Link href="/recetas" className="hover:text-emerald-600">Recetas</Link>
          {cat && (
            <>
              <span className="mx-2">→</span>
              <Link href={`/categorias/${cat.slug}`} className="hover:text-emerald-600">
                {cat.nombre}
              </Link>
            </>
          )}
          <span className="mx-2">→</span>
          <span className="text-gray-600">{recipe.titulo}</span>
        </nav>

        {/* Hero image */}
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <Image
            src={recipe.imagen}
            alt={recipe.titulo}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
          {recipe.destacada && (
            <span className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
              ⭐ Destacada
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">{recipe.titulo}</h1>
        <p className="text-gray-500 mb-6">{recipe.descripcion}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mb-8 text-sm">
          <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">⏱ {recipe.tiempo_total_min} min</span>
          <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1">👥 {recipe.comensales} comensales</span>
          <span className="rounded-full bg-orange-50 text-orange-700 px-3 py-1">📊 {recipe.dificultad}</span>
          <span className="rounded-full bg-gray-100 text-gray-600 px-3 py-1">🍳 Mambo Cooking Total Gourmet</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ingredientes */}
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold mb-4">Ingredientes</h2>
            <ul className="space-y-2">
              {recipe.ingredientes.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Pasos */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Preparación en Mambo</h2>
            <div className="space-y-6">
              {recipe.pasos_mambo.map((paso) => (
                <div key={paso.paso_numero} className="rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold">
                      {paso.paso_numero}
                    </span>
                    <span className="text-sm text-gray-400">Paso {paso.paso_numero}</span>
                  </div>
                  <p className="text-gray-700 mb-4">{paso.instruccion}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <div className="text-gray-400">Accesorio</div>
                      <div className="font-medium">{paso.accesorio}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <div className="text-gray-400">Velocidad</div>
                      <div className="font-medium">{String(paso.velocidad)}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <div className="text-gray-400">Potencia</div>
                      <div className="font-medium">{paso.potencia_calorifica ?? "—"}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <div className="text-gray-400">Temperatura</div>
                      <div className="font-medium">{paso.temperatura_c ? `${paso.temperatura_c} °C` : "—"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accesorios afiliados */}
        <div className="mt-10">
          <AffiliateProducts compact />
        </div>

        {/* Fuente */}
        {recipe.fuente_url && (
          <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-400">
            Receta original: <a href={recipe.fuente_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{recipe.fuente_url}</a>
          </div>
        )}
      </div>
    </>
  );
}
