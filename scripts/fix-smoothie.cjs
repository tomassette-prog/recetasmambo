const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const dest = path.join(process.cwd(), 'public', 'images', 'recipes', 'smoothie-de-frutas-rojas-mambo.jpg');

  await page.goto('https://www.thermorecetas.com/?s=smoothie', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  const link = await page.locator('article a, h2 a').first().getAttribute('href').catch(() => null);
  if (link) {
    await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content').catch(() => null);
    if (og) {
      const resp = await page.context().request.get(og);
      const buf = await resp.body();
      if (buf.length > 3000) {
        fs.writeFileSync(dest, buf);
        console.log('✅ smoothie from thermorecetas: ' + Math.round(buf.length / 1024) + ' KB');
        await browser.close();
        return;
      }
    }
  }

  // Fallback: download specific Unsplash photo
  const resp = await page.context().request.get('https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&h=600&fit=crop');
  const buf = await resp.body();
  fs.writeFileSync(dest, buf);
  console.log('✅ smoothie from Unsplash: ' + Math.round(buf.length / 1024) + ' KB');
  await browser.close();
})();
