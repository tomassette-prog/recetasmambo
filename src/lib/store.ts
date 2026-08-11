import fs from "node:fs";
import path from "node:path";
import type { Recipe } from "./types";
import { seedRecipes } from "./recipes-data";

// Import persisted recipes at build time (works in both dev and Vercel)
import persistedData from "../../data/recipes.json";

function loadPersisted(): Recipe[] {
  try {
    // At build time, use the imported JSON
    if (Array.isArray(persistedData)) return persistedData as Recipe[];
  } catch {}

  try {
    // Fallback: read from filesystem (dev mode with live reload)
    const storePath = path.join(process.cwd(), "data", "recipes.json");
    if (fs.existsSync(storePath)) {
      return JSON.parse(fs.readFileSync(storePath, "utf-8"));
    }
  } catch {}

  return [];
}

// Merge: persisted recipes first, then seeds that don't overlap
const persisted = loadPersisted();
const persistedSlugs = new Set(persisted.map((r) => r.slug));
const seeds = seedRecipes.filter((r) => !persistedSlugs.has(r.slug));
const recipes: Recipe[] = [...persisted, ...seeds];

export function getAllRecipes(): Recipe[] {
  return recipes;
}

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return recipes.find((r) => r.slug === slug);
}

export function getRecipesByCategory(category: string): Recipe[] {
  return recipes.filter((r) => r.categoria === category);
}

export function getFeaturedRecipes(): Recipe[] {
  return recipes.filter((r) => r.destacada);
}

export function searchRecipes(query: string): Recipe[] {
  const q = query.toLowerCase();
  return recipes.filter(
    (r) =>
      r.titulo.toLowerCase().includes(q) ||
      r.descripcion.toLowerCase().includes(q) ||
      r.ingredientes.some((i) => i.toLowerCase().includes(q))
  );
}

export function addRecipe(recipe: Recipe): void {
  const exists = recipes.find((r) => r.slug === recipe.slug);
  if (!exists) {
    recipes.push(recipe);
    // Persist to filesystem
    try {
      const storePath = path.join(process.cwd(), "data", "recipes.json");
      const dir = path.dirname(storePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(storePath, JSON.stringify(recipes, null, 2), "utf-8");
    } catch {}
  }
}
