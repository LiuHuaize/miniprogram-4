const logPrefix = '[order-detail]'
const logInfo = (message: string, payload?: unknown) => {
  try {
    if (payload !== undefined) {
      console.log(logPrefix, message, payload)
    } else {
      console.log(logPrefix, message)
    }
  } catch (error) {
    // ignore logging errors
  }
}

Component({
  lifetimes: {
    ready() {
      logInfo('ready')
      this.logLayout('ready')
    }
  },
  pageLifetimes: {
    show() {
      logInfo('page show')
      this.logLayout('page-show')
    }
  },
  methods: {
    logLayout(tag: string) {
      try {
        wx.nextTick(() => {
          const query = wx.createSelectorQuery().in(this)
          query.select('.scroll-area').boundingClientRect()
          query.exec((res) => {
            const [scrollArea] = res || []
            logInfo(`layout ${tag}`, {
              scrollArea
            })
          })
        })
      } catch (error) {
        console.warn(logPrefix, 'logLayout failed', error)
      }
    },
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    }
  }
})
