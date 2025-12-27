Component({
  data: {
    tabs: [
      { key: 'theme', label: '主题' },
      { key: 'content', label: '内容' },
      { key: 'schedule', label: '课表' },
      { key: 'itinerary', label: '行程' },
      { key: 'stay', label: '食宿' },
      { key: 'service', label: '服务' }
    ],
    activeTab: 'theme',
    scrollTop: 0
  },
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onApply() {
      wx.navigateTo({
        url: '/pages/order-form/order-form'
      })
    },
    onTab(event: WechatMiniprogram.BaseEvent) {
      const { key } = event.currentTarget.dataset as { key?: string }
      if (!key || key === this.data.activeTab) {
        return
      }
      this.setData({
        activeTab: key,
        scrollTop: 0
      })
    }
  }
})
