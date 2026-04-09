let countdownTimer: number | null = null

Page({
  data: {
    countdown: 5
  },
  onLoad() {
    this.startCountdown()
  },
  onUnload() {
    this.clearCountdown()
  },
  onHide() {
    this.clearCountdown()
  },
  startCountdown() {
    this.clearCountdown()

    countdownTimer = setInterval(() => {
      const nextCountdown = this.data.countdown - 1
      if (nextCountdown <= 0) {
        this.setData({ countdown: 0 })
        this.clearCountdown()
        this.goHome()
        return
      }

      this.setData({
        countdown: nextCountdown
      })
    }, 1000) as unknown as number
  },
  clearCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  },
  onBack() {
    this.goHome()
  },
  onGoHome() {
    this.goHome()
  },
  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }
})
