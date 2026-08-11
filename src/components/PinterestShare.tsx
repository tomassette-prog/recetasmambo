"use client";

import { useState } from "react";

interface PinterestShareProps {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
}

export default function PinterestShare({ slug, title, description, imageUrl }: PinterestShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://recetasmambo.com";
  const pageUrl = `${baseUrl}/recetas/${slug}`;
  const pinterestCardUrl = `${baseUrl}/images/pinterest/${slug}.png`;

  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&media=${encodeURIComponent(pinterestCardUrl)}&description=${encodeURIComponent(title + " — " + description)}`;

  return (
    <>
      {/* Floating Pinterest button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-white font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        style={{ background: "#E60023" }}
        aria-label="Guardar en Pinterest"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
        </svg>
        <span className="hidden sm:inline">Guardar en Pinterest</span>
      </button>

      {/* Preview modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsOpen(false)}>
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              aria-label="Cerrar"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold mb-4" style={{ color: "#23282A" }}>📌 Guardar en Pinterest</h3>

            {/* Preview of the Pinterest card */}
            <div className="rounded-lg overflow-hidden mb-4 border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pinterestCardUrl}
                alt={`Pin: ${title}`}
                className="w-full h-auto"
                onError={(e) => {
                  // Fallback to recipe image if Pinterest card doesn't exist
                  (e.target as HTMLImageElement).src = imageUrl;
                }}
              />
            </div>

            <p className="text-sm text-gray-600 mb-4">{title}</p>

            <a
              href={pinterestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-white font-semibold transition-colors hover:opacity-90"
              style={{ background: "#E60023" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
              </svg>
              Guardar en Pinterest
            </a>
          </div>
        </div>
      )}
    </>
  );
}
