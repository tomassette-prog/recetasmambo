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
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="font-semibold text-sm mb-4">🛒 Accesorios recomendados</h4>
        <div className="space-y-3">
          {PRODUCTS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-3 text-sm hover:opacity-80 transition-opacity"
            >
              <span className="text-xl">{p.image}</span>
              <span className="flex-1 text-gray-700 font-medium">{p.name}</span>
              <span className="font-semibold" style={{ color: "var(--color-accent)" }}>{p.price}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6" style={{ background: "#faf7f2" }}>
      <div className="mx-auto max-w-7xl">
        <h3 className="text-xl font-bold mb-6">🛒 Accesorios para tu Mambo</h3>
        <div className="scroll-row">
          {PRODUCTS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="product-card block"
            >
              <div className="text-4xl mb-3">{p.image}</div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">{p.name}</h4>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: "var(--color-accent)" }}>{p.price}</span>
                <span className="text-xs font-medium text-white rounded-full px-3 py-1" style={{ background: "var(--color-accent)" }}>
                  Ver en Amazon
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
