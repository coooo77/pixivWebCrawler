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

    const fetchTarget = {
      name: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.user > div.name',
      userId: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.socials > a:nth-child(1)',
      pixivEngId: '#root > div.Sidebar.visible > div.SidebarMain > div.SidebarMainBody > div.sidebarInside > div > div.UserHeaderBody > div > div.follow-stats > div > a:nth-child(1)'
    }

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
  }
}

module.exports = helper