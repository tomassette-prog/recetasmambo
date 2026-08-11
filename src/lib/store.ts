import fs from "node:fs";
import path from "node:path";
import type { Recipe } from "./types";
import { seedRecipes } from "./recipes-data";

const STORE_PATH = path.join(process.cwd(), "data", "recipes.json");

function loadFromFile(): Recipe[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    }
  } catch {}
  return [];
}

// Merge seed recipes with persisted ones (seeds as fallback)
let recipes: Recipe[] = (() => {
  const persisted = loadFromFile();
  const persistedSlugs = new Set(persisted.map((r) => r.slug));
  const seeds = seedRecipes.filter((r) => !persistedSlugs.has(r.slug));
  return [...seeds, ...persisted];
})();

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
    // Persist
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(recipes, null, 2), "utf-8");
    } catch {}
  }
}
