const { setting, interval } = require('./config/config.js')
const puppeteer = require('puppeteer-core');
(async () => {
  console.log('開始監控Pixiv實況')
  const pixiv = require('./pixiv')
  let count = 1
  const browser = await puppeteer.launch(setting);
  await pixiv(browser)
  setInterval(async function () {
    console.log(`\n第${count++}次執行檢查，輸入ctrl+c結束錄影 ${new Date().toLocaleString()}`)
    await await pixiv(browser)
  }, interval)
})()