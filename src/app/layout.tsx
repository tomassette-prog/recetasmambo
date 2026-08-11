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
  title: "MamboRecetas — Recetas para Mambo Cooking Total Gourmet",
  description:
    "Recetas adaptadas de Thermomix a la Cecotec Mambo Cooking Total Gourmet. Conversión automática con tiempos, temperaturas y accesorios correctos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold tracking-tight">
              🍳 <span className="text-emerald-700">Mambo</span>Recetas
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/recetas" className="hover:text-emerald-700 transition-colors">
                Recetas
              </Link>
              <Link href="/categorias" className="hover:text-emerald-700 transition-colors">
                Categorías
              </Link>
              <Link href="/convertir" className="rounded-full bg-emerald-600 px-4 py-1.5 text-white hover:bg-emerald-700 transition-colors">
                Convertir Receta
              </Link>
            </nav>
            <Link href="/convertir" className="md:hidden rounded-full bg-emerald-600 px-3 py-1.5 text-sm text-white">
              Convertir
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-gray-600">
            <div>
              <div className="font-bold text-gray-900 mb-2">🍳 MamboRecetas</div>
              <p>Recetas adaptadas de Thermomix a la Cecotec Mambo Cooking Total Gourmet.</p>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Categorías</div>
              <ul className="space-y-1">
                {categories.slice(0, 6).map((c) => (
                  <li key={c.slug}>
                    <Link href={`/categorias/${c.slug}`} className="hover:text-emerald-700">
                      {c.icono} {c.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Herramientas</div>
              <ul className="space-y-1">
                <li><Link href="/convertir" className="hover:text-emerald-700">Convertir Receta</Link></li>
                <li><Link href="/recetas" className="hover:text-emerald-700">Todas las Recetas</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 text-center text-xs text-gray-400 py-4">
            © {new Date().getFullYear()} MamboRecetas — Recetas públicas de blogs de Thermomix adaptadas a Mambo Cooking Total Gourmet.
          </div>
        </footer>
      </body>
    </html>
  );
}
