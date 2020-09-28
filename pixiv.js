const { setting, url } = require('./config/config.json')
const nextPageSelector = '#AppContent > div.Notifications > div.Wall > div > div.WallLoadNext > button'
const puppeteer = require('puppeteer-core');

(async () => {
  try {
    const browser = await puppeteer.launch(setting);
    const page = await browser.newPage();
    await page.goto(url.pixiv, { waitUntil: 'domcontentloaded' });
    const nextPageBtn = await page.$(nextPageSelector)
    if (nextPageBtn) nextPageBtn.click()

    
  } catch (error) {
    console.error(error)
  }
})()