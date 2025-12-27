Component({
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onGoHome() {
      wx.redirectTo({
        url: '/pages/index/index'
      })
    },
    onViewOrder() {
      wx.navigateTo({
        url: '/pages/order-detail/order-detail'
      })
    }
  }
})
