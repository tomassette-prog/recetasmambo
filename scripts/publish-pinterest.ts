#!/usr/bin/env node
/**
 * Pinterest Publisher: publishes recipe pins to Pinterest using the API.
 *
 * Prerequisites:
 *   1. Create a Pinterest Developer app at https://developers.pinterest.com/apps/
 *   2. Get an access token (OAuth 2.0)
 *   3. Set environment variables:
 *      - PINTEREST_ACCESS_TOKEN: Your OAuth access token
 *      - PINTEREST_BOARD_ID: The board ID to publish pins to
 *
 * Usage:
 *   npx tsx scripts/publish-pinterest.ts [--limit 10] [--dry-run]
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Recipe {
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
  creado_en: string;
}

interface PinterestPin {
  title: string;
  description: string;
  link: string;
  media_source: {
    source_type: "image_url";
    url: string;
  };
  board_id: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ROOT = path.resolve(import.meta.dirname, "..");
const RECIPES_PATH = path.join(ROOT, "data", "recipes.json");
const PUBLISHED_PATH = path.join(ROOT, "data", "pinterest-published.json");
const PINTEREST_CARDS_DIR = path.join(ROOT, "public", "images", "pinterest");

const ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const BOARD_ID = process.env.PINTEREST_BOARD_ID;
const BASE_URL = "https://recetasmambo.com";

// Parse CLI args
const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 10;
const DRY_RUN = args.includes("--dry-run");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadPublished(): Set<string> {
  try {
    if (fs.existsSync(PUBLISHED_PATH)) {
      const data = JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf-8"));
      return new Set(data);
    }
  } catch {}
  return new Set();
}

function savePublished(published: Set<string>) {
  fs.writeFileSync(PUBLISHED_PATH, JSON.stringify([...published], null, 2));
}

function generateDescription(recipe: Recipe): string {
  const parts = [
    recipe.descripcion,
    "",
    `⏱ ${recipe.tiempo_total_min} min | 👥 ${recipe.comensales} comensales | ${recipe.dificultad}`,
    "",
    `🥘 Ingredientes: ${recipe.ingredientes.slice(0, 5).join(", ")}`,
    "",
    `👉 Receta completa en recetasmambo.com`,
    "",
    `#Thermomix #MamboCooking #Recetas #${recipe.categoria.replace(/-/g, "")} #CocinaFácil`,
  ];
  return parts.join("\n");
}

async function createPin(pin: PinterestPin): Promise<{ id: string } | null> {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] Would create pin: ${pin.title}`);
    return { id: "dry-run-id" };
  }

  try {
    const response = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pin),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`   ❌ Error creating pin: ${response.status} - ${error}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`   ❌ Network error:`, (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("📌 Pinterest Publisher");
  console.log("─".repeat(50));

  // Validate config
  if (!ACCESS_TOKEN) {
    console.error("❌ PINTEREST_ACCESS_TOKEN not set. Get one at https://developers.pinterest.com/apps/");
    process.exit(1);
  }
  if (!BOARD_ID) {
    console.error("❌ PINTEREST_BOARD_ID not set. Find your board ID in the Pinterest URL.");
    process.exit(1);
  }

  // Load recipes
  const recipes: Recipe[] = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf-8"));
  const published = loadPublished();

  // Find unpublished recipes
  const unpublished = recipes.filter((r) => !published.has(r.slug));

  if (unpublished.length === 0) {
    console.log("✅ All recipes already published to Pinterest!");
    return;
  }

  console.log(`📊 Total recipes: ${recipes.length}`);
  console.log(`📊 Already published: ${published.size}`);
  console.log(`📊 To publish: ${Math.min(unpublished.length, LIMIT)}`);
  console.log(`📊 Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log("");

  // Publish pins
  let published_count = 0;
  let errors_count = 0;

  for (const recipe of unpublished.slice(0, LIMIT)) {
    console.log(`📌 Publishing: ${recipe.titulo}`);

    // Check if Pinterest card exists
    const cardPath = path.join(PINTEREST_CARDS_DIR, `${recipe.slug}.png`);
    if (!fs.existsSync(cardPath)) {
      console.log(`   ⚠️  No Pinterest card found, skipping...`);
      continue;
    }

    // For now, use the recipe image URL (Pinterest card would need to be hosted)
    // In production, you'd upload the card to a CDN or use the recipe image
    const imageUrl = `${BASE_URL}/images/recipes/${recipe.slug}.jpg`;

    const pin: PinterestPin = {
      title: `${recipe.titulo} — Receta Mambo`,
      description: generateDescription(recipe),
      link: `${BASE_URL}/recetas/${recipe.slug}`,
      media_source: {
        source_type: "image_url",
        url: imageUrl,
      },
      board_id: BOARD_ID,
    };

    const result = await createPin(pin);

    if (result) {
      published.add(recipe.slug);
      published_count++;
      console.log(`   ✅ Published! (ID: ${result.id})`);
    } else {
      errors_count++;
    }

    // Rate limiting: wait 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Save published list
  savePublished(published);

  console.log("");
  console.log("─".repeat(50));
  console.log(`✅ Published: ${published_count} pins`);
  if (errors_count > 0) console.log(`❌ Errors: ${errors_count}`);
  console.log(`📊 Total published: ${published.size}/${recipes.length}`);
}

main().catch(console.error);
