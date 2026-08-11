#!/usr/bin/env node
/**
 * Social media auto-poster for MamboRecetas.
 * Generates ready-to-post content for Twitter/X, Instagram, Pinterest.
 *
 * Usage: npx tsx scripts/social-media.ts [--recipe slug]
 *
 * Outputs:
 *   data/social-posts.json — queued posts
 *   Prints to console for manual posting
 */

import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "data", "recipes.json");
const POSTS_PATH = path.join(process.cwd(), "data", "social-posts.json");
const BASE_URL = "https://recetasmambo.com";

type SocialPost = {
  platform: "twitter" | "instagram" | "pinterest";
  text: string;
  url: string;
  hashtags: string[];
  image: string;
  recipeSlug: string;
  createdAt: string;
  posted: boolean;
};

function loadRecipes(): any[] {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

function loadPosts(): SocialPost[] {
  if (!fs.existsSync(POSTS_PATH)) return [];
  return JSON.parse(fs.readFileSync(POSTS_PATH, "utf-8"));
}

function savePosts(posts: SocialPost[]): void {
  const dir = path.dirname(POSTS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2), "utf-8");
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    "sopas-y-cremas": "🥣",
    arroces: "🍚",
    carnes: "🥩",
    pescados: "🐟",
    postres: "🍰",
    salsas: "🫙",
    "panes-masas": "🍞",
    verduras: "🥦",
    bebidas: "🥤",
    legumbres: "🫘",
  };
  return map[cat] || "🍳";
}

function generateTwitterPost(recipe: any): string {
  const emoji = getCategoryEmoji(recipe.categoria);
  const tips = recipe.pasos_mambo
    .filter((s: any) => s.accesorio === "Pala MamboMix")
    .slice(0, 1)
    .map((s: any) => `Con Pala MamboMix a Vel. ${s.velocidad}`)
    .join("");

  const lines = [
    `${emoji} ${recipe.titulo}`,
    ``,
    `⏱ ${recipe.tiempo_total_min} min · 👥 ${recipe.comensales} pax · ${recipe.dificultad}`,
    tips ? `💡 ${tips}` : "",
    ``,
    `Receta adaptada de Thermomix a Mambo Cooking Total Gourmet`,
    `${BASE_URL}/recetas/${recipe.slug}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function generateInstagramPost(recipe: any): string {
  const emoji = getCategoryEmoji(recipe.categoria);
  const ingredients = recipe.ingredientes.slice(0, 5).map((i: string) => `• ${i}`).join("\n");
  const hashtags = [
    "#mambocooking", "#cecotec", "#mamborecetas", "#recetasthermomix",
    "#cocinaconrobot", "#thermomix", "#recetasfaciles",
    `#${recipe.categoria.replace("-", "")}`,
  ].join(" ");

  return `${emoji} ${recipe.titulo}

${recipe.descripcion}

📝 Ingredientes principales:
${ingredients}
${recipe.ingredientes.length > 5 ? `... y ${recipe.ingredientes.length - 5} más` : ""}

⏱ ${recipe.tiempo_total_min} min · 👥 ${recipe.comensales} pax
📊 Dificultad: ${recipe.dificultad}

👉 Receta completa: ${BASE_URL}/recetas/${recipe.slug}

${hashtags}`;
}

function generatePinterestPost(recipe: any): { title: string; description: string; url: string; image: string } {
  return {
    title: `${recipe.titulo} — Receta Mambo Cooking Total Gourmet`,
    description: `${recipe.descripcion}\n\n⏱ ${recipe.tiempo_total_min} min · 👥 ${recipe.comensales} pax\n\nIngredientes: ${recipe.ingredientes.slice(0, 3).join(", ")}...\n\nReceta completa: ${BASE_URL}/recetas/${recipe.slug}`,
    url: `${BASE_URL}/recetas/${recipe.slug}`,
    image: recipe.imagen?.startsWith("http") ? recipe.imagen : `${BASE_URL}${recipe.imagen}`,
  };
}

function main() {
  const args = process.argv.slice(2);
  const slugIdx = args.indexOf("--recipe");
  const slug = slugIdx >= 0 ? args[slugIdx + 1] : null;

  const recipes = loadRecipes();
  const posts = loadPosts();
  const postedSlugs = new Set(posts.filter((p) => p.posted).map((p) => p.recipeSlug));

  const candidates = slug
    ? recipes.filter((r) => r.slug === slug)
    : recipes.filter((r) => !postedSlugs.has(r.slug)).slice(0, 3); // 3 recipes per batch

  if (candidates.length === 0) {
    console.log("No new recipes to post.");
    return;
  }

  const newPosts: SocialPost[] = [];
  const now = new Date().toISOString();

  for (const recipe of candidates) {
    // Twitter
    newPosts.push({
      platform: "twitter",
      text: generateTwitterPost(recipe),
      url: `${BASE_URL}/recetas/${recipe.slug}`,
      hashtags: ["mambocooking", "cecotec", "recetas", recipe.categoria],
      image: recipe.imagen,
      recipeSlug: recipe.slug,
      createdAt: now,
      posted: false,
    });

    // Instagram
    newPosts.push({
      platform: "instagram",
      text: generateInstagramPost(recipe),
      url: `${BASE_URL}/recetas/${recipe.slug}`,
      hashtags: ["mambocooking", "cecotec", "recetasthermomix"],
      image: recipe.imagen,
      recipeSlug: recipe.slug,
      createdAt: now,
      posted: false,
    });

    // Pinterest
    const pin = generatePinterestPost(recipe);
    newPosts.push({
      platform: "pinterest",
      text: pin.description,
      url: pin.url,
      hashtags: ["mambocooking", "recetas", recipe.categoria],
      image: pin.image,
      recipeSlug: recipe.slug,
      createdAt: now,
      posted: false,
    });

    console.log(`\n📱 Posts generated for: ${recipe.titulo}`);
    console.log(`   🐦 Twitter:\n${generateTwitterPost(recipe).split("\n").map((l) => `      ${l}`).join("\n")}`);
    console.log(`   📸 Instagram: ready`);
    console.log(`   📌 Pinterest: ready`);
  }

  posts.push(...newPosts);
  savePosts(posts);
  console.log(`\n✅ ${newPosts.length} posts saved to ${POSTS_PATH}`);
  console.log(`   Total queued: ${posts.filter((p) => !p.posted).length}`);
}

main();
