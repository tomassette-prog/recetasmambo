"use client";

import { useState } from "react";
import Link from "next/link";

type MamboStep = {
  paso_numero: number;
  instruccion: string;
  accesorio: string;
  velocidad: number | string;
  temperatura_c: number | null;
  potencia_calorifica: number | null;
  tiempo_minutos: number | null;
};

type ConvertedRecipe = {
  id: string;
  slug: string;
  titulo: string;
  ingredientes: string[];
  pasos_mambo: MamboStep[];
  fuente_url?: string;
};

export default function ConvertPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertedRecipe | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error ?? "Error al convertir la receta.");
      }

      setResult(json.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function downloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${result.titulo.replace(/\s+/g, "_")}.json`;
    a.click();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Convertir Receta</h1>
      <p className="text-gray-500 mb-8">
        Pega la URL de cualquier receta de Thermomix y la convertiremos automáticamente a los ajustes de tu <strong>Mambo Cooking Total Gourmet</strong>.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.thermorecetas.com/receta-ejemplo/"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          {loading ? "Convirtiendo..." : "Convertir"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 mb-8">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{result.titulo}</h2>
            <div className="flex gap-2">
              <button
                onClick={downloadJson}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                📥 Descargar JSON
              </button>
              <Link
                href={`/recetas/${result.slug}`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Ver Receta →
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Ingredientes</h3>
            <ul className="space-y-1">
              {result.ingredientes.map((ing, i) => (
                <li key={i} className="text-sm text-gray-600">• {ing}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Pasos adaptados a Mambo</h3>
            <div className="space-y-4">
              {result.pasos_mambo.map((paso) => (
                <div key={paso.paso_numero} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                      {paso.paso_numero}
                    </span>
                    <span className="text-sm font-medium">Paso {paso.paso_numero}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{paso.instruccion}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <div className="text-gray-400">Accesorio</div>
                      <div className="font-medium">{paso.accesorio}</div>
                    </div>
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <div className="text-gray-400">Velocidad</div>
                      <div className="font-medium">{String(paso.velocidad)}</div>
                    </div>
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <div className="text-gray-400">Potencia</div>
                      <div className="font-medium">{paso.potencia_calorifica ?? "—"}</div>
                    </div>
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <div className="text-gray-400">Tiempo</div>
                      <div className="font-medium">{paso.tiempo_minutos ? `${paso.tiempo_minutos} min` : "—"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
