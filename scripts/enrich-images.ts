/**
 * Enrich recipes with images by re-fetching their source URLs.
 *
 * Strategy (in priority order):
 *   1. JSON-LD Recipe schema → image field
 *   2. Open Graph meta tag → og:image
 *   3. First large image on the page (>400px width hint)
 *
 * Usage: npx tsx scripts/enrich-images.ts [--limit N]
 */

import fs from "node:fs";
import path from "node:path";

type Recipe = {
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
  fuente_url?: string;
  creado_en: string;
  destacada?: boolean;
};

const STORE_PATH = path.join(process.cwd(), "data", "recipes.json");

function loadStore(): Recipe[] {
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}

function saveStore(recipes: Recipe[]): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(recipes, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Image extraction helpers
// ---------------------------------------------------------------------------

/** Normalize any JSON-LD image shape into a single URL string */
function normalizeImage(raw: unknown): string | undefined {
  if (typeof raw === "string" && raw.startsWith("http")) return raw;
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === "string" && first.startsWith("http")) return first;
    if (first && typeof first === "object" && typeof first.url === "string") return first.url;
  }
  if (raw && typeof raw === "object" && typeof (raw as any).url === "string") {
    return (raw as any).url;
  }
  return undefined;
}

/** Extract image from JSON-LD Recipe schema in HTML */
function extractJsonLdImage(html: string): string | undefined {
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

        if (recipe?.image) {
          const img = normalizeImage(recipe.image);
          if (img) return img;
        }
      }
    } catch {
      // malformed JSON-LD
    }
  }
  return undefined;
}

/** Extract og:image from HTML meta tags */
function extractOgImage(html: string): string | undefined {
  // <meta property="og:image" content="https://...">
  const match =
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
  return match?.[1];
}

/** Extract first large image URL from the page (heuristic) */
function extractFirstLargeImage(html: string): string | undefined {
  // Look for images with width >= 400 or common large image patterns
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html)) !== null) {
    const src = m[1];
    const tag = m[0];
    // Skip tiny icons, tracking pixels, data URIs
    if (src.startsWith("data:")) continue;
    if (/width=["'](1[0-9]{2}|[2-9]\d{2,}|\d{4,})/.test(tag)) return src;
    if (/wp-content\/uploads/i.test(src)) return src;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

  const recipes = loadStore();
  const needsImage = recipes.filter((r) => !r.imagen && r.fuente_url);

  console.log(`\n🖼️  Enrich Images Script`);
  console.log(`   Total recipes: ${recipes.length}`);
  console.log(`   Need image: ${needsImage.length}`);
  console.log(`   Limit: ${limit === Infinity ? "all" : limit}\n`);

  let enriched = 0;
  let failed = 0;
  const toProcess = needsImage.slice(0, limit);

  for (let i = 0; i < toProcess.length; i++) {
    const recipe = toProcess[i];
    const url = recipe.fuente_url!;
    process.stdout.write(`\r   [${i + 1}/${toProcess.length}] ${recipe.titulo.slice(0, 50)}...`);

    try {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        failed++;
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const html = await res.text();

      // Try strategies in priority order
      const image =
        extractJsonLdImage(html) ?? extractOgImage(html) ?? extractFirstLargeImage(html);

      if (image) {
        // Update the recipe in the main array
        const idx = recipes.findIndex((r) => r.id === recipe.id);
        if (idx >= 0) {
          recipes[idx].imagen = image;
          enriched++;
        }
      } else {
        failed++;
      }

      // Save every 10 recipes
      if (enriched > 0 && enriched % 10 === 0) {
        saveStore(recipes);
        process.stdout.write(` [saved]`);
      }
    } catch {
      failed++;
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  // Final save
  saveStore(recipes);

  console.log(`\n\n✅ Done!`);
  console.log(`   Enriched: ${enriched}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total with images: ${recipes.filter((r) => r.imagen).length}/${recipes.length}`);
  console.log(`\n📁 Store: ${STORE_PATH}\n`);
}

main().catch(console.error);
