import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { categories } from "@/lib/recipes-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recetas Mambo — Recetas para Mambo Cooking Total Gourmet",
  description:
    "Recetas adaptadas de Thermomix a la Cecotec Mambo Cooking Total Gourmet. Conversión automática con tiempos, temperaturas y accesorios correctos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-gray-900">
        {/* Header */}
        <header className="site-header">
          <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="text-2xl">🍳</span>
              <span>Recetas <span style={{ color: "var(--color-accent)" }}>Mambo</span></span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <Link href="/recetas" className="hover:text-gray-900 transition-colors">
                Recetas
              </Link>
              <Link href="/categorias" className="hover:text-gray-900 transition-colors">
                Categorías
              </Link>
              <Link href="/convertir" className="rounded-full px-5 py-2 text-white font-semibold transition-colors" style={{ background: "var(--color-accent)" }}>
                Convertir Receta
              </Link>
            </nav>
            <Link href="/convertir" className="md:hidden rounded-full px-3 py-1.5 text-sm text-white font-medium" style={{ background: "var(--color-accent)" }}>
              Convertir
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10 text-sm">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
                <span className="text-xl">🍳</span> Recetas Mambo
              </div>
              <p className="text-gray-400 leading-relaxed">
                Recetas públicas de blogs de Thermomix adaptadas automáticamente a la Cecotec Mambo Cooking Total Gourmet.
              </p>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Categorías</div>
              <ul className="space-y-2">
                {categories.slice(0, 6).map((c) => (
                  <li key={c.slug}>
                    <Link href={`/categorias/${c.slug}`} className="text-gray-400 hover:text-white transition-colors">
                      {c.icono} {c.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Herramientas</div>
              <ul className="space-y-2">
                <li><Link href="/convertir" className="text-gray-400 hover:text-white transition-colors">Convertir Receta</Link></li>
                <li><Link href="/recetas" className="text-gray-400 hover:text-white transition-colors">Todas las Recetas</Link></li>
                <li><Link href="/categorias" className="text-gray-400 hover:text-white transition-colors">Explorar Categorías</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 text-center text-xs text-gray-500 py-5">
            © {new Date().getFullYear()} Recetas Mambo. Todos los derechos reservados.
          </div>
        </footer>
      </body>
    </html>
  );
}
