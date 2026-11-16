#!/usr/bin/env node
// Content guard: keeps recipe descriptions honest and unique.
// Fails (exit 1) when data/recipes.json contains:
//   (a) the legacy template description ("Receta de X adaptada de Thermomix…")
//   (b) duplicated descriptions (case-insensitive)
//   (c) descriptions shorter than 80 characters
// Warns (non-fatal) on suspicious cooking times (< 5 min) for manual review.
//
// Usage: node scripts/check-content.mjs

import fs from "node:fs";
import { createHash } from "node:crypto";

const raw = JSON.parse(fs.readFileSync("data/recipes.json", "utf8"));
const list = Array.isArray(raw) ? raw : raw.recipes;

const TEMPLATE = /^Receta de .* adaptada de Thermomix a la Cecotec Mambo Cooking Total Gourmet\.$/;
const violations = [];
const seen = new Map();
const seenSlugs = new Map();
let timeWarnings = 0;

for (const r of list) {
  if (seenSlugs.has(r.slug)) {
    violations.push({ rule: `duplicated slug (also ${seenSlugs.get(r.slug)})`, slug: r.slug });
  } else {
    seenSlugs.set(r.slug, r.fuente_url || "?");
  }
  const d = (r.descripcion || "").trim();
  if (TEMPLATE.test(d)) {
    violations.push({ rule: "legacy template description", slug: r.slug });
  }
  if (d.length < 80) {
    violations.push({ rule: `description too short (${d.length})`, slug: r.slug });
  }
  const key = d.toLowerCase();
  if (seen.has(key)) {
    violations.push({ rule: `duplicated description (also ${seen.get(key)})`, slug: r.slug });
  } else {
    seen.set(key, r.slug);
  }
  if ((r.tiempo_total_min ?? 0) > 0 && r.tiempo_total_min < 5) timeWarnings++;
}

// (d) recipe images must be real and unique (no shared/fallback photos)
function walkImages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${e.name}`;
    if (e.isDirectory()) walkImages(full, acc);
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) acc.push(full);
  }
  return acc;
}
const imgHash = (p) => createHash("sha1").update(fs.readFileSync(p)).digest("hex");
const recipeImgPaths = new Set(list.map((r) => `public${r.imagen}`));
// seed recipes (src/lib/recipes-data.ts) use images that are legitimately in use
try {
  const seedSrc = fs.readFileSync("src/lib/recipes-data.ts", "utf8");
  for (const m of seedSrc.matchAll(/imagen: "([^"]+)"/g)) recipeImgPaths.add(`public${m[1]}`);
} catch {}
const byHash = new Map();
for (const f of walkImages("public/images")) {
  const h = imgHash(f);
  const g = byHash.get(h) ?? [];
  g.push(f);
  byHash.set(h, g);
}
const recipeHashes = new Map();
for (const r of list) {
  const f = `public${r.imagen}`;
  let h;
  try {
    h = imgHash(f);
  } catch {
    violations.push({ rule: "imagen no encontrada en public/", slug: r.slug });
    continue;
  }
  const prev = recipeHashes.get(h);
  if (prev) {
    violations.push({ rule: `imagen compartida con la receta ${prev}`, slug: r.slug });
  } else {
    recipeHashes.set(h, r.slug);
  }
  const external = (byHash.get(h) ?? []).filter((x) => x !== f && !recipeImgPaths.has(x));
  if (external.length > 0) {
    violations.push({ rule: `imagen idéntica a ${external[0]} (fallback de categoría)`, slug: r.slug });
  }
}

console.log("═══════════════════════════════════════════════════");
console.log("  Recetas Mambo — calidad de contenido");
console.log("═══════════════════════════════════════════════════\n");

if (timeWarnings > 0) {
  console.log(`⚠ ${timeWarnings} recetas con tiempo < 5 min (revisar datos de tiempo manualmente)`);
}

if (violations.length === 0) {
  console.log(`🎉 Contenido OK — ${list.length} descripciones únicas, sin plantillas`);
  process.exit(0);
}

console.log(`✗ ${violations.length} violaciones:\n`);
for (const v of violations.slice(0, 30)) {
  console.log(`  ✗ ${v.slug} · ${v.rule}`);
}
if (violations.length > 30) console.log(`  … y ${violations.length - 30} más`);
process.exit(1);
