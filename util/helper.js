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
}

module.exports = helper