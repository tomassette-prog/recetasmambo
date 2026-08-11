import Link from "next/link";

const PRODUCTS = [
  {
    name: "Cecotec Mambo Cooking Total Gourmet",
    description: "El robot de cocina con inducción de 1800W. 4,5L de capacidad.",
    price: "399,00 €",
    image: "🍳",
    url: "https://www.amazon.es/s?k=cecotec+mambo+cooking+total+gourmet&tag=mamborecetas-21",
  },
  {
    name: "Pala MamboMix Oficial",
    description: "Accesorio esencial para guisos, arroces y amasados.",
    price: "29,99 €",
    image: "🥄",
    url: "https://www.amazon.es/s?k=pala+mambomix&tag=mamborecetas-21",
  },
  {
    name: "Cuchillas de Repuesto Mambo",
    description: "Juego de cuchillas de acero inoxidable para tu Mambo.",
    price: "19,99 €",
    image: "🔪",
    url: "https://www.amazon.es/s?k=cuchillas+cecotec+mambo&tag=mamborecetas-21",
  },
];

export default function AffiliateProducts({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-xl border border-gray-200 p-4">
        <h4 className="font-semibold text-sm mb-3">🛒 Accesorios recomendados</h4>
        <div className="space-y-2">
          {PRODUCTS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-2 text-xs text-emerald-700 hover:underline"
            >
              <span>{p.image}</span>
              <span>{p.name}</span>
              <span className="ml-auto font-medium">{p.price}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h3 className="text-2xl font-bold mb-6">🛒 Accesorios para tu Mambo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PRODUCTS.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group rounded-xl border border-gray-200 p-5 hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">{p.image}</div>
            <h4 className="font-semibold group-hover:text-emerald-700 transition-colors">
              {p.name}
            </h4>
            <p className="text-sm text-gray-500 mt-1">{p.description}</p>
            <div className="mt-3 font-bold text-emerald-700">{p.price}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
