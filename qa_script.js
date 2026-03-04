const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/Users/flash/.gemini/antigravity/brain/99193fda-e6cd-461c-9e1c-95d6e37b95d8/qa_0.png' });
  
  for(let i=1; i<=10; i++) {
    await page.mouse.wheel({ deltaY: 600 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `/Users/flash/.gemini/antigravity/brain/99193fda-e6cd-461c-9e1c-95d6e37b95d8/qa_${i}.png` });
  }
  
  await browser.close();
})();
