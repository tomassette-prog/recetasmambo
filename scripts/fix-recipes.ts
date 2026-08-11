#!/usr/bin/env node
/**
 * Fix script: re-categorizes scraped recipes and fixes encoding issues.
 * Usage: npx tsx scripts/fix-recipes.ts
 */

import fs from "node:fs";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), "data", "recipes.json");

function norm(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function fixEncoding(text: string): string {
  // Fix common UTF-8 double-encoding issues
  const map: Record<string, string> = {
    "\u00c3\u00a1": "á", "\u00c3\u00a9": "é", "\u00c3\u00ad": "í",
    "\u00c3\u00b3": "ó", "\u00c3\u00ba": "ú", "\u00c3\u00b1": "ñ",
    "\u00c3\u0081": "Á", "\u00c3\u0089": "É", "\u00c3\u008d": "Í",
    "\u00c3\u0093": "Ó", "\u00c3\u009a": "Ú", "\u00c3\u0091": "Ñ",
  };

  let result = text;
  for (const [from, to] of Object.entries(map)) {
    result = result.replaceAll(from, to);
  }

  // Remove URL shortcodes from ingredients
  result = result.replace(/\[url[^\]]*\].*?\[\/url\]/g, "");
  return result.trim();
}

function guessCategory(title: string, ingredients: string[], instructions: string[]): string {
  const all = norm([title, ...ingredients, ...instructions].join(" "));

  // Postres
  if (/\b(tarta|bizcoch|brownie|galleta|helado|postre|natilla|crema|flan|pudin|magdalena|cupcake|donut|muffin|croissant|brioche|panquemad|buñuelo|buñuelos|churro|torrija|arroz.*leche|leche.*frita|tocino.*cielo|santiago|quesada|fartons|ensaimada|hojaldre|rosco|rosquilla|pestiño|polvoron|mantecado|turrón|turron|mazapan|mazapán|fruta.*seca|plum.cake|pastel|fondant)/.test(all))
    return "postres";

  // Panes y masas
  if (/\b(pan |panecillo|bollo|rosca|hogaza|barra|chapata|focaccia|pizza.*masa|masa.*pizza|naan|pita|pretzel)/.test(all))
    return "panes-masas";

  // Arroces
  if (/\b(arroz|paella|risotto|meloso|caldoso|negro.*arroz|arroz.*negro)/.test(all))
    return "arroces";

  // Carnes
  if (/\b(pollo|ternera|cerdo|cordero|carne|albondiga|estofad|hamburguesa|chuleta|solomillo|lomo|magro|costilla|chistorra|chorizo|morcilla|salchich)/.test(all))
    return "carnes";

  // Pescados
  if (/\b(merluza|salmon|salmón|gamba|atun|atún|pescad|marisco|bacalao|rape|lubina|dorada|sardina|calamar|pulpo|mejillon|almeja|bonito|pez)/.test(all))
    return "pescados";

  // Verduras
  if (/\b(verdura|ensalada|gazpacho|crema.*calabaza|crema.*zapallo|crema.*zanahoria|crema.*puerro|pure.*verdura|saltead|guarnicion|guarnición|espinaca|brócoli|brcoli|coliflor|alcachofa|berenjena|calabacin|calabacín|seta|hong)/.test(all))
    return "verduras";

  // Legumbres
  if (/\b(lenteja|garbanzo|judia|judía|alubia|potaje|fabada|cocid)/.test(all))
    return "legumbres";

  // Salsas
  if (/\b(salsa|pesto|mayonesa|aliño|vinagreta|sofrito|sofregit|romesco|pipirrana|mojo|chimichurri)/.test(all))
    return "salsas";

  // Bebidas
  if (/\b(zumo|batido|smoothie|limonada|horchata|sangria|sangría|tinto.*verano|bebida|infusion|té |te |caf[ée])/.test(all))
    return "bebidas";

  // Sopas
  if (/\b(sopa|crema|potaje|caldo|menudo|gazpacho|salmorejo|vichyssoise|consom[ée]|ramen)/.test(all))
    return "sopas-y-cremas";

  return "sopas-y-cremas";
}

function main() {
  if (!fs.existsSync(STORE_PATH)) {
    console.log("No recipes.json found.");
    return;
  }

  const recipes = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  let fixed = 0;

  for (const r of recipes) {
    // Fix encoding
    const oldTitulo = r.titulo;
    r.titulo = fixEncoding(r.titulo);
    r.descripcion = fixEncoding(r.descripcion);
    r.ingredientes = r.ingredientes.map((i: string) => fixEncoding(i));
    r.pasos_mambo = r.pasos_mambo.map((p: any) => ({
      ...p,
      instruccion: fixEncoding(p.instruccion),
    }));

    // Re-categorize
    r.categoria = guessCategory(r.titulo, r.ingredientes, r.pasos_mambo.map((p: any) => p.instruccion));

    if (r.titulo !== oldTitulo) fixed++;
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(recipes, null, 2), "utf-8");

  console.log(`✅ Fixed ${fixed} recipes (encoding + categories)`);
  console.log(`📁 ${STORE_PATH}`);

  // Show category distribution
  const cats: Record<string, number> = {};
  for (const r of recipes) cats[r.categoria] = (cats[r.categoria] ?? 0) + 1;
  console.log("\nCategorías:");
  for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
}

main();
