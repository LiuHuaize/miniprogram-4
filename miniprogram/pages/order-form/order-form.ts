Component({
  data: {
    summary: {
      title: 'IDEAS X SANYA：2026 三亚商业 & 探险研学',
      sub: '约 6 天 · 三亚 · 海南',
      price: '17800.00'
    },
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
    periodPopupVisible: false,
    campers: [
      {
        id: '',
        name: '',
        gender: '',
        birthday: '',
        idNo: ''
      }
    ],
    maxCampers: 6,
    travelMode: '',
    travelModes: [
      { label: '家长接送', value: '家长接送' },
      { label: '统一大巴', value: '统一大巴' },
      { label: '自行前往', value: '自行前往' },
      { label: '其他', value: '其他' }
    ],
    pickerVisible: false
  },
  pageLifetimes: {
    show() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
        options?: Record<string, string>
      }
      const options = current?.options || {}
      const periodName = options.periodName ? decodeURIComponent(options.periodName) : ''
      const periodDate = options.periodDate ? decodeURIComponent(options.periodDate) : ''
      if (periodName) {
        const index = this.data.periods.findIndex((item) => item.name === periodName)
        if (index !== -1) {
          this.setData({
            selectedPeriodIndex: index
          })
        }
      }
      if (periodDate) {
        const period = this.data.periods[this.data.selectedPeriodIndex]
        if (period && period.date !== periodDate) {
          const periods = this.data.periods.map((item, index) => {
            if (index === this.data.selectedPeriodIndex) {
              return {
                ...item,
                date: periodDate
              }
            }
            return item
          })
          this.setData({ periods })
        }
      }
    }
  },
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onChoosePeriod() {
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
    },
    onChangeCount(event: WechatMiniprogram.BaseEvent) {
      const { type } = event.currentTarget.dataset as { type?: 'plus' | 'minus' }
      if (!type) {
        return
      }
      const current = this.data.campers.length
      let next = current + (type === 'plus' ? 1 : -1)
      next = Math.max(1, Math.min(this.data.maxCampers, next))
      if (next === current) {
        return
      }
      const campers = this.data.campers.slice(0, next)
      while (campers.length < next) {
        campers.push({
          id: '',
          name: '',
          gender: '',
          birthday: '',
          idNo: ''
        })
      }
      this.setData({
        campers
      })
    },
    onOpenCamper(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset as { index?: number }
      if (index === undefined) {
        return
      }
      const camper = this.data.campers[index]
      wx.navigateTo({
        url: `/pages/camper-list/camper-list?index=${index}&selectedId=${encodeURIComponent(camper.id || '')}`,
        events: {
          selected: (payload: { index: number; camper: { id: string; name: string; gender: string; birthday: string; idNo: string } }) => {
            const campers = [...this.data.campers]
            if (campers[payload.index]) {
              campers[payload.index] = payload.camper
              this.setData({ campers })
            }
          }
        },
        success: () => {}
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
      const label = e.detail.label
      const text = Array.isArray(label) ? label[0] : label
      this.setData({
        travelMode: text,
        pickerVisible: false
      })
    }
  }
})
