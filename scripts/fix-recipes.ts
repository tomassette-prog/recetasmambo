#!/usr/bin/env node
/**
 * Fix script: cleans encoding/HTML artifacts and re-converts every step
 * through the shared conversion engine (src/lib/convert.ts), then
 * re-categorizes recipes.
 *
 * Conversion rules live ONLY in src/lib/convert.ts — this script is a thin
 * pipeline wrapper. See docs/CONVERSION-THERMOMIX-MAMBO.md.
 *
 * Usage: npx tsx scripts/fix-recipes.ts
 */

import fs from "node:fs";
import path from "node:path";
import {
  clasificarCategoria,
  cleanText,
  convertStep,
  sumarTiempos,
} from "../src/lib/convert";

const DATA_PATH = path.join(process.cwd(), "data", "recipes.json");

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.log("No recipes.json found.");
    return;
  }

  const recipes = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  let fixed = 0;

  for (const r of recipes) {
    // Fix encoding (mojibake + HTML entities) in every text field
    const oldTitulo = r.titulo;
    r.titulo = cleanText(r.titulo);
    r.descripcion = cleanText(r.descripcion);
    r.dificultad = cleanText(r.dificultad);
    r.ingredientes = r.ingredientes.map((i: string) => cleanText(i));

    // Re-convert every step from its source text with the shared engine
    r.pasos_mambo = r.pasos_mambo.map((p: { instruccion: string }, i: number) =>
      convertStep(p.instruccion, i)
    );

    // Real total time: sum of step times (robot + oven + manual)
    r.tiempo_total_min = sumarTiempos(r.pasos_mambo);

    // Re-categorize from the full recipe text
    r.categoria = clasificarCategoria(
      r.titulo,
      r.ingredientes,
      r.pasos_mambo.map((p: { instruccion: string }) => p.instruccion)
    );

    if (r.titulo !== oldTitulo) fixed++;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2), "utf-8");

  console.log(`✅ Fixed ${fixed} recipes (encoding + categories)`);
  console.log(`📁 ${DATA_PATH}`);

  // Show category distribution
  const cats: Record<string, number> = {};
  for (const r of recipes) cats[r.categoria] = (cats[r.categoria] ?? 0) + 1;
  console.log("\nCategorías:");
  for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Conversion quality report
  let sinConvertir = 0;
  let baja = 0;
  for (const r of recipes) {
    for (const p of r.pasos_mambo) {
      if (p.sin_convertir) sinConvertir++;
      if (p.confianza === "baja") baja++;
    }
  }
  console.log(`\n🔎 Pasos sin_convertir: ${sinConvertir} · confianza baja: ${baja}`);
}

main();
