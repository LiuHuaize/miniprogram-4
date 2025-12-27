Component({
  data: {
    travelMode: '',
    travelModes: ['家长接送', '统一大巴', '自行前往', '其他'],
    pickerVisible: false
  },
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onOpenPicker() {
      this.setData({
        pickerVisible: true
      })
    },
    onClosePicker() {
      this.setData({
        pickerVisible: false
      })
    },
    onConfirmPicker(e: WechatMiniprogram.CustomEvent) {
      const value = e.detail.value
      const text = Array.isArray(value) ? value[0] : value
      this.setData({
        travelMode: text,
        pickerVisible: false
      })
    }
  }
})
