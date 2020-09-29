const { setting, url } = require('./config/config.json')
const nextPageSelector = '#AppContent > div.Notifications > div.Wall > div > div.WallLoadNext > button'
const StreamingUser = 'div.NotificationBody > span > a:nth-child(2)'
const { fetchStreamingUser, fetchDBUsers, fetchDBIsRecording, upDateUser, getStreamInfo, recordStream, upDateIsRecording, wait } = require('./util/helper')

const puppeteer = require('puppeteer-core');

(async () => {
  try {
    const browser = await puppeteer.launch(setting);
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

      // console.log('streamersInfo', streamersInfo)

      // 取得想要錄製的使用者資料usersData
      // 取得目前正在實況的使用者資料isRecording
      let [usersData, isRecording] = await Promise.all([fetchDBUsers(), fetchDBIsRecording()])

      usersData = JSON.parse(usersData)
      isRecording = JSON.parse(isRecording)

      // console.log('isRecording', isRecording)

      // 比較isRecoding清單，如果實況者不在清單內就開始錄影
      for (streamer of streamersInfo) {
        if (!isRecording.some(user => user.datasetUserId === streamer.datasetUserId)) {
          // 先去點選Id，存取dataset-user-id相對應的userId
          const fetchData = await fetchStreamingUser(page, streamer)
          const [fetchName, fetchUserId, fetchPixivEngId] = fetchData

          await upDateUser(usersData, fetchData)
          // 開始錄製
          if (streamer.host !== fetchPixivEngId) {
            console.log(`${streamer.userName} join collaboration streaming, start to record`)
            await recordColStream(fetchPixivEngId, streamer.href, __dirname)
          } else {
            console.log(`${streamer.userName} is streaming, start to record`)
            await recordStream(fetchPixivEngId, __dirname)
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
})()