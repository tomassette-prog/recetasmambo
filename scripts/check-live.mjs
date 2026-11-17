#!/usr/bin/env node
// Verificación post-despliegue (roadmap 2.3): sondea URLs en vivo tras cada
// `npx vercel --prod --yes` y comprueba también una muestra de redirects
// legacy (roadmap 2.2).
//
// Por página: HTTP 200, canonical autorreferente, un solo <h1>, JSON-LD
// válido, <img src> locales accesibles, sin marcadores pendientes.
// Por URL legacy: 3xx con Location esperado.
//
// Uso: node scripts/check-live.mjs [path ...]

const BASE = "https://recetasmambo.com";

const DEFAULT_PATHS = [
  "/",
  "/recetas",
  "/categorias",
  "/categorias/carnes",
  "/recetas/agua-de-valencia",
  "/recetas/lentejas-mambo",
];

// Muestra representativa del mapa src/lib/legacy-redirects.json: receta,
// categoría, taxonomía WP, tag, página suelta, sitemap viejo y asset muerto.
const REDIRECT_CHECKS = [
  ["/bebida-y-coctel-con-mambo/agua-de-valencia-con-mambo/", "/recetas/agua-de-valencia"],
  ["/postres-con-mambo/bizcocho-de-yogur/", "/recetas/bizcocho-de-yogur-mambo"],
  ["/carne-con-mambo/alitas-de-pollo-con-mambo/", "/recetas/alitas-de-pollo-con-salsa-de-caramelo"],
  ["/postres-con-mambo/", "/categorias/postres"],
  ["/category/pollo/", "/categorias/carnes"],
  ["/tag/pan/", "/"],
  ["/contacto/", "/"],
  ["/sitemap_index.xml", "/sitemap.xml"],
  ["/wp-content/uploads/2021/01/alitas-de-pollo.jpg", "/"],
];

const MARKERS = ["VERIFICAR_ASIN", "IMAGEN PENDIENTE", "TODO imagen"];

const norm = (p) => (p.replace(/\/+$/, "") || "/");

let failures = 0;

for (const p of DEFAULT_PATHS) {
  const url = BASE + p;
  const problems = [];
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (res.status !== 200) problems.push(`HTTP ${res.status}`);
    const html = await res.text();

    const canonical = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/.exec(html);
    if (!canonical) problems.push("sin canonical");
    else if (norm(canonical[1]) !== norm(url)) problems.push(`canonical != URL (${canonical[1]})`);

    const h1s = html.match(/<h1[\s>]/g) || [];
    if (h1s.length !== 1) problems.push(`${h1s.length} <h1>`);

    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(m[1]);
      } catch {
        problems.push("JSON-LD inválido");
      }
    }

    const imgs = [...html.matchAll(/<img[^>]+src="(\/[^"]+)"/g)].slice(0, 30);
    for (const m of imgs) {
      let src = m[1].replace(/&amp;/g, "&");
      if (src.startsWith("/_next/image")) {
        const u = new URL(src, BASE).searchParams.get("url");
        if (u) src = u;
      }
      const img = await fetch(BASE + src, { method: "HEAD" });
      if (img.status >= 400) problems.push(`imagen rota ${src} (${img.status})`);
    }

    for (const marker of MARKERS) {
      if (html.includes(marker)) problems.push(`marcador pendiente en HTML: "${marker}"`);
    }
  } catch (err) {
    problems.push(`fetch: ${err.message}`);
  }

  if (problems.length === 0) {
    console.log(`OK  ${p}`);
  } else {
    failures++;
    console.log(`FAIL ${p}`);
    for (const problem of problems) console.log(`   - ${problem}`);
  }
}

for (const [src, expected] of REDIRECT_CHECKS) {
  const problems = [];
  try {
    // WordPress usa URLs con barra final: Next normaliza /x/ -> /x antes del
    // redirect del mapa, así que se valida el destino FINAL de la cadena.
    const res = await fetch(BASE + src, { redirect: "follow" });
    if (!res.redirected) problems.push(`sin redirect (HTTP ${res.status})`);
    if (res.status !== 200) problems.push(`HTTP final ${res.status}`);
    const finalPath = norm(new URL(res.url).pathname);
    if (finalPath !== norm(expected)) problems.push(`destino final ${finalPath} (esperado ${expected})`);
  } catch (err) {
    problems.push(`fetch: ${err.message}`);
  }

  if (problems.length === 0) {
    console.log(`OK  ${src} -> ${expected}`);
  } else {
    failures++;
    console.log(`FAIL ${src}`);
    for (const problem of problems) console.log(`   - ${problem}`);
  }
}

console.log(failures === 0 ? "\nLive check OK" : `\n${failures} URL(s) con problemas`);
process.exit(failures === 0 ? 0 : 1);
