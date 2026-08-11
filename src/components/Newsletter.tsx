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
    <section className="py-14 px-4" style={{ background: "var(--color-accent-light)" }}>
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-3xl mb-3">📬</div>
        <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#1a1a1a" }}>
          Recibe una receta Mambo cada semana
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Únete a +5.000 cocineros que reciben recetas adaptadas, trucos y ofertas de accesorios.
        </p>
        {status === "success" ? (
          <div className="rounded-xl p-4 text-sm font-medium" style={{ background: "#D1FAE5", color: "#065F46" }}>
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
              className="flex-1 rounded-full bg-white border border-gray-200 px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ outlineColor: "var(--color-accent)" }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full text-white font-semibold px-6 py-3 text-sm transition-colors disabled:opacity-60"
              style={{ background: "var(--color-accent)" }}
            >
              {status === "loading" ? "..." : "Suscribirme"}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="mt-2 text-sm text-red-500">{message}</p>
        )}
        <p className="mt-4 text-xs text-gray-400">Sin spam. Cancela cuando quieras.</p>
      </div>
    </section>
  );
}
