import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[PAGE ERROR LOG]', msg.text());
    }
  });
  
  page.on('pageerror', error => console.log('[PAGE EXCEPTION]', error.message, error.stack));
  
  console.log("Navigating to local dev server...");
  await page.goto('http://localhost:5173');
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Done.");
  await browser.close();
})();
