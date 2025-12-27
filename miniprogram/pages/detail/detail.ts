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
    scrollTop: 0,
    periods: [
      {
        id: 'p1',
        name: '第一期',
        date: '02/08 - 02/13',
        deadline: '2026.02.07',
        quota: '剩余名额：2'
      }
    ],
    selectedPeriodIndex: 0,
    periodPopupVisible: false
  },
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onApply() {
      const { periods, selectedPeriodIndex } = this.data
      const selected = periods[selectedPeriodIndex]
      const periodName = selected ? selected.name : ''
      const periodDate = selected ? selected.date : ''
      wx.navigateTo({
        url: `/pages/order-form/order-form?periodName=${encodeURIComponent(periodName)}&periodDate=${encodeURIComponent(periodDate)}`
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
    },
    onOpenPeriods() {
      this.setData({
        periodPopupVisible: true
      })
    },
    onClosePeriods() {
      this.setData({
        periodPopupVisible: false
      })
    },
    onSelectPeriod(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset as { index?: number }
      if (index === undefined) {
        return
      }
      this.setData({
        selectedPeriodIndex: index
      })
    },
    onConfirmPeriod() {
      this.setData({
        periodPopupVisible: false
      })
    }
  }
})
