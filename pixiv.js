const { url, userFilter, addNewUser } = require('./config/config.js')
const { nextPageSelector, StreamingUser } = {
  nextPageSelector: '#AppContent > div.Notifications > div.Wall > div > div.WallLoadNext > button',
  StreamingUser: 'div.NotificationBody > span > a:nth-child(2)'
}
const { fetchStreamingUser, upDateUser, getStreamInfo, upDateIsRecording, wait, startRecord } = require('./util/helper')
const fs = require('fs')

module.exports = (async (browser) => {
  try {
    const page = await browser.newPage();
    await page.goto(url.pixiv, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(nextPageSelector)
    const nextPageBtn = await page.$(nextPageSelector)
    if (nextPageBtn) nextPageBtn.click()

    // 存取正在實況者數量
    const numOfStreamingUser = await page.$$eval(StreamingUser, node => node.length)

    if (numOfStreamingUser !== 0) {
      // 讀取所有實況者ID與實況網址   
      const streamersInfo = await getStreamInfo(page, StreamingUser)

      // 取得目前正在實況的使用者資料isRecording
      let isRecording = await fs.readFileSync('./model/isStreaming.json', 'utf8', (err, user) => user.toString())
      isRecording = JSON.parse(isRecording)

      // 比較isRecoding清單，如果實況者不在清單內就開始錄影
      for (streamer of streamersInfo) {
        if (!isRecording.some(user => user.datasetUserId === streamer.datasetUserId)) {
          // 先去點選Id，存取dataset-user-id相對應的userId
          const fetchData = await fetchStreamingUser(page, streamer)
          const [fetchName, fetchUserId, fetchPixivEngId] = fetchData
          // 更新使用者資料後開始錄製
          // 需要要過濾使用者，取得想要錄製的使用者資料usersData
          let usersData = await fs.readFileSync('./model/usersData.json', 'utf8', (err, user) => user.toString())
          usersData = JSON.parse(usersData)
          const [user] = usersData.filter(user => user.userId === fetchUserId)
          await upDateUser(usersData, user, fetchData, addNewUser, userFilter)
          // 開始錄製
          // 檢查是否有設定過濾使用者
          if (userFilter) {
            if (user) {
              await startRecord(streamer, fetchPixivEngId, __dirname)
            } else {
              console.log(`${fetchData[0]} isn't target, abort recording process.`)
            }
          } else {
            // 沒有要過濾使用者，直接檢查Notification上的使用者
            await startRecord(streamer, fetchPixivEngId, __dirname)
          }

        } else {
          console.log(`User ${streamer.userName} is streaming.`)
        }
      }
      // 更新isRecording
      isRecording = streamersInfo
      console.log('\nUpdate isRecording')
      upDateIsRecording(isRecording)
    } else {
      console.log('No User is streaming.')
      isRecording = []
      upDateIsRecording(isRecording)
    }
    await wait(1000)
    await page.close()
  } catch (error) {
    console.error(error)
  }
})