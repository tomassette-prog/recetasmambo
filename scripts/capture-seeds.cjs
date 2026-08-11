const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SEEDS = [
  { slug: 'sofrito-base-mambo', query: 'sofrito thermomix' },
  { slug: 'arroz-con-leche-mambo', query: 'arroz con leche thermomix' },
  { slug: 'pure-de-patatas-mambo', query: 'pure patatas thermomix' },
  { slug: 'cocido-madrileno-mambo', query: 'cocido madrileno thermomix' },
  { slug: 'bizcocho-de-yogur-mambo', query: 'bizcocho yogur thermomix' },
  { slug: 'guiso-de-carne-con-garbanzos-mambo', query: 'guiso carne garbanzos thermomix' },
  { slug: 'merluza-al-vapor-mambo', query: 'merluza vapor thermomix' },
  { slug: 'sopa-de-ajo-mambo', query: 'sopa de ajo thermomix' },
  { slug: 'pesto-casero-mambo', query: 'pesto casero thermomix' },
  { slug: 'lentejas-mambo', query: 'lentejas thermomix' },
  { slug: 'smoothie-de-frutas-rojas-mambo', query: 'smoothie frutas rojas' },
  { slug: 'pan-de-molde-mambo', query: 'pan molde thermomix' },
];

const IMG_DIR = path.join(process.cwd(), 'public', 'images', 'recipes');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let ok = 0;

  for (const seed of SEEDS) {
    const dest = path.join(IMG_DIR, seed.slug + '.jpg');
    try {
      await page.goto('https://www.thermorecetas.com/?s=' + encodeURIComponent(seed.query), { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      const link = await page.locator('article a, h2 a, .post-title a').first().getAttribute('href').catch(() => null);
      if (!link) { console.log('  ❌ ' + seed.slug + ' (no search result)'); continue; }

      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Try og:image
      const ogImg = await page.locator('meta[property="og:image"]').getAttribute('content').catch(() => null);
      if (ogImg) {
        const resp = await page.context().request.get(ogImg);
        const buf = await resp.body();
        if (buf.length > 3000) {
          fs.writeFileSync(dest, buf);
          console.log('  ✅ ' + seed.slug + ' (' + Math.round(buf.length/1024) + ' KB from og:image)');
          ok++;
          continue;
        }
      }

      // Fallback: screenshot the recipe image element
      const img = page.locator('.wprm-recipe-image img, .recipe-image img, article img').first();
      const box = await img.boundingBox().catch(() => null);
      if (box && box.width > 150) {
        await img.screenshot({ path: dest });
        if (fs.existsSync(dest) && fs.statSync(dest).size > 3000) {
          console.log('  ✅ ' + seed.slug + ' (screenshot)');
          ok++;
          continue;
        }
      }

      console.log('  ❌ ' + seed.slug + ' (no image found)');
    } catch (e) {
      console.log('  ❌ ' + seed.slug + ' (' + (e.message || '').substring(0, 60) + ')');
    }
  }

  await browser.close();
  console.log('\nDone: ' + ok + '/' + SEEDS.length + ' captured');
})();
