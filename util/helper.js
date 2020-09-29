const fetchTarget = {
  name: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.user > div.name',
  userId: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.socials > a:nth-child(1)',
  pixivEngId: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.follow-stats > div > a:nth-child(1)'
}
const fs = require('fs')

const helper = {
  wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
  },
  async scrollDownToBottom(page) {
    await page.evaluate(() =>
      new Promise((resolve, reject) => {
        let totalHeight = 0
        const scrollDistance = 200
        const timer = setInterval(() => {
          const bodyHeight = document.body.scrollHeight
          window.scrollBy(0, scrollDistance)
          totalHeight += scrollDistance
          if (totalHeight >= bodyHeight) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })
    )
  },
  async fetchUsersData(page, numOfFollowings) {
    const dataForDB = []
    for (let i = 0; i < numOfFollowings; i++) {
      await helper.wait(300)
      const profile = `div[data-wall-index="${i}"]  a.username`
      await page.waitForSelector(profile, { visible: true })
      const target = await page.$(profile)
      await target.click()

      const { pixivEngId, name, userId } = fetchTarget
      await page.waitForSelector(pixivEngId, { visible: true })

      const fetchName = page.$eval(name, node => node.innerText)
      const fetchUserId = page.$eval(userId, node => node.href.substring(23))
      const fetchPixivEngId = page.$eval(pixivEngId, node => {
        const str = node.pathname.substring(2)
        const cut = str.indexOf('/')
        return str.substr(0, cut)
      })

      const result = await Promise.all([
        fetchName,
        fetchUserId,
        fetchPixivEngId
      ])

      dataForDB.push({
        id: i,
        name: result[0],
        userId: result[1],
        pixivEngId: result[2],
        isRecording: false
      })
      await target.click()
      await page.waitForSelector(pixivEngId, { hidden: true })
    }

    return dataForDB
  },
  async fetchStreamingUser(page, streamer) {
    const { pixivEngId, name, userId } = fetchTarget
    const target = `a[data-user-id="${streamer.datasetUserId}"]`
    await helper.wait(300)
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
    await page.click(target)
    await page.waitForSelector(pixivEngId, { hidden: true })

    return ([fetchName, fetchUserId, fetchPixivEngId])
  },
  fetchDBUsers() {
    return fs.readFileSync('./model/usersData.json', 'utf8', (err, user) => user.toString())
  },
  fetchDBIsRecording() {
    return fs.readFileSync('./model/isRecording.json', 'utf8', (err, user) => user.toString())
  },
  async upDateUser(usersData, fetchData) {
    const [fetchName, fetchUserId, fetchPixivEngId] = fetchData
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
  },
  async getStreamInfo(page, StreamingUser) {
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
    return streamersInfo
  }
}

module.exports = helper