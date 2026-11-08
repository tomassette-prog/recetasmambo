#!/usr/bin/env node
/**
 * Reconvert script: re-runs the FULL Thermomix→Mambo conversion for every
 * step from its ORIGINAL Thermomix source text through the shared engine
 * (src/lib/convert.ts), then recomputes total time and category.
 *
 * Unlike fix-recipes.ts (which re-converts whatever text is stored in
 * `instruccion`), this script is idempotent: it always converts from
 * `instruccion_original` and stores that source text back on the step, so
 * future engine improvements can regenerate the data safely.
 *
 * Conversion rules live ONLY in src/lib/convert.ts — this script is a thin
 * pipeline wrapper. See docs/CONVERSION-THERMOMIX-MAMBO.md.
 *
 * Usage: npx tsx scripts/reconvert.ts
 */

import fs from "node:fs";
import path from "node:path";
import {
  clasificarCategoria,
  cleanText,
  convertStep,
  sumarTiempos,
} from "../src/lib/convert";
import type { Recipe } from "../src/lib/types";

const DATA_PATH = path.join(process.cwd(), "data", "recipes.json");

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.log("No recipes.json found.");
    return;
  }

  const recipes: Recipe[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  let stepsTotal = 0;
  let stepsFromOriginal = 0;

  for (const r of recipes) {
    r.titulo = cleanText(r.titulo);
    r.descripcion = cleanText(r.descripcion);
    r.dificultad = cleanText(r.dificultad) as Recipe["dificultad"];
    r.ingredientes = r.ingredientes.map((i: string) => cleanText(i));

    // Full re-conversion from the original Thermomix source text.
    r.pasos_mambo = r.pasos_mambo.map((p, i) => {
      stepsTotal++;
      // Prefer the preserved original; fall back to `instruccion` for
      // legacy steps that predate the instruccion_original field.
      const original = p.instruccion_original ?? p.instruccion;
      if (p.instruccion_original) stepsFromOriginal++;
      const step = convertStep(original, i);
      step.instruccion_original = original;
      return step;
    });

    // Real total time: sum of step times (robot + oven + manual)
    r.tiempo_total_min = sumarTiempos(r.pasos_mambo);

    // Re-categorize from the full recipe text
    r.categoria = clasificarCategoria(
      r.titulo,
      r.ingredientes,
      r.pasos_mambo.map((p) => p.instruccion)
    );
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2), "utf-8");

  console.log(`✅ Reconverted ${recipes.length} recipes · ${stepsTotal} steps`);
  console.log(`   Steps converted from instruccion_original: ${stepsFromOriginal}`);
  console.log(`   Steps converted from legacy instruccion:   ${stepsTotal - stepsFromOriginal}`);
  console.log(`📁 ${DATA_PATH}`);

  // Conversion quality report
  let sinConvertir = 0;
  let baja = 0;
  let media = 0;
  let alta = 0;
  let recipesPartial = 0;
  for (const r of recipes) {
    let partial = false;
    for (const p of r.pasos_mambo) {
      if (p.sin_convertir) {
        sinConvertir++;
        partial = true;
      }
      if (p.confianza === "baja") baja++;
      else if (p.confianza === "media") media++;
      else alta++;
    }
    if (partial) recipesPartial++;
  }
  console.log(`\n🔎 Pasos sin_convertir: ${sinConvertir}`);
  console.log(`   confianza — alta: ${alta} · media: ${media} · baja: ${baja}`);
  console.log(
    `   Recetas 100% convertidas: ${recipes.length - recipesPartial} · con pasos sin_convertir: ${recipesPartial}`
  );

  // Control sample: the recipe that exposed the old conversion bugs
  const brownie = recipes.find((r) => r.slug === "tarta-brownie-con-crema-de-queso");
  if (brownie) {
    console.log(`\n🍫 Muestra de control — ${brownie.titulo} (tiempo_total_min: ${brownie.tiempo_total_min})`);
    for (const p of brownie.pasos_mambo) {
      console.log(
        `  [${p.paso_numero}] ${p.tipo_paso} · vel=${p.velocidad} · temp=${p.temperatura_c} · tmin=${p.tiempo_minutos} · conf=${p.confianza}${p.sin_convertir ? " · SIN_CONVERTIR" : ""}`
      );
    }
  }
}

main();
