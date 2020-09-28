const { setting, url } = require('./config/config.json')
const nextPageSelector = '#AppContent > div.Notifications > div.Wall > div > div.WallLoadNext > button'
const { notification, StreamingUser } = {
  notification: 'div.WallItem',
  StreamingUser: 'div.NotificationBody > span > a:nth-child(2)'
}
const fs = require('fs')
const puppeteer = require('puppeteer-core');

(async () => {
  try {
    const browser = await puppeteer.launch(setting);
    const page = await browser.newPage();
    await page.goto(url.pixiv, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(nextPageSelector)
    const nextPageBtn = await page.$(nextPageSelector)
    if (nextPageBtn) nextPageBtn.click()

    // 存取Notification數量
    const numOfNotification = await page.$$eval(notification, node => node.length)
    // 存取正在實況者數量
    const numOfStreamingUser = await page.$$eval(StreamingUser, node => node.length)

    if (numOfStreamingUser !== 0) {
      // 讀取所有實況者ID與實況網址   
      const streamerIds = await page.$$eval(StreamingUser, nodes => nodes.map(node => {
        const children = node.parentElement.children
        const { userId } = children[0].dataset
        const { pathname, href } = children[1]
        const EngId = pathname.substring(2, pathname.indexOf('/', 1))
        return ({
          userId,
          EngId,
          href
        })
      }))

      console.log(streamerIds)

      // 取得想要錄製的使用者資料
      const fetchUsersData = fs.readFileSync('./model/usersData.json', 'utf8', (err, user) => user.toString())
      // 取得目前正在實況的使用者資料
      const fetchIsRecording = fs.readFileSync('./model/isRecording.json', 'utf8', (err, user) => user.toString())

      let [usersData, isRecording] = await Promise.all([fetchUsersData, fetchIsRecording])

      usersData = JSON.parse(usersData)
      isRecording = JSON.parse(isRecording)

      console.log('usersData', usersData[0])
      console.log('isRecording', isRecording)
    } else {
      console.log('No User is streaming.')
    }

  } catch (error) {
    console.error(error)
  }
})()