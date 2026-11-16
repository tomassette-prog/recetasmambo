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

const raw = JSON.parse(fs.readFileSync("data/recipes.json", "utf8"));
const list = Array.isArray(raw) ? raw : raw.recipes;

const TEMPLATE = /^Receta de .* adaptada de Thermomix a la Cecotec Mambo Cooking Total Gourmet\.$/;
const violations = [];
const seen = new Map();
let timeWarnings = 0;

for (const r of list) {
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
