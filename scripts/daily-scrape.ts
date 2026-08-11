#!/usr/bin/env node
/**
 * Daily scrape: runs automatically to fetch new recipes.
 * Add to cron: 0 3 * * * npx tsx scripts/daily-scrape.ts
 *
 * - Fetches new recipes from all configured sources
 * - Re-categorizes
 * - Redeploys to Vercel
 */

import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function run(cmd: string) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

async function main() {
  console.log("🍳 MamboRecetas — Daily Pipeline");
  console.log("─".repeat(50));

  // 1. Scrape new recipes (100 per source)
  run("npx tsx scripts/scrape-bulk.ts --limit 100");

  // 2. Enrich images (download from source pages)
  run("npx tsx scripts/enrich-images.ts --limit 100");

  // 3. Download images locally
  run("npx tsx scripts/download-images.ts --limit 100");

  // 4. Fix categories, encoding, and conversion rules
  run("npx tsx scripts/fix-recipes.ts");

  // 5. Generate social media posts for new recipes
  run("npx tsx scripts/social-media.ts");

  // 6. Commit changes
  try {
    run("git add -A");
    run('git commit -m "chore: daily scrape — new recipes + images + social posts"');
    run("git push");
  } catch {
    console.log("No changes to commit (no new recipes found)");
  }

  // 7. Redeploy to Vercel
  try {
    run("npx vercel --prod --yes");
  } catch {
    console.log("Vercel deploy failed (may need manual intervention)");
  }

  // 8. Report
  const data = JSON.parse(
    require("node:fs").readFileSync(
      require("node:path").join(ROOT, "data", "recipes.json"),
      "utf-8"
    )
  );
  console.log(`\n${"─".repeat(50)}`);
  console.log(`📊 Total recipes: ${data.length}`);
  console.log(`📅 Pipeline complete at ${new Date().toISOString()}`);
}

main().catch(console.error);
