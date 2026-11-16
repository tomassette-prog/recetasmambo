// One-off: fix slug collisions and image stragglers left by fix-recipe-images.ts.
// 1. Renames second occurrence of colliding slugs to <slug>-2 (matches source URL).
// 2. Gives each straggler a unique photo from its source (incl. lazy-loaded images).
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPES_PATH = path.join(process.cwd(), "data", "recipes.json");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMG_DIR = path.join(PUBLIC_DIR, "images", "recipes");

const hashBuf = (b) => createHash("sha256").update(b).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const known = new Set();
for (const dir of [path.join(PUBLIC_DIR, "images", "categories"), IMG_DIR]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (/\.(jpe?g|png|webp)$/i.test(f)) known.add(hashBuf(fs.readFileSync(path.join(dir, f))));
  }
}

async function fetchBytes(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const b = Buffer.from(await res.arrayBuffer());
    return b.length > 3000 ? b : null;
  } catch {
    return null;
  }
}

function candidatesFromHtml(html, baseUrl) {
  const out = [];
  const push = (u) => {
    if (!u) return;
    try {
      const abs = new URL(u, baseUrl).toString();
      if (/\.(jpe?g|png|webp)(\?|$)/i.test(abs)) out.push(abs);
    } catch {}
  };
  for (const m of html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/gi)) push(m[1]);
  for (const m of html.matchAll(/<img[^>]+(?:data-lazy-src|data-src|data-original|src)=["']([^"']+)["']/gi)) push(m[1]);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(",")) push(part.trim().split(/\s+/)[0]);
  }
  return [...new Set(out)];
}

const extFromUrl = (u) => {
  const m = /\.(jpe?g|png|webp)(\?|$)/i.exec(u);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
};

async function uniqueImageFromSource(fuenteUrl) {
  const res = await fetch(fuenteUrl, { signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (!res || !res.ok) return null;
  const html = await res.text();
  for (const u of candidatesFromHtml(html, fuenteUrl)) {
    const bytes = await fetchBytes(u);
    if (!bytes) continue;
    const h = hashBuf(bytes);
    if (known.has(h)) continue;
    known.add(h);
    return { bytes, ext: extFromUrl(u) };
  }
  return null;
}

const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf8"));

// --- 1. slug collisions: rename the second occurrence ---
const seen = new Map();
for (const r of recipes) {
  if (!seen.has(r.slug)) {
    seen.set(r.slug, r);
    continue;
  }
  const base = r.slug;
  let n = 2;
  while (seen.has(`${base}-${n}`)) n++;
  const nuevo = `${base}-${n}`;
  console.log(`slug duplicado: ${base} -> ${nuevo} (${r.fuente_url})`);
  r.slug = nuevo;
  seen.set(nuevo, r);
}

// --- 2. image stragglers ---
const targets = recipes.filter(
  (r) =>
    r.imagen.startsWith("http") ||
    ["tarta-de-arroz-con-leche", "crema-de-guisantes-2", "bizcochitos-integrales-de-naranja-2"].includes(r.slug)
);

for (const r of targets) {
  await sleep(400);
  const found = await uniqueImageFromSource(r.fuente_url);
  if (!found) {
    console.log(`SIN FOTO UNICA: ${r.slug} (${r.imagen})`);
    continue;
  }
  const file = `${r.slug}.${found.ext}`;
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(path.join(IMG_DIR, file), found.bytes);
  r.imagen = `/images/recipes/${file}`;
  console.log(`OK: ${r.slug} -> ${r.imagen}`);
}

fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));
console.log("recipes.json actualizado");
