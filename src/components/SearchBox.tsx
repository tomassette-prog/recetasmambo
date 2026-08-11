"use client";

import { useState } from "react";
import Link from "next/link";

type Result = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  tiempo_total_min: number;
  comensales: number;
};

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) setResults([]);
          }}
          placeholder="Buscar recetas, ingredientes..."
          className="flex-1 rounded-md border border-gray-300 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AC46]"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary rounded-md px-6 py-3 text-sm"
        >
          {loading ? "..." : "Buscar"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-4 max-w-md bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/recetas/${r.slug}`}
              className="block px-4 py-3 hover:bg-[#e6f7ed] transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-sm">{r.titulo}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                ⏱ {r.tiempo_total_min} min · 👥 {r.comensales} pax
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
