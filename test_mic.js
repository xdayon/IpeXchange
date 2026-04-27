import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    args: [
      '--no-sandbox', 
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ] 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[PAGE ERROR LOG]', msg.text());
    } else {
      console.log('[LOG]', msg.text());
    }
  });
  
  page.on('pageerror', error => console.log('[PAGE EXCEPTION]', error.message));
  
  console.log("Navigating to live site...");
  await page.goto('https://ipexchange.onrender.com');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Click the drawer button to open it (assuming it's accessible or we can trigger it)
  // Wait, the chat drawer might be closed. How to open it? 
  // Let's just find the button that opens it.
  console.log("Opening chat drawer...");
  const agentBtn = await page.$('.floating-action-button') || await page.$('.agent-button') || await page.$('.nav-item');
  if (agentBtn) await agentBtn.click();
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking mic button...");
  const micBtn = await page.$('.mic-btn');
  if (micBtn) {
    await micBtn.click();
    console.log("Clicked mic!");
  } else {
    console.log("Mic button not found.");
  }
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Done.");
  await browser.close();
})();
