import Link from "next/link";

const PRODUCTS = [
  {
    name: "Cecotec Mambo Cooking Total Gourmet",
    description: "El robot de cocina con inducción de 1800W. 4,5L de capacidad.",
    price: "399,00 €",
    image: "🍳",
    url: "https://www.amazon.es/s?k=cecotec+mambo+cooking+total+gourmet&tag=biohackdose-21",
  },
  {
    name: "Pala MamboMix Oficial",
    description: "Accesorio esencial para guisos, arroces y amasados.",
    price: "29,99 €",
    image: "🥄",
    url: "https://www.amazon.es/s?k=pala+mambomix&tag=biohackdose-21",
  },
  {
    name: "Cuchillas de Repuesto Mambo",
    description: "Juego de cuchillas de acero inoxidable para tu Mambo.",
    price: "19,99 €",
    image: "🔪",
    url: "https://www.amazon.es/s?k=cuchillas+cecotec+mambo&tag=biohackdose-21",
  },
];

export default function AffiliateProducts({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h4 className="font-semibold text-sm mb-4" style={{ color: "#23282A" }}>🛒 Accesorios recomendados</h4>
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
              <span className="font-semibold" style={{ color: "#00AC46" }}>{p.price}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6" style={{ background: "#f5f5f5" }}>
      <div className="mx-auto max-w-7xl">
        <div className="section-header">
          <h3 className="section-title mb-0">🛒 Accesorios para tu Mambo</h3>
        </div>
        <div className="carousel">
          {PRODUCTS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="product-card carousel-item block"
            >
              <div className="text-4xl mb-3">{p.image}</div>
              <h4 className="font-semibold text-sm mb-1" style={{ color: "#23282A" }}>{p.name}</h4>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: "#00AC46" }}>{p.price}</span>
                <span className="text-xs font-medium text-white rounded-md px-3 py-1" style={{ background: "#00AC46" }}>
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
