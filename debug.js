import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', async msg => {
    const args = await Promise.all(msg.args().map(a => a.jsonValue().catch(() => a.toString())));
    console.log(`[${msg.type().toUpperCase()}]`, ...args);
  });
  
  page.on('pageerror', error => console.log('[PAGE ERROR]', error.message));
  
  console.log("Navigating...");
  await page.goto('https://ipexchange.onrender.com');
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Done.");
  await browser.close();
})();
