// Fixes implausible cooking times: re-scrapes each suspicious recipe's source
// and compares stored tiempo_total_min against the source's own totalTime.
// Dry-run by default (prints a comparison); pass --write to apply corrections.
// Usage: npx tsx scripts/fix-times.ts [--write]
import { readFileSync, writeFileSync } from "node:fs";
import { scrapeRecipe } from "../src/lib/scrape";
import { parseDurationToMinutes, generarDescripcion } from "../src/lib/convert";

type Rec = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  categoria: string;
  tiempo_total_min: number;
  comensales: number;
  dificultad: string;
  ingredientes: string[];
  pasos_mambo: unknown[];
  fuente_url: string;
  creado_en: string;
};

const path = "data/recipes.json";
const raw = JSON.parse(readFileSync(path, "utf8"));
const list: Rec[] = Array.isArray(raw) ? raw : raw.recipes;

async function main() {
  const write = process.argv.includes("--write");
  const targets = list.filter((r) => (r.tiempo_total_min ?? 0) > 0 && r.tiempo_total_min < 5);
  console.log(`tiempos sospechosos (<5 min): ${targets.length} — modo ${write ? "WRITE" : "dry-run"}`);

  let corrected = 0;
  let confirmed = 0;
  let retired = 0;
  let failed = 0;

  for (const r of targets) {
    try {
      const scraped = await scrapeRecipe(r.fuente_url);
      const sourceMin = parseDurationToMinutes(scraped.time) ?? 0;
      let decision: string;
      if (sourceMin >= 5) {
        decision = `CORREGIR ${r.tiempo_total_min} -> ${sourceMin}`;
        if (write) {
          r.tiempo_total_min = sourceMin;
          r.descripcion = generarDescripcion(
            r.titulo,
            r.categoria,
            r.tiempo_total_min,
            r.comensales,
            r.ingredientes,
            r.pasos_mambo.length
          );
        }
        corrected++;
      } else if (sourceMin > 0) {
        const changed = sourceMin !== r.tiempo_total_min;
        decision = `FUENTE CONFIRMA ${sourceMin} (rapida de verdad)${changed ? ` + sincroniza ${r.tiempo_total_min} -> ${sourceMin}` : ""}`;
        if (write && changed) {
          r.tiempo_total_min = sourceMin;
          r.descripcion = generarDescripcion(
            r.titulo,
            r.categoria,
            r.tiempo_total_min,
            r.comensales,
            r.ingredientes,
            r.pasos_mambo.length
          );
        }
        confirmed++;
      } else {
        decision = `SIN DATO EN FUENTE -> retirar tiempo`;
        if (write) {
          r.tiempo_total_min = 0;
          r.descripcion = generarDescripcion(
            r.titulo,
            r.categoria,
            r.tiempo_total_min,
            r.comensales,
            r.ingredientes,
            r.pasos_mambo.length
          );
        }
        retired++;
      }
      console.log(`  ${r.slug} | stored ${r.tiempo_total_min} | fuente ${scraped.time ?? "-"} | ${decision}`);
    } catch (e) {
      failed++;
      console.log(`  ${r.slug} | ERROR ${(e as Error).message.slice(0, 80)}`);
    }
    await new Promise((x) => setTimeout(x, 1200));
  }

  if (write) writeFileSync(path, JSON.stringify(raw, null, 2) + "\n", "utf8");
  console.log(`\ncorregidas: ${corrected} · confirmadas rapidas: ${confirmed} · tiempo retirado: ${retired} · fallos: ${failed}`);
}

main();
