// Recovers steps lost by the old conversion: re-scrapes each recipe's source
// and, when the source has MORE steps than stored, re-converts with the
// current pipeline (keeping slug/id/date/image for URL stability).
// Idempotent. Usage: npx tsx scripts/recover-steps.ts
import { readFileSync, writeFileSync } from "node:fs";
import { scrapeRecipe } from "../src/lib/scrape";
import { convertScrapedRecipe, generarDescripcion } from "../src/lib/convert";

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
  const targets = list.filter(
    (r) => (r.pasos_mambo || []).length <= 2 && (r.ingredientes || []).length >= 6
  );
  console.log(`sospechosas de pasos perdidos: ${targets.length}`);

  let recovered = 0;
  let same = 0;
  let failed = 0;

  for (const r of targets) {
    try {
      const scraped = await scrapeRecipe(r.fuente_url);
      const converted = convertScrapedRecipe(scraped);
      const before = r.pasos_mambo.length;
      if (converted.pasos_mambo.length > before) {
        r.titulo = converted.titulo;
        r.pasos_mambo = converted.pasos_mambo;
        r.ingredientes = converted.ingredientes;
        r.tiempo_total_min = converted.tiempo_total_min;
        r.comensales = converted.comensales;
        r.dificultad = converted.dificultad;
        r.categoria = converted.categoria;
        r.descripcion = generarDescripcion(
          converted.titulo,
          converted.categoria,
          converted.tiempo_total_min,
          converted.comensales,
          converted.ingredientes,
          converted.pasos_mambo.length
        );
        recovered++;
        console.log(`  ✓ ${r.titulo}: ${converted.pasos_mambo.length} pasos (antes ${before})`);
      } else {
        same++;
      }
    } catch (e) {
      failed++;
      console.log(`  ✗ ${r.slug}: ${(e as Error).message.slice(0, 80)}`);
    }
    await new Promise((x) => setTimeout(x, 1200));
  }

  writeFileSync(path, JSON.stringify(raw, null, 2) + "\n", "utf8");
  console.log(`recuperadas: ${recovered} · ya completas: ${same} · fallos: ${failed}`);
}

main();
