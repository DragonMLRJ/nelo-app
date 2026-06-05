const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' });
    
    const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
    if (!rootHtml) {
      console.log('Root is empty!');
    } else {
      console.log('Root has content. Length:', rootHtml.length);
    }
    
    await browser.close();
  } catch (err) {
    console.error('Puppeteer failed:', err.message);
  }
})();
