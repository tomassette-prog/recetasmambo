#!/usr/bin/env node
/**
 * Download recipe images locally.
 * Tries direct download first, falls back to Playwright screenshot.
 *
 * Usage:
 *   npx tsx scripts/download-images.ts               # all recipes
 *   npx tsx scripts/download-images.ts --limit 20     # first 20
 */

import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "data", "recipes.json");
const IMAGES_DIR = path.join(process.cwd(), "public", "images", "recipes");

function loadRecipes(): any[] {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

function saveRecipes(recipes: any[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2), "utf-8");
}

function slugify(text: string): string {
  return text
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function downloadDirect(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        referer: new URL(url).origin,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return false;

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 5000) return false; // too small, probably error page

    fs.writeFileSync(destPath, Buffer.from(buffer));
    return true;
  } catch {
    return false;
  }
}

async function captureWithPlaywright(
  sourceUrl: string,
  destPath: string
): Promise<boolean> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    // Try to find the main recipe image
    const selectors = [
      'meta[property="og:image"]',
      ".wprm-recipe-image img",
      ".recipe-image img",
      ".entry-content img",
      'article img[src*="uploads"]',
      ".post-thumbnail img",
      'img[class*="recipe"]',
      'img[class*="featured"]',
    ];

    let imageUrl: string | null = null;

    // Try og:image first
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content")
      .catch(() => null);
    if (ogImage) {
      imageUrl = ogImage;
    }

    // Try image selectors
    if (!imageUrl) {
      for (const sel of selectors) {
        const src = await page
          .locator(sel)
          .first()
          .getAttribute("src")
          .catch(() => null);
        if (src && src.startsWith("http")) {
          imageUrl = src;
          break;
        }
      }
    }

    // Fallback: screenshot the first large image
    if (!imageUrl) {
      const img = page.locator("img").first();
      const box = await img.boundingBox().catch(() => null);
      if (box && box.width > 200 && box.height > 150) {
        await img.screenshot({ path: destPath });
        await browser.close();
        return fs.existsSync(destPath);
      }
    }

    // If we found an image URL, download it
    if (imageUrl) {
      await browser.close();
      return await downloadDirect(imageUrl, destPath);
    }

    await browser.close();
    return false;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 999;

  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const recipes = loadRecipes();
  console.log(`\n📸 Recipe Image Downloader`);
  console.log(`─`.repeat(50));
  console.log(`  Recipes: ${recipes.length}`);
  console.log(`  Output:  ${IMAGES_DIR}\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let count = 0;

  for (const recipe of recipes) {
    if (count >= limit) break;
    count++;

    const slug = recipe.slug || slugify(recipe.titulo);
    const ext = ".jpg";
    const filename = `${slug}${ext}`;
    const destPath = path.join(IMAGES_DIR, filename);
    const publicPath = `/images/recipes/${filename}`;

    // Skip if already downloaded
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
      recipe.imagen = publicPath;
      skipped++;
      continue;
    }

    // Skip if no source
    if (!recipe.fuente_url && !recipe.imagen) {
      failed++;
      continue;
    }

    process.stdout.write(
      `\r  [${count}/${Math.min(limit, recipes.length)}] ${recipe.titulo.slice(0, 50).padEnd(50)}`
    );

    let success = false;

    // Strategy 1: Download current image URL directly
    if (recipe.imagen && recipe.imagen.startsWith("http")) {
      success = await downloadDirect(recipe.imagen, destPath);
    }

    // Strategy 2: Capture from source page with Playwright
    if (!success && recipe.fuente_url) {
      success = await captureWithPlaywright(recipe.fuente_url, destPath);
    }

    if (success && fs.existsSync(destPath)) {
      recipe.imagen = publicPath;
      downloaded++;
      if (downloaded % 10 === 0) saveRecipes(recipes);
    } else {
      failed++;
    }

    await sleep(300);
  }

  saveRecipes(recipes);

  console.log(`\n\n  ✅ Downloaded: ${downloaded}`);
  console.log(`  ⏭  Skipped (already existed): ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📁 ${IMAGES_DIR}\n`);
}

main().catch(console.error);
