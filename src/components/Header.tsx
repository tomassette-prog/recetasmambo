"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/recetas", label: "Recetas" },
  { href: "/categorias", label: "Categorías" },
  { href: "/convertir", label: "Convertir Receta" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Left: Menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#00AC46] transition-colors"
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="hidden sm:inline">Menú</span>
          </button>

          {/* Center: Brand */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-xl leading-none mb-0.5">🍳</span>
            <span className="text-base sm:text-lg font-bold tracking-tight leading-tight" style={{ color: "#23282A" }}>
              Mambo Cooking Total Gourmet
            </span>
            <span className="text-[10px] sm:text-xs text-gray-400 font-normal tracking-wide">
              Recetas Thermomix adaptadas
            </span>
          </Link>

          {/* Right: Convertir CTA */}
          <Link href="/convertir" className="btn-primary text-xs sm:text-sm px-3 sm:px-5 py-2">
            Convertir
          </Link>
        </div>
      </header>

      {/* Sidebar overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          {/* Sidebar */}
          <nav className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-[#23282A]">Menú</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Cerrar menú"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 py-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-5 py-3 text-[15px] text-[#23282A] hover:bg-gray-50 hover:text-[#00AC46] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <Link
                href="/convertir"
                onClick={() => setMenuOpen(false)}
                className="btn-primary block text-center text-sm py-2.5"
              >
                Convertir Receta Thermomix → Mambo
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
