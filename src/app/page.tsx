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
      <section className="bg-gradient-to-br from-emerald-50 to-teal-100 py-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            🍳 Recetas para tu <span className="text-emerald-700">Mambo</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Recetas de Thermomix adaptadas automáticamente a la <strong>Cecotec Mambo Cooking Total Gourmet</strong>.
            Tiempos, temperaturas, accesorios y potencia calórica correctos.
          </p>
          <SearchBox />
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Categorías</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categorias/${c.slug}`}
              className="rounded-xl border border-gray-200 p-4 text-center hover:border-emerald-400 hover:shadow-sm transition-all"
            >
              <div className="text-3xl mb-1">{c.icono}</div>
              <div className="text-sm font-medium">{c.nombre}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacadas */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold mb-6">⭐ Recetas Destacadas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}

      {/* Todas */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Últimas Recetas</h2>
          <Link href="/recetas" className="text-sm text-emerald-600 hover:underline">
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
      <section className="bg-emerald-600 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">¿Tienes una receta de Thermomix?</h2>
        <p className="text-emerald-100 mb-6 max-w-lg mx-auto">
          Pega la URL y la convertimos automáticamente a los ajustes de tu Mambo Cooking Total Gourmet.
        </p>
        <Link
          href="/convertir"
          className="inline-block rounded-full bg-white text-emerald-700 font-semibold px-8 py-3 hover:bg-emerald-50 transition-colors"
        >
          Convertir Receta →
        </Link>
      </section>
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: (typeof allRecipes)[0] }) {
  return (
    <Link
      href={`/recetas/${recipe.slug}`}
      className="group rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative h-48 bg-gray-100">
        {recipe.imagen ? (
          <Image
            src={recipe.imagen}
            alt={recipe.titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">🍳</div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-emerald-600 font-medium mb-1">
          {categories.find((c) => c.slug === recipe.categoria)?.icono}{" "}
          {categories.find((c) => c.slug === recipe.categoria)?.nombre}
        </div>
        <h3 className="font-semibold text-lg mb-1 group-hover:text-emerald-700 transition-colors">
          {recipe.titulo}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">{recipe.descripcion}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span>⏱ {recipe.tiempo_total_min} min</span>
          <span>👥 {recipe.comensales} pax</span>
          <span>📊 {recipe.dificultad}</span>
        </div>
      </div>
    </Link>
  );
}

