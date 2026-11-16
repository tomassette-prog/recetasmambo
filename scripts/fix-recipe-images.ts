import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPES_PATH = path.join(process.cwd(), "data", "recipes.json");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMG_DIR = path.join(PUBLIC_DIR, "images", "recipes");

type Recipe = {
  slug: string;
  titulo: string;
  imagen: string;
  fuente_url?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hashBuf = (b: Buffer) => createHash("sha256").update(b).digest("hex");

const FALLBACK_HASHES = new Set<string>();
for (const f of fs.readdirSync(path.join(PUBLIC_DIR, "images", "categories"))) {
  FALLBACK_HASHES.add(hashBuf(fs.readFileSync(path.join(PUBLIC_DIR, "images", "categories", f))));
}

function knownHashes(): Set<string> {
  const set = new Set(FALLBACK_HASHES);
  if (fs.existsSync(IMG_DIR)) {
    for (const f of fs.readdirSync(IMG_DIR)) {
      set.add(hashBuf(fs.readFileSync(path.join(IMG_DIR, f))));
    }
  }
  return set;
}

async function fetchBytes(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const b = Buffer.from(await res.arrayBuffer());
    return b.length > 3000 ? b : null;
  } catch {
    return null;
  }
}

function candidatesFromHtml(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const push = (u: string | undefined | null) => {
    if (!u) return;
    try {
      const abs = new URL(u, baseUrl).toString();
      if (/\.(jpe?g|png|webp)(\?|$)/i.test(abs)) out.push(abs);
    } catch {
      /* URL inválida: ignorar */
    }
  };
  const og1 = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i.exec(html);
  push(og1?.[1]);
  const og2 = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
  push(og2?.[1]);
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) push(m[1]);
  return [...new Set(out)];
}

function extFromUrl(u: string): string {
  const m = /\.(jpe?g|png|webp)(\?|$)/i.exec(u);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function main() {
  const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf8")) as Recipe[];
  const known = knownHashes();
  let localized = 0;
  let replacedUnique = 0;
  let failed = 0;
  let ok = 0;
  let processed = 0;

  for (const r of recipes) {
    processed++;
    const isRemote = r.imagen.startsWith("http");
    const localPath = path.join(PUBLIC_DIR, r.imagen.replace(/^\//, ""));
    const exists = !isRemote && fs.existsSync(localPath);
    const shared = exists && FALLBACK_HASHES.has(hashBuf(fs.readFileSync(localPath)));

    if (!isRemote && exists && !shared) {
      ok++;
      continue;
    }
    if (!r.fuente_url) {
      failed++;
      continue;
    }

    const html = await (await fetch(r.fuente_url, { signal: AbortSignal.timeout(20000) }).catch(() => null))?.text() ?? "";
    const urls = candidatesFromHtml(html, r.fuente_url);
    if (isRemote && r.imagen) urls.unshift(r.imagen);

    let saved = false;
    for (const u of urls) {
      const bytes = await fetchBytes(u);
      if (!bytes) continue;
      const h = hashBuf(bytes);
      if (known.has(h)) continue;
      const file = `${r.slug}.${extFromUrl(u)}`;
      fs.mkdirSync(IMG_DIR, { recursive: true });
      fs.writeFileSync(path.join(IMG_DIR, file), bytes);
      known.add(h);
      r.imagen = `/images/recipes/${file}`;
      if (isRemote) localized++;
      else replacedUnique++;
      saved = true;
      break;
    }
    if (!saved) failed++;

    if (processed % 20 === 0) {
      console.log(`${processed}/${recipes.length} — localizadas ${localized} · únicas ${replacedUnique} · sin cambio ${failed}`);
      fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));
    }
    await sleep(400);
  }

  fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));
  console.log(`\nListo: ${localized} imágenes remotas localizadas · ${replacedUnique} duplicadas reemplazadas por foto propia · ${failed} sin cambio · ${ok} ya correctas`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
