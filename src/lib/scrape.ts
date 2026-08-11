export type ScrapedRecipe = {
  title: string;
  ingredients: string[];
  servings?: string;
  time?: string;
  instructions: string[];
};

function extractJsonLdBlocks(html: string): string[] {
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    blocks.push(match[1]);
  }

  return blocks;
}

function parseJsonLdRecipe(html: string): ScrapedRecipe | null {
  const blocks = extractJsonLdBlocks(html);

  for (const raw of blocks) {
    try {
      const parsed = JSON.parse(raw);
      const nodes: any[] = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of nodes) {
        const graph: any[] = node?.["@graph"] ?? [];
        const candidates = [node, ...graph];

        const recipe = candidates.find(
          (c: any) =>
            c?.["@type"] === "Recipe" ||
            (Array.isArray(c?.["@type"]) && c["@type"].includes("Recipe"))
        );

        if (!recipe) continue;

        const title: string = recipe.name ?? "";
        const time: string | undefined =
          recipe.totalTime ?? recipe.cookTime ?? undefined;

        const servings: string | undefined = recipe.recipeYield
          ? Array.isArray(recipe.recipeYield)
            ? recipe.recipeYield[0]
            : String(recipe.recipeYield)
          : undefined;

        const ingredients: string[] = Array.isArray(recipe.recipeIngredient)
          ? recipe.recipeIngredient.map((i: any) => String(i))
          : [];

        const instructions: string[] = Array.isArray(recipe.recipeInstructions)
          ? recipe.recipeInstructions
              .map((i: any) => {
                if (typeof i === "string") return i;
                if (i?.["@type"] === "HowToStep")
                  return String(i.text ?? i.name ?? "");
                if (i?.itemListElement) {
                  return (i.itemListElement as any[])
                    .map((s: any) => String(s?.text ?? s?.name ?? ""))
                    .filter(Boolean)
                    .join("\n");
                }
                return "";
              })
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];

        return { title, ingredients, servings, time, instructions };
      }
    } catch {
      // ignore malformed blocks
    }
  }

  return null;
}

function between(html: string, startRe: RegExp, endRe: RegExp): string | null {
  const s = startRe.exec(html);
  if (!s) return null;
  const rest = html.slice(s.index);
  const e = endRe.exec(rest);
  return e ? rest.slice(0, e.index + e[0].length) : rest;
}

function extractListItems(section: string): string[] {
  const items: string[] = [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;

  while ((m = liRe.exec(section)) !== null) {
    const text = m[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text) items.push(text);
  }

  return items;
}

function extractH1(html: string): string {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return m
    ? m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : "";
}

function fallbackScrape(html: string): ScrapedRecipe {
  const title = extractH1(html);
  const body = html;

  const ingredientSection =
    between(body, /ingredientes|ingredients/i, /preparaci[oó]n|instructions|pasos|steps/i) ?? body;

  const instructionSection =
    between(body, /preparaci[oó]n|instructions|pasos|steps/i, /notas|notes|recetas relacionadas/i) ?? body;

  const ingredients = extractListItems(ingredientSection)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const instructions = extractListItems(instructionSection)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return { title, ingredients, instructions };
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`No se pudo obtener la URL: ${res.status}`);
  }

  const html = await res.text();
  return parseJsonLdRecipe(html) ?? fallbackScrape(html);
}
