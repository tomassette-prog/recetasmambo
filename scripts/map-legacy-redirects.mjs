#!/usr/bin/env node
/**
 * map-legacy-redirects.mjs — genera src/lib/legacy-redirects.json (roadmap 2.2)
 *
 * Cruza las URLs legacy de WordPress (cosecha de Wayback CDX congelada en
 * scripts/legacy-urls-2026-11.txt) con el sitemap actual de recetasmambo.com y
 * produce el mapa de redirects para next.config.ts.
 *
 * Reglas de mapeo:
 *   1. Receta legacy /<cat>/<slug>/   -> /recetas/<match> (slug exacto o
 *      sufijo -mambo) o override revisado. Sin equivalente claro -> /
 *      (sancionado por el ROADMAP 2.2: "o a la home si no existe").
 *   2. Archivo de categoría legacy   -> /categorias/<cat> (tabla) o /categorias.
 *   3. /category/<slug>/ (WP)        -> /categorias/<cat> (tabla) o /categorias.
 *   4. Página suelta legacy          -> equivalente actual (tabla) o /.
 *   5. Plumbing WP (/tag/, /wp-json/, /wp-content/) -> wildcards al final.
 *   6. /.well-known/ y assets vivos (favicon, robots) -> sin redirect.
 *
 * Uso: node scripts/map-legacy-redirects.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs";

const SITEMAP_URL = "https://recetasmambo.com/sitemap.xml";
const LEGACY_FILE = new URL("./legacy-urls-2026-11.txt", import.meta.url);
const OUT_FILE = new URL("../src/lib/legacy-redirects.json", import.meta.url);
const DRY = process.argv.includes("--dry-run");

const stripTrailing = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
const pathOf = (raw) => {
  try {
    return stripTrailing(decodeURI(new URL(raw).pathname));
  } catch {
    return null;
  }
};

// ── 1. URLs legacy (cosecha congelada) ──────────────────────────────────────
const legacyPaths = new Set();
for (const line of readFileSync(LEGACY_FILE, "utf8").split(/\r?\n/)) {
  const p = pathOf(line.trim());
  if (p && p !== "/") legacyPaths.add(p);
}

// ── 2. slugs actuales del sitemap ───────────────────────────────────────────
const sitemap = await (await fetch(SITEMAP_URL)).text();
const recipeSlugs = new Set([...sitemap.matchAll(/\/recetas\/([^<]+)/g)].map((m) => m[1]));
const categorySlugs = new Set([...sitemap.matchAll(/\/categorias\/([^<]+)/g)].map((m) => m[1]));

// ── 3. tablas de mapeo (revisadas a mano sobre la cosecha) ──────────────────
const CATEGORY_MAP = {
  // archivos de categoría legacy (raíz del WP)
  "/bebida-y-coctel-con-mambo": "/categorias/bebidas",
  "/carne-con-mambo": "/categorias/carnes",
  "/legumbres-y-verduras-con-mambo": "/categorias/legumbres",
  "/mariscos-y-pescado-con-mambo": "/categorias/pescados",
  "/masas-y-pan-con-mambo": "/categorias/panes-masas",
  "/pastas-y-arroz-con-mambo": "/categorias/arroces",
  "/postres-con-mambo": "/categorias/postres",
  "/salsas-con-mambo": "/categorias/salsas",
  "/sopas-y-cremas-con-mambo": "/categorias/sopas-y-cremas",
  "/confituras-y-conservas-con-mambo": "/categorias",
  // taxonomía WP /category/<slug>
  "/category/carne-con-mambo": "/categorias/carnes",
  "/category/cerdo": "/categorias/carnes",
  "/category/pollo": "/categorias/carnes",
  "/category/vacuno": "/categorias/carnes",
  "/category/pescados": "/categorias/pescados",
  "/category/mariscos-y-pescado-con-mambo": "/categorias/pescados",
  "/category/masas": "/categorias/panes-masas",
  "/category/pan": "/categorias/panes-masas",
  "/category/masas-y-pan-con-mambo": "/categorias/panes-masas",
  "/category/pastas": "/categorias/arroces",
  "/category/pastas-y-arroz-con-mambo": "/categorias/arroces",
  "/category/postres-con-mambo": "/categorias/postres",
  "/category/postres-faciles": "/categorias/postres",
  "/category/postres-fruta": "/categorias/postres",
  "/category/verduras": "/categorias/verduras",
  "/category/legumbres-y-verduras-con-mambo": "/categorias/legumbres",
  "/category/platos-de-cuchara": "/categorias",
  "/category/non-classe": "/categorias",
};

const STATIC_MAP = {
  "/contacto": "/",
  "/sobre-nosotros": "/",
  "/mambo-cecotec": "/",
  "/politica-de-cookies": "/cookies",
  "/politica-privadidad": "/privacidad",
  "/aviso-legal": "/aviso-legal",
  "/sitemap_index.xml": "/sitemap.xml",
  "/page-sitemap.xml": "/sitemap.xml",
  "/post-sitemap.xml": "/sitemap.xml",
  "/ads.txt": "/",
  "/app-ads.txt": "/",
};

// Overrides revisados uno a uno: slug legacy -> destino cuando el match
// automático falla pero el plato es el mismo. El resto sin equivalente va a /.
const RECIPE_OVERRIDES = {
  "/postres-con-mambo/bizcocho-de-yogur": "/recetas/bizcocho-de-yogur-mambo",
  "/legumbres-y-verduras-con-mambo/lentejas-con-mambo": "/recetas/lentejas-mambo",
  "/sopas-y-cremas-con-mambo/crema-de-calabaza-y-zanahoria": "/recetas/crema-de-calabaza",
  "/carne-con-mambo/alitas-de-pollo-con-mambo": "/recetas/alitas-de-pollo-con-salsa-de-caramelo",
  "/legumbres-y-verduras-con-mambo/potaje-de-garbanzos": "/recetas/potaje-de-garbanzos-y-acelgas",
};

const LEGACY_CATS = new Set(
  Object.keys(CATEGORY_MAP).filter((k) => !k.startsWith("/category/"))
);

function matchRecipe(slug) {
  const base = slug.replace(/-con-mambo$/, "");
  for (const cand of [slug, base, `${base}-mambo`, `${slug}-mambo`]) {
    if (recipeSlugs.has(cand)) return `/recetas/${cand}`;
  }
  return null;
}

// ── 4. clasificación ────────────────────────────────────────────────────────
const entries = [];
const unmatched = [];
const stats = { overrides: 0, exact: 0, categories: 0, statics: 0, home: 0, skipped: 0 };

for (const p of [...legacyPaths].sort()) {
  const segs = p.split("/").filter(Boolean);

  if (STATIC_MAP[p]) { entries.push([p, STATIC_MAP[p]]); stats.statics++; continue; }
  if (CATEGORY_MAP[p]) { entries.push([p, CATEGORY_MAP[p]]); stats.categories++; continue; }

  // plumbing WP -> wildcards al final; protocolo y assets vivos -> sin redirect
  if (/^\/(wp-content|wp-json|tag|category)(\/|$)/.test(p)) continue;
  if (p.startsWith("/.well-known")) { stats.skipped++; continue; }
  if (/\.(jpe?g|png|gif|webp|svg|css|js|woff2?|ttf|eot)$/i.test(p)) { stats.skipped++; continue; }
  if (p === "/favicon.ico" || p === "/robots.txt" || p === "/sitemap.xml") { stats.skipped++; continue; }

  if (segs.length === 2 && LEGACY_CATS.has(`/${segs[0]}`)) {
    const dest = RECIPE_OVERRIDES[p] ?? matchRecipe(segs[1]);
    entries.push([p, dest ?? "/"]);
    if (RECIPE_OVERRIDES[p]) stats.overrides++;
    else if (dest) stats.exact++;
    else { stats.home++; unmatched.push(p); }
    continue;
  }

  entries.push([p, "/"]);
  stats.home++;
  unmatched.push(p);
}

// wildcards de plumbing WP (siempre al final: Next evalúa en orden)
entries.push(["/tag/:path*", "/"]);
entries.push(["/category/:path*", "/categorias"]);
entries.push(["/wp-json/:path*", "/"]);
entries.push(["/wp-content/:path*", "/"]);

// ── 5. salida ───────────────────────────────────────────────────────────────
const redirects = entries.map(([source, destination]) => ({ source, destination }));

console.log(`URLs legacy: ${legacyPaths.size} · recetas actuales: ${recipeSlugs.size} · categorías actuales: ${categorySlugs.size}`);
console.log(`redirects: ${redirects.length} (exactos ${stats.exact} · overrides ${stats.overrides} · categorías ${stats.categories} · estáticas ${stats.statics} · a home ${stats.home} · wildcards 4 · sin redirect ${stats.skipped})`);
if (unmatched.length) {
  console.log(`\nSin equivalente (a home) — revisar cuando lleguen los datos de GSC:`);
  for (const p of unmatched) console.log(`  ${p}`);
}

if (DRY) {
  console.log("\n[dry-run] nada escrito");
} else {
  writeFileSync(OUT_FILE, JSON.stringify(redirects, null, 2) + "\n", "utf8");
  console.log(`\nEscrito ${OUT_FILE.pathname}`);
}
