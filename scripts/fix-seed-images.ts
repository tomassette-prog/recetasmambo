#!/usr/bin/env node
/**
 * Fix seed recipe images by searching thermorecetas.com for matching recipes.
 * Downloads the actual recipe image from the source.
 */

import fs from "node:fs";
import path from "node:path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images", "recipes");

const SEEDS_TO_FIX = [
  { slug: "sofrito-base-mambo", search: "sofrito" },
  { slug: "arroz-con-leche-mambo", search: "arroz con leche" },
  { slug: "pure-de-patatas-mambo", search: "pure de patatas" },
  { slug: "cocido-madrileno-mambo", search: "cocido madrileno" },
  { slug: "bizcocho-de-yogur-mambo", search: "bizcocho de yogur" },
  { slug: "guiso-de-carne-con-garbanzos-mambo", search: "guiso de carne" },
  { slug: "merluza-al-vapor-mambo", search: "merluza al vapor" },
  { slug: "sopa-de-ajo-mambo", search: "sopa de ajo" },
  { slug: "pesto-casero-mambo", search: "pesto casero" },
  { slug: "lentejas-mambo", search: "lentejas" },
  { slug: "smoothie-de-frutas-rojas-mambo", search: "smoothie frutas rojas" },
  { slug: "pan-de-molde-mambo", search: "pan de molde" },
];

// Known working Unsplash photo IDs for specific foods
const FOOD_PHOTOS: Record<string, string> = {
  sofrito: "photo-1596797038530-2c107229654b",
  "arroz-con-leche": "photo-1621996346565-e3dbc646d9a9",
  "pure-de-patatas": "photo-1546069901-ba9599a7e63c",
  cocido: "photo-1547592166-23ac45744acd",
  bizcocho: "photo-1578985545062-69928b1d9587",
  guiso: "photo-1547592166-23ac45744acd",
  merluza: "photo-1580476262798-bddd9f4b7369",
  "sopa-de-ajo": "photo-1547592180-85f173990554",
  pesto: "photo-1592921870789-04563d55041c",
  lentejas: "photo-1564894809611-1742fc40ed80",
  smoothie: "photo-1505252585461-04db1eb84625",
  "pan-de-molde": "photo-1509440159596-0249088772ff",
};

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        referer: new URL(url).origin,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 3000) return false;
    fs.writeFileSync(destPath, Buffer.from(buffer));
    return true;
  } catch {
    return false;
  }
}

async function searchThermorecetas(query: string): Promise<string | null> {
  try {
    // Use thermorecetas.com search
    const searchUrl = `https://www.thermorecetas.com/?s=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Find first recipe link
    const linkMatch = /<a[^>]+href="(https:\/\/www\.thermorecetas\.com\/[^"]+)"[^>]*class="[^"]*post[^"]*"/i.exec(html)
      || /<article[^>]*>[\s\S]*?<a[^>]+href="(https:\/\/www\.thermorecetas\.com\/[^"]+recipe[^"]*)"/i.exec(html)
      || /<a[^>]+href="(https:\/\/www\.thermorecetas\.com\/[^"]+)"/i.exec(html);

    if (!linkMatch) return null;

    const recipeUrl = linkMatch[1];
    const recipeRes = await fetch(recipeUrl, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!recipeRes.ok) return null;
    const recipeHtml = await recipeRes.text();

    // Extract og:image
    const ogMatch = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(recipeHtml);
    if (ogMatch) return ogMatch[1];

    // Extract JSON-LD image
    const jsonLdMatch = /"image"\s*:\s*"(https?:\/\/[^"]+)"/i.exec(recipeHtml);
    if (jsonLdMatch) return jsonLdMatch[1];

    return null;
  } catch {
    return null;
  }
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  console.log("🍳 Fixing seed recipe images...\n");

  for (const seed of SEEDS_TO_FIX) {
    const destPath = path.join(IMAGES_DIR, `${seed.slug}.jpg`);
    const publicPath = `/images/recipes/${seed.slug}.jpg`;

    process.stdout.write(`  ${seed.slug}: `);

    // Strategy 1: Search thermorecetas.com for real image
    const realImage = await searchThermorecetas(seed.search);
    if (realImage) {
      const ok = await downloadImage(realImage, destPath);
      if (ok) {
        console.log(`✅ (thermorecetas)`);
        continue;
      }
    }

    // Strategy 2: Use specific Unsplash photo
    const photoId = FOOD_PHOTOS[seed.search] || FOOD_PHOTOS[seed.slug] || null;
    if (photoId) {
      const unsplashUrl = `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&q=80`;
      const ok = await downloadImage(unsplashUrl, destPath);
      if (ok) {
        console.log(`✅ (unsplash specific)`);
        continue;
      }
    }

    console.log(`❌ failed`);
  }

  console.log("\nDone!");
}

main().catch(console.error);
