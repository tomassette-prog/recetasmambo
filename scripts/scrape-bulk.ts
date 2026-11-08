/**
 * Bulk scraper: fetches sitemaps from Thermomix recipe blogs,
 * extracts JSON-LD Recipe data, converts to Mambo format,
 * and saves to the persistent JSON store.
 *
 * Usage: npx tsx scripts/scrape-bulk.ts [--limit 10] [--source thermorecetas]
 */

import fs from "node:fs";
import path from "node:path";
import type { Recipe } from "../src/lib/types";
import { convertScrapedRecipe, type ScrapedRecipe } from "../src/lib/convert";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

      const converted = convertScrapedRecipe(scraped);
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
