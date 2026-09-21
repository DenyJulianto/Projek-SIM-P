const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'superadmin@simpendidikan.local');
  await page.fill('input[type="password"]', '0992f6e9ac3d71c0bbaa0ac9');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  await page.locator('text=Data Sekolah').nth(1).click();
  await page.waitForTimeout(800);

  await page.fill('input[placeholder="sman1-jakarta"]', 'sman-route-test');
  await page.fill('input[placeholder="sman1-jakarta.simpendidikan.test"]', 'sman-route-test.localhost');
  await page.locator('label:has-text("Nama Sekolah") input').fill('SMAN Route Test');

  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/sekolah') && r.request().method() === 'POST', { timeout: 20000 }),
    page.click('button:has-text("Simpan")'),
  ]).then(([res]) => console.log('POST status:', res.status()));
  await page.waitForTimeout(300);

  const linkText = await page.locator('p.font-mono').textContent();
  console.log('login url shown:', linkText);

  // Now visit the root landing page for the new tenant directly
  await page.goto(linkText, { waitUntil: 'networkidle', timeout: 15000 }).catch(e => console.log('goto error:', e.message));
  await page.waitForTimeout(1500);
  console.log('current url:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('body text length:', bodyText.length);
  console.log('body text:', JSON.stringify(bodyText.slice(0, 500)));
  await page.screenshot({ path: 'tmp_diag_root.png', fullPage: true });

  await browser.close();
})();
