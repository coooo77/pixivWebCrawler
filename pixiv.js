const { setting, url } = require('./config/config.json')
const nextPageSelector = '#AppContent > div.Notifications > div.Wall > div > div.WallLoadNext > button'
const { notification, StreamingUser, name, userId, pixivEngId } = {
  notification: 'div.WallItem',
  StreamingUser: 'div.NotificationBody > span > a:nth-child(2)',
  name: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.user > div.name',
  userId: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.socials > a:nth-child(1)',
  pixivEngId: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.follow-stats > div > a:nth-child(1)'
}
const { wait } = require('./util/helper')
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
    // const numOfNotification = await page.$$eval(notification, node => node.length)
    // 存取正在實況者數量
    const numOfStreamingUser = await page.$$eval(StreamingUser, node => node.length)

    if (numOfStreamingUser !== 0) {
      // 讀取所有實況者ID與實況網址   
      const streamersInfo = await page.$$eval(StreamingUser, nodes => nodes.map(node => {
        const children = node.parentElement.children
        const datasetUserId = children[0].dataset.userId
        const userName = children[0].innerText
        const { pathname, href } = children[1]
        const host = pathname.substring(2, pathname.indexOf('/', 1))
        return ({
          datasetUserId,
          userName,
          host,
          href
        })
      }))

      console.log(streamersInfo)

      // 取得想要錄製的使用者資料
      const fetchUsersData = fs.readFileSync('./model/usersData.json', 'utf8', (err, user) => user.toString())
      // 取得目前正在實況的使用者資料
      const fetchIsRecording = fs.readFileSync('./model/isRecording.json', 'utf8', (err, user) => user.toString())

      let [usersData, isRecording] = await Promise.all([fetchUsersData, fetchIsRecording])

      usersData = JSON.parse(usersData)
      isRecording = JSON.parse(isRecording)

      // console.log('usersData', usersData[0])
      console.log('isRecording', isRecording)

      // 比較isRecoding清單，如果實況者不在清單內就開始錄影
      for (streamer of streamersInfo) {

        if (!isRecording.some(user => user.datasetUserId === streamer.datasetUserId)) {
          // 先去點選Id，存取dataset-user-id相對應的userId
          const target = `a[data-user-id="${streamer.datasetUserId}"]`
          await wait(300)
          await page.waitForSelector(target, { visible: true })
          await page.click(target)
          await page.waitForSelector(pixivEngId, { visible: true })

          const gethName = page.$eval(name, node => node.innerText)
          const getUserId = page.$eval(userId, node => node.href.substring(23))
          const getPixivEngId = page.$eval(pixivEngId, node => {
            const str = node.pathname.substring(2)
            const cut = str.indexOf('/')
            return str.substr(0, cut)
          })

          const [fetchName, fetchUserId, fetchPixivEngId] = await Promise.all([
            gethName,
            getUserId,
            getPixivEngId
          ])

          console.log(fetchName, fetchUserId, fetchPixivEngId)
          const [user] = usersData.filter(user => user.userId === fetchUserId)

          // 如果名稱或英文名稱有變動，對照資料庫，更新
          if (user.name !== fetchName || user.pixivEngId !== fetchPixivEngId) {
            console.log('User Data changed, start to Update.')
            usersData = usersData.map(user => ({
              ...user,
              name: user.userId === fetchUserId ? fetchName : user.name,
              pixivEngId: user.userId === fetchUserId ? fetchPixivEngId : user.name
            }))
            // 將更新結果存檔，更新使用者名稱跟英文名稱
            await fs.writeFileSync(
              './model/usersData.json',
              JSON.stringify(usersData),
              'utf8',
              () => {
                console.log(`Users data updated.`)
              })
          }

          // 開始錄製
          // 檢查實況網址跟使用者英文ID是否相同
          // 是>使用者自己host的實況
          // 否>合作實況 

          await page.click(target)
          await page.waitForSelector(pixivEngId, { hidden: true })
        } else {
          console.log(`User ${streamer.userName} is streaming.`)
        }

      }

      // 更新isRecording
      isRecording = streamersInfo
      console.log('\nUpdate isRecording')
      console.log(isRecording)

    } else {
      console.log('No User is streaming.')
    }


  } catch (error) {
    console.error(error)
  }
})()