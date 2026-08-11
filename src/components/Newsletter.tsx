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
    <section className="newsletter-section">
      <div className="mx-auto max-w-2xl">
        <div className="text-3xl mb-3">📬</div>
        <h3>Recibe una receta Mambo cada semana</h3>
        <p>
          Únete a +5.000 cocineros que reciben recetas adaptadas, trucos y ofertas de accesorios.
        </p>
        {status === "success" ? (
          <div className="rounded-lg p-4 text-sm font-medium bg-white/20 text-white">
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
              className="flex-1 rounded-md bg-white border-0 px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-md bg-white text-sm font-semibold px-6 py-3 transition-colors disabled:opacity-60"
              style={{ color: "#00AC46" }}
            >
              {status === "loading" ? "..." : "Suscribirme"}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="mt-2 text-sm text-white/80">{message}</p>
        )}
        <p className="mt-4 text-xs text-white/60">Sin spam. Cancela cuando quieras.</p>
      </div>
    </section>
  );
}
