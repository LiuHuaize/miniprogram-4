import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'

const logPrefix = '[detail]'
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
  data: {
    activityId: '',
    posterUrls: getPosterFallbackUrls(),
    tabs: [
      { key: 'theme', label: '介绍' },
      { key: 'content', label: '核心收获' },
      { key: 'schedule', label: '日程' },
      { key: 'itinerary', label: '师资' },
      { key: 'stay', label: '保障' },
      { key: 'service', label: '流程' }
    ],
    activeTab: 'theme',
    scrollTop: 0,
    periods: [
      {
        id: 'p1',
        name: '第一期',
        date: '02/08 - 02/13',
        deadline: '2026.02.07',
        quota: '名额情况：咨询顾问'
      }
    ],
    selectedPeriodIndex: 0,
    periodPopupVisible: false
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
        options?: Record<string, string>
      }
      const activityId = current?.options?.activityId || ''
      if (activityId) {
        this.setData({ activityId })
      }
      logInfo('attached', { activityId })
      this.loadPosterUrls()
    },
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
    onImageError(event: WechatMiniprogram.ImageErrorEvent) {
      const dataset = event.currentTarget.dataset as { src?: string }
      console.warn('image-load-failed', dataset?.src || '', event.detail?.errMsg || '')
    },
    loadPosterUrls() {
      loadPosterUrls().then((posterUrls) => {
        this.setData({ posterUrls }, () => {
          logInfo('poster urls loaded', { total: Object.keys(posterUrls || {}).length })
          this.logLayout('after-setData')
        })
      })
    },
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
    },
    onApply() {
      const { periods, selectedPeriodIndex, activityId } = this.data
      const selected = periods[selectedPeriodIndex]
      const periodName = selected ? selected.name : ''
      const periodDate = selected ? selected.date : ''
      wx.navigateTo({
        url: `/pages/order-form/order-form?periodName=${encodeURIComponent(periodName)}&periodDate=${encodeURIComponent(periodDate)}&activityId=${encodeURIComponent(activityId || '')}`
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
