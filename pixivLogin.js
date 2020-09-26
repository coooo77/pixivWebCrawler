const { setting, url } = require('./config/config.json')
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch(setting);
  const page = await browser.newPage();
  await page.goto(url.pixiv);
  // await browser.close();
})();