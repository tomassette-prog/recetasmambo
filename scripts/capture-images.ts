#!/usr/bin/env node
/**
 * Capture recipe images by visiting source pages with Playwright.
 * Takes a screenshot of the main recipe image element.
 *
 * Usage: npx tsx scripts/capture-images.ts [--limit N]
 */

import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "data", "recipes.json");
const IMAGES_DIR = path.join(process.cwd(), "public", "images", "recipes");

// Seed recipes that need real images (no fuente_url, so we search)
const SEED_SEARCHES: Record<string, string> = {
  "sofrito-base-mambo": "sofrito base thermomix",
  "arroz-con-leche-mambo": "arroz con leche thermomix",
  "pure-de-patatas-mambo": "pure de patatas thermomix",
  "cocido-madrileno-mambo": "cocido madrileño thermomix",
  "bizcocho-de-yogur-mambo": "bizcocho de yogur thermomix",
  "guiso-de-carne-con-garbanzos-mambo": "guiso carne garbanzos thermomix",
  "merluza-al-vapor-mambo": "merluza al vapor thermomix",
  "sopa-de-ajo-mambo": "sopa de ajo thermomix",
  "pesto-casero-mambo": "pesto casero thermomix",
  "lentejas-mambo": "lentejas thermomix",
  "smoothie-de-frutas-rojas-mambo": "smoothie frutas rojas",
  "pan-de-molde-mambo": "pan de molde thermomix",
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { chromium } = await import("playwright");

  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const recipes = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 999;

  console.log("\n📸 Recipe Image Capture (Playwright)");
  console.log("─".repeat(50));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  let captured = 0;
  let skipped = 0;
  let failed = 0;

  // Process recipes that have fuente_url
  for (const recipe of recipes) {
    if (captured >= limit) break;

    const slug = recipe.slug;
    const destPath = path.join(IMAGES_DIR, `${slug}.jpg`);
    const publicPath = `/images/recipes/${slug}.jpg`;

    // Skip if already has a good local image
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
      recipe.imagen = publicPath;
      skipped++;
      continue;
    }

    // Skip if no source URL and not a seed
    if (!recipe.fuente_url && !SEED_SEARCHES[slug]) {
      continue;
    }

    const page = await context.newPage();
    let success = false;

    try {
      let targetUrl = recipe.fuente_url;

      // For seed recipes without fuente_url, search thermorecetas.com
      if (!targetUrl && SEED_SEARCHES[slug]) {
        const searchQuery = SEED_SEARCHES[slug];
        await page.goto(`https://www.thermorecetas.com/?s=${encodeURIComponent(searchQuery)}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await page.waitForTimeout(2000);

        // Click first recipe link
        const firstLink = page.locator('article a, .post-title a, h2 a').first();
        const href = await firstLink.getAttribute("href").catch(() => null);
        if (href) {
          targetUrl = href;
        }
      }

      if (!targetUrl) {
        await page.close();
        continue;
      }

      process.stdout.write(`\r  [${captured + 1}] ${recipe.titulo.slice(0, 45).padEnd(45)}`);

      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(2000);

      // Try to find the recipe image
      const imageSelectors = [
        // JSON-LD / OG image first (download directly)
        'meta[property="og:image"]',
        // Common recipe image selectors
        ".wprm-recipe-image img",
        ".recipe-image img",
        ".tasty-recipes-image img",
        ".easyrecipe .recipe-image img",
        'img[class*="recipe"]',
        'img[class*="featured"]',
        ".post-thumbnail img",
        ".entry-content img[src*='uploads']",
        'article img[src*="wp-content"]',
        // Any large image in the article
        "article img",
        ".content img",
        "main img",
      ];

      let imageUrl: string | null = null;

      // Check og:image first
      const ogContent = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content")
        .catch(() => null);
      if (ogContent && ogContent.startsWith("http")) {
        imageUrl = ogContent;
      }

      // Try img selectors for direct screenshot
      if (!imageUrl) {
        for (const sel of imageSelectors) {
          if (sel.startsWith("meta")) continue;
          const img = page.locator(sel).first();
          const count = await img.count().catch(() => 0);
          if (count === 0) continue;

          const box = await img.boundingBox().catch(() => null);
          if (box && box.width > 200 && box.height > 150) {
            // Screenshot this element
            await img.screenshot({ path: destPath });
            if (fs.existsSync(destPath) && fs.statSync(destPath).size > 3000) {
              success = true;
              break;
            }
          }
        }
      }

      // Download og:image if we found one
      if (!success && imageUrl) {
        try {
          const res = await fetch(imageUrl, {
            headers: {
              "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              referer: new URL(targetUrl).origin,
            },
            signal: AbortSignal.timeout(10000),
          });
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            if (buffer.byteLength > 3000) {
              fs.writeFileSync(destPath, Buffer.from(buffer));
              success = true;
            }
          }
        } catch {}
      }

      // Last resort: screenshot the whole hero/header area
      if (!success) {
        const hero = page.locator("header, .hero, .post-header, article").first();
        const heroBox = await hero.boundingBox().catch(() => null);
        if (heroBox && heroBox.width > 300) {
          await hero.screenshot({ path: destPath });
          success = fs.existsSync(destPath) && fs.statSync(destPath).size > 3000;
        }
      }

      if (success) {
        recipe.imagen = publicPath;
        captured++;
        if (captured % 5 === 0) {
          fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2), "utf-8");
        }
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
    } finally {
      await page.close();
    }

    await sleep(500);
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2), "utf-8");
  await browser.close();

  console.log(`\n\n  ✅ Captured: ${captured}`);
  console.log(`  ⏭  Skipped (already good): ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📁 ${IMAGES_DIR}\n`);
}

main().catch(console.error);
