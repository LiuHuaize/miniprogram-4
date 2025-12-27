Component({
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    }
  }
})
