"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (json.ok) {
        setStatus("success");
        setMessage(json.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(json.error);
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión.");
    }
  }

  return (
    <section className="bg-emerald-700 text-white py-12 px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="text-2xl font-bold mb-2">
          📬 Recibe una receta Mambo cada semana
        </h3>
        <p className="text-emerald-100 mb-6">
          Únete a +5.000 cocineros que reciben recetas adaptadas, trucos y ofertas de accesorios.
        </p>
        {status === "success" ? (
          <div className="rounded-lg bg-emerald-600 p-4 text-sm">
            ✅ {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="flex-1 rounded-full px-5 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-white text-emerald-700 font-semibold px-6 py-3 text-sm hover:bg-emerald-50 transition-colors disabled:opacity-60"
            >
              {status === "loading" ? "..." : "Suscribirme"}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="mt-2 text-sm text-red-200">{message}</p>
        )}
      </div>
    </section>
  );
}
