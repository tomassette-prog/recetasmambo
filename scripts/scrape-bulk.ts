/**
 * Bulk scraper: fetches sitemaps from Thermomix recipe blogs,
 * extracts JSON-LD Recipe data, converts to Mambo format,
 * and saves to the persistent JSON store.
 *
 * Usage: npx tsx scripts/scrape-bulk.ts [--limit 10] [--source thermorecetas]
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScrapedRecipe = {
  title: string;
  ingredients: string[];
  servings?: string;
  time?: string;
  instructions: string[];
  image?: string;
};

type MamboStep = {
  paso_numero: number;
  instruccion: string;
  accesorio: "Cuchillas" | "Pala MamboMix" | "Ninguno";
  velocidad: number | "Turbo";
  temperatura_c: number | null;
  potencia_calorifica: number | null;
  tiempo_minutos: number | null;
};

type Recipe = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  categoria: string;
  tiempo_total_min: number;
  comensales: number;
  dificultad: "Fácil" | "Media" | "Difícil";
  ingredientes: string[];
  pasos_mambo: MamboStep[];
  fuente_url: string;
  creado_en: string;
  destacada?: boolean;
};

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

const SOURCES = [
  {
    name: "thermorecetas",
    sitemap: "https://www.thermorecetas.com/sitemap_index.xml",
    baseUrl: "https://www.thermorecetas.com",
  },
  {
    name: "misthermorecetas",
    sitemap: "https://www.misthermorecetas.com/sitemap_index.xml",
    baseUrl: "https://www.misthermorecetas.com",
  },
  {
    name: "velocidadcuchara",
    sitemap: "https://www.velocidadcuchara.com/sitemap.xml",
    baseUrl: "https://www.velocidadcuchara.com",
  },
];

// ---------------------------------------------------------------------------
// Sitemap parser
// ---------------------------------------------------------------------------

async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  try {
    const res = await fetch(sitemapUrl, {
      headers: { "user-agent": "MamboRecetasBot/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    // Check if it's a sitemap index
    if (xml.includes("<sitemapindex")) {
      const childSitemaps = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
      const allUrls: string[] = [];
      for (const child of childSitemaps.slice(0, 20)) {
        // Limit child sitemaps
        const childUrls = await fetchSitemapUrls(child);
        allUrls.push(...childUrls);
      }
      return allUrls;
    }

    // Regular sitemap
    return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

function filterRecipeUrls(urls: string[], baseUrl: string): string[] {
  const recipePatterns = [
    /\/receta[s]?\//i,
    /\/recipe[s]?\//i,
    /\/cocina\//i,
    /-\d+\/?$/i, // URLs ending with an ID
  ];

  const skipPatterns = [
    /\/tag\//i,
    /\/category\//i,
    /\/author\//i,
    /\/page\//i,
    /\/wp-/i,
    /\/feed/i,
    /\.xml$/i,
    /\.jpg$/i,
    /\.png$/i,
  ];

  return urls.filter((url) => {
    if (skipPatterns.some((p) => p.test(url))) return false;
    if (url.startsWith(baseUrl)) return true;
    return recipePatterns.some((p) => p.test(url));
  });
}

// ---------------------------------------------------------------------------
// Recipe scraper (JSON-LD extraction)
// ---------------------------------------------------------------------------

async function scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Extract JSON-LD blocks
    const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        const nodes: any[] = Array.isArray(parsed) ? parsed : [parsed];

        for (const node of nodes) {
          const graph: any[] = node?.["@graph"] ?? [];
          const candidates = [node, ...graph];

          const recipe = candidates.find(
            (c: any) =>
              c?.["@type"] === "Recipe" ||
              (Array.isArray(c?.["@type"]) && c["@type"].includes("Recipe"))
          );

          if (!recipe) continue;

          const title: string = recipe.name ?? "";
          const time: string | undefined = recipe.totalTime ?? recipe.cookTime ?? undefined;
          const servings: string | undefined = recipe.recipeYield
            ? Array.isArray(recipe.recipeYield)
              ? recipe.recipeYield[0]
              : String(recipe.recipeYield)
            : undefined;

          const ingredients: string[] = Array.isArray(recipe.recipeIngredient)
            ? recipe.recipeIngredient.map((i: any) => String(i))
            : [];

          const instructions: string[] = Array.isArray(recipe.recipeInstructions)
            ? recipe.recipeInstructions
                .map((i: any) => {
                  if (typeof i === "string") return i;
                  if (i?.["@type"] === "HowToStep") return String(i.text ?? i.name ?? "");
                  if (i?.itemListElement) {
                    return (i.itemListElement as any[])
                      .map((s: any) => String(s?.text ?? s?.name ?? ""))
                      .filter(Boolean)
                      .join("\n");
                  }
                  return "";
                })
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [];

          // Extract image from JSON-LD (handles string, array, object, array of objects)
          const rawImage = recipe.image;
          let image: string | undefined;
          if (typeof rawImage === "string") {
            image = rawImage;
          } else if (Array.isArray(rawImage) && rawImage.length > 0) {
            const first = rawImage[0];
            image = typeof first === "string" ? first : first?.url;
          } else if (rawImage && typeof rawImage === "object") {
            image = rawImage.url;
          }

          if (title && ingredients.length > 0 && instructions.length > 0) {
            return { title, ingredients, servings, time, instructions, image };
          }
        }
      } catch {
        // malformed JSON-LD block
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Conversion engine (same rules as src/lib/convert.ts)
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toLower(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function inferCategory(text: string): string {
  const t = toLower(text);
  if (/\bvapor\b/.test(t)) return "vapor";
  if (/\b(hervir|hervor|hirviendo)\b/.test(t)) return "hervir";
  if (/\b(pan|amasar)\b/.test(t)) return "amasar";
  if (/\b(picar|triturar|turbo|batir|montar)\b/.test(t)) return "triturar";
  if (/\bsofrit[oa]|rehogar|pochar\b/.test(t)) return "sofrito";
  if (/\blenteja|garbanzo|judia|alubia|potaje\b/.test(t)) return "legumbres";
  if (/\bguiso|estofad[oa]|cald[oa]\b/.test(t)) return "guiso";
  if (/\barroz|paella|risotto\b/.test(t)) return "arroz";
  if (/\bleche|bechamel|crema|natilla\b/.test(t)) return "lacteo";
  if (/\blicuado|batido|smoothie|zumo|pure\b/.test(t)) return "liquido";
  return "general";
}

function mapAccesorio(text: string): MamboStep["accesorio"] {
  const t = toLower(text);
  if (/\b(espiga)\b/.test(t)) return "Pala MamboMix";
  if (/\b(izquierda|giro.*izquierda|cuchara)\b/.test(t)) return "Pala MamboMix";
  if (/\b(mariposa)\b/.test(t)) return "Pala MamboMix";
  if (/\b(pala|mambo.?mix)\b/.test(t)) return "Pala MamboMix";
  if (/\b(turbo|triturar|picar|licuado|batido|pure|batir|montar)\b/.test(t)) return "Cuchillas";
  if (/\b(ninguna?|sin accesorio|sin cuchilla|horno|varoma)\b/.test(t)) return "Ninguno";
  const cat = inferCategory(t);
  if (cat === "guiso" || cat === "arroz" || cat === "lacteo" || cat === "legumbres") return "Pala MamboMix";
  if (/\b(pieza|enter[oa]|costillar|muslo)\b/.test(t)) return "Ninguno";
  if (cat === "vapor") return "Ninguno";
  if (cat === "amasar") return "Pala MamboMix";
  if (cat === "sofrito") return "Cuchillas";
  return "Cuchillas";
}

function inferVelocidad(text: string): number | "Turbo" {
  const t = toLower(text);
  const m = /\bvel(?:ocidad)?\.?\s*(\d{1,2})\b/.exec(t);
  if (m) return Math.min(10, Math.max(0, Number(m[1])));
  if (/\bturbo\b/.test(t)) return "Turbo";
  if (/\bvaroma\b/.test(t)) return 3;           // Velocidad Varoma → Vel. 3
  if (/\b(espiga|amasar)\b/.test(t)) return 3;   // Espiga → Vel. 3
  if (/\b(pieza|enter[oa]|costillar|muslo)\b/.test(t)) return 0;
  const cat = inferCategory(t);
  if (cat === "vapor" || cat === "hervir") return 0;
  if (cat === "guiso" || cat === "arroz" || cat === "legumbres") return 1;
  if (cat === "lacteo") return 3;
  if (cat === "triturar") return 7;              // Picar Vel. 5-6 TM → Vel. 6-7 Mambo
  if (cat === "sofrito") return 2;
  if (cat === "liquido") return 5;
  return 1;
}

function inferPotencia(text: string): number {
  const t = toLower(text);
  if (/\bvapor|hirviendo|hervir\b/.test(t)) return 9;
  if (/\bsofrit[oa]\b/.test(t)) return 7;
  if (/\bguiso|estofad[oa]\b/.test(t)) return 5;
  if (/\barroz\b/.test(t)) return 5;
  if (/\blenteja|garbanzo|judia|potaje\b/.test(t)) return 5;
  if (/\bleche|bechamel|crema\b/.test(t)) return 4;
  return 5;
}

function inferTemperatura(text: string): number | null {
  const m = /(\d{2,3})\s*°/.exec(text);
  if (m) return Number(m[1]);
  const t = toLower(text);
  if (/\bvaroma\b/.test(t)) return 120;  // Varoma = 120°C
  if (/\bvapor\b/.test(t)) return 120;
  if (/\bhervir\b/.test(t)) return 100;
  if (/\bsofrit[oa]\b/.test(t)) return 135;
  if (/\blenteja|garbanzo|guiso|estofad/.test(t)) return 100;
  return 100;
}

function parseTime(text: string): number | null {
  if (!text) return null;
  // ISO 8601 duration: PT1H30M, PT45M, PT2H
  const iso = /PT(?:(\d+)H)?(?:(\d+)M)?/i.exec(text);
  if (iso) {
    const h = Number(iso[1] ?? 0);
    const m = Number(iso[2] ?? 0);
    if (h > 0 || m > 0) return h * 60 + m;
  }
  const hm = /(\d+)\s*h\s*(\d+)/i.exec(text);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  const h = /(\d+)\s*h(?:ora)?/i.exec(text);
  const m = /(\d+)\s*min/i.exec(text);
  if (h && m) return Number(h[1]) * 60 + Number(m[1]);
  if (h) return Number(h[1]) * 60;
  if (m) return Number(m[1]);
  return null;
}

function convertToMambo(recipe: ScrapedRecipe): Omit<Recipe, "id" | "creado_en" | "fuente_url"> {
  const allText = recipe.instructions.join(" ");
  const totalTime =
    parseTime(recipe.time ?? "") ??
    recipe.instructions.reduce((sum, s) => sum + (parseTime(s) ?? 5), 0);

  // Determine global category from all instructions
  const globalCategory = (() => {
    const cats = recipe.instructions.map((s) => inferCategory(s));
    const counts: Record<string, number> = {};
    for (const c of cats) counts[c] = (counts[c] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "general";
  })();

  // recipeYield can be "4-5 personas", "45 unidades", "6", etc.
  const servingsStr = String(recipe.servings ?? "");
  const servingsMatch = /^(\d+)/.exec(servingsStr);
  const comensales = servingsMatch ? Math.min(Number(servingsMatch[1]), 20) : 4;

  const pasos_mambo: MamboStep[] = recipe.instructions.map((text, idx) => {
    const cat = inferCategory(text);
    const explicitMin = parseTime(text);
    const timeDefault =
      cat === "sofrito" ? 6 : cat === "guiso" ? 25 : cat === "arroces" ? 18 : 10;
    let time = explicitMin ?? timeDefault;
    // Reduce heat time by 15-20% for liquid heating
    if (/\b(hervir|vapor|caldo|agua)\b/i.test(text)) {
      time = Math.max(1, Math.round(time * 0.82));
    }

    return {
      paso_numero: idx + 1,
      instruccion: text,
      accesorio: mapAccesorio(text),
      velocidad: inferVelocidad(text),
      temperatura_c: inferTemperatura(text),
      potencia_calorifica: inferPotencia(text),
      tiempo_minutos: time,
    };
  });

  const difficulty: Recipe["dificultad"] =
    recipe.instructions.length <= 4 ? "Fácil" : recipe.instructions.length <= 7 ? "Media" : "Difícil";

  return {
    slug: slugify(recipe.title) || Math.random().toString(36).slice(2, 10),
    titulo: recipe.title,
    descripcion: `Receta de ${recipe.title} adaptada de Thermomix a la Cecotec Mambo Cooking Total Gourmet.`,
    imagen: recipe.image ?? "",
    categoria: mapCategory(globalCategory),
    tiempo_total_min: totalTime,
    comensales,
    dificultad: difficulty,
    ingredientes: recipe.ingredients,
    pasos_mambo,
  };
}

function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    sofrito: "salsas",
    guiso: "carnes",
    arroces: "arroces",
    postres: "postres",
    bebidas: "bebidas",
    "panes-masas": "panes-masas",
    verduras: "verduras",
    vapor: "pescados",
    pasta: "arroces",
    general: "sopas-y-cremas",
  };
  return map[cat] ?? "sopas-y-cremas";
}

// ---------------------------------------------------------------------------
// Persistent store
// ---------------------------------------------------------------------------

const STORE_PATH = path.join(process.cwd(), "data", "recipes.json");

function loadStore(): Recipe[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    }
  } catch {}
  return [];
}

function saveStore(recipes: Recipe[]): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(recipes, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 10;
  const sourceIdx = args.indexOf("--source");
  const sourceFilter = sourceIdx >= 0 ? args[sourceIdx + 1] : null;

  const sources = sourceFilter
    ? SOURCES.filter((s) => s.name.includes(sourceFilter))
    : SOURCES;

  console.log(`\n🍳 MamboRecetas Bulk Scraper`);
  console.log(`   Sources: ${sources.map((s) => s.name).join(", ")}`);
  console.log(`   Limit: ${limit} recipes per source\n`);

  const existing = loadStore();
  const existingUrls = new Set(existing.map((r) => r.fuente_url));
  console.log(`📦 Store: ${existing.length} recipes already saved\n`);

  let totalAdded = 0;

  for (const source of sources) {
    console.log(`\n🔍 Fetching sitemap: ${source.sitemap}`);
    const allUrls = await fetchSitemapUrls(source.sitemap);
    console.log(`   Found ${allUrls.length} URLs in sitemap`);

    const recipeUrls = filterRecipeUrls(allUrls, source.baseUrl).filter(
      (url) => !existingUrls.has(url)
    );
    console.log(`   ${recipeUrls.length} new recipe URLs to process`);

    const batch = recipeUrls.slice(0, limit);
    let added = 0;
    let failed = 0;

    for (let i = 0; i < batch.length; i++) {
      const url = batch[i];
      process.stdout.write(`\r   [${i + 1}/${batch.length}] Scraping: ${url.slice(0, 80)}...`);

      const scraped = await scrapeRecipe(url);
      if (!scraped) {
        failed++;
        continue;
      }

      const converted = convertToMambo(scraped);
      existing.push({
        id: crypto.randomUUID(),
        ...converted,
        fuente_url: url,
        creado_en: new Date().toISOString().slice(0, 10),
      });
      existingUrls.add(url);
      added++;

      // Save every 10 recipes
      if (added % 10 === 0) {
        saveStore(existing);
      }

      // Rate limit: 2-3s random delay between requests to avoid bans
      const delay = 2000 + Math.floor(Math.random() * 1000);
      await new Promise((r) => setTimeout(r, delay));
    }

    saveStore(existing);
    totalAdded += added;
    console.log(`\n   ✅ ${added} recipes added, ${failed} failed`);
  }

  console.log(`\n🎉 Done! Total: ${existing.length} recipes (${totalAdded} new)`);
  console.log(`📁 Store: ${STORE_PATH}\n`);
}

main().catch(console.error);
