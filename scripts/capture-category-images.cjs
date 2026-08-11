const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CATEGORY_IMAGES = [
  { slug: 'sopas-y-cremas', query: 'crema de calabaza thermomix' },
  { slug: 'arroces', query: 'arroz paella thermomix' },
  { slug: 'carnes', query: 'estofado carne thermomix' },
  { slug: 'pescados', query: 'merluza pescado thermomix' },
  { slug: 'postres', query: 'bizcocho tarta thermomix' },
  { slug: 'salsas', query: 'salsa pesto thermomix' },
  { slug: 'panes-masas', query: 'pan casero thermomix' },
  { slug: 'verduras', query: 'verduras vapor thermomix' },
  { slug: 'bebidas', query: 'smoothie batido thermomix' },
  { slug: 'legumbres', query: 'lentejas garbanzos thermomix' },
];

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'categories');

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let ok = 0;

  for (const cat of CATEGORY_IMAGES) {
    const dest = path.join(OUT_DIR, cat.slug + '.jpg');
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      console.log('  ⏭  ' + cat.slug + ' (already exists)');
      ok++;
      continue;
    }

    try {
      await page.goto('https://www.thermorecetas.com/?s=' + encodeURIComponent(cat.query), {
        waitUntil: 'domcontentloaded', timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const link = await page.locator('article a, h2 a').first().getAttribute('href').catch(() => null);
      if (!link) { console.log('  ❌ ' + cat.slug + ' (no result)'); continue; }

      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      const og = await page.locator('meta[property="og:image"]').getAttribute('content').catch(() => null);
      if (og) {
        const resp = await page.context().request.get(og);
        const buf = await resp.body();
        if (buf.length > 3000) {
          fs.writeFileSync(dest, buf);
          console.log('  ✅ ' + cat.slug + ' (' + Math.round(buf.length / 1024) + ' KB)');
          ok++;
          continue;
        }
      }
      console.log('  ❌ ' + cat.slug + ' (no image)');
    } catch (e) {
      console.log('  ❌ ' + cat.slug + ' (' + (e.message || '').substring(0, 50) + ')');
    }
  }

  await browser.close();
  console.log('\nDone: ' + ok + '/' + CATEGORY_IMAGES.length);
})();
