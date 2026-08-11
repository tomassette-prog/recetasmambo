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
  console.log("🍳 MamboRecetas — Daily Scrape");
  console.log("─".repeat(50));

  // 1. Scrape new recipes (50 per source)
  run("npx tsx scripts/scrape-bulk.ts --limit 50");

  // 2. Fix categories and encoding
  run("npx tsx scripts/fix-recipes.ts");

  // 3. Commit changes
  try {
    run('git add data/recipes.json');
    run('git commit -m "chore: daily scrape — new recipes added"');
  } catch {
    console.log("No changes to commit (no new recipes found)");
  }

  // 4. Redeploy to Vercel
  run("npx vercel --prod");

  console.log("\n✅ Daily scrape complete!");
}

main().catch(console.error);
