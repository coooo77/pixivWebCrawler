const { setting, url } = require('./config/config.json')
const { fetchUsersData } = require('./util/helper')
const fs = require('fs')
const avatar = {
  img: '#HeaderBody > div > div.HeaderButtonsRight > div:nth-child(3) > div > div.DropdownTrigger.HeaderButtonUserIcon > button > div > div.MediaBody.background.circled',
  profile: "#HeaderBody > div > div.HeaderButtonsRight > div:nth-child(3) > div > div.DropdownContent > a:nth-child(1) > button",
  followings: '#AppContent > div:nth-child(5) > div:nth-child(1) > div > div.UserHeaderBody > div > div.follow-stats > div > a:nth-child(1) > span.value'
}
const puppeteer = require('puppeteer-core');


(async () => {
  try {

    const browser = await puppeteer.launch(setting);
    const page = await browser.newPage();
    await page.goto(url.pixiv, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector(avatar.img, { visible: true })
    await page.click(avatar.img)
    await page.waitForSelector(avatar.profile, { visible: true })
    await page.click(avatar.profile)
    await page.waitForSelector(avatar.followings, { visible: true })
    await Promise.all([
      page.click(avatar.followings),
      page.waitForNavigation()
    ])

    // 取得追蹤實況主的數量 followings
    const numOfFollowings = Number(await page.$eval(avatar.followings, node => node.innerText))
    // 開始取得使用者資料
    console.time('Record user data')
    const dataForDB = await fetchUsersData(page, numOfFollowings)
    console.timeEnd('Record user data')

    fs.writeFile(
      './model/usersData.json',
      JSON.stringify(dataForDB),
      'utf8',
      () => {
        console.log(`${dataForDB.length} users recorded in json file, stored in dir model.`)
      })

    await browser.close();
  } catch (error) {
    console.error(error)
  }
})();