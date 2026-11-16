// Regenerates data/recipes.json descriptions from real recipe data.
// Idempotent: safe to re-run. Usage: npx tsx scripts/fix-descriptions.ts
import { readFileSync, writeFileSync } from "node:fs";
import { generarDescripcion, clasificarCategoria } from "../src/lib/convert";

type Rec = {
  titulo: string;
  categoria: string;
  tiempo_total_min: number;
  comensales: number;
  ingredientes: string[];
  pasos_mambo?: Record<string, unknown>[];
  descripcion: string;
};

const path = "data/recipes.json";
const raw = JSON.parse(readFileSync(path, "utf8"));
const list: Rec[] = Array.isArray(raw) ? raw : raw.recipes;

let changed = 0;
let reclasified = 0;
for (const r of list) {
  const pasosTexto = (r.pasos_mambo ?? []).map((p) =>
    Object.values(p)
      .filter((v) => typeof v === "string")
      .join(" ")
  );
  const cat = clasificarCategoria(r.titulo, r.ingredientes, pasosTexto);
  if (cat !== r.categoria) {
    r.categoria = cat;
    reclasified++;
  }
  const next = generarDescripcion(
    r.titulo,
    r.categoria,
    r.tiempo_total_min,
    r.comensales,
    r.ingredientes,
    r.pasos_mambo?.length ?? 0
  );
  if (r.descripcion !== next) {
    r.descripcion = next;
    changed++;
  }
}

writeFileSync(path, JSON.stringify(raw, null, 2) + "\n", "utf8");
console.log(`descripciones: ${changed} / ${list.length} · categorías reclasificadas: ${reclasified}`);
