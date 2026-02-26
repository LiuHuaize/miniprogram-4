import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'

type ActivityPeriod = {
  id: string
  name: string
  date: string
  fullDate: string
  deadline: string
  quota: string
  location: string
}

type ActivityConfig = {
  priceLabel: string
  applyClosed: boolean
  periods: ActivityPeriod[]
}

const defaultActivityId = 'ai-camp-2026'

const activityConfigMap: Record<string, ActivityConfig> = {
  'ai-camp-2026': {
    priceLabel: '¥16800',
    applyClosed: true,
    periods: [
      {
        id: 'sz-p1',
        name: '第一期（深圳）',
        date: '02/08 - 02/13',
        fullDate: '2026.02.08-02.13',
        deadline: '2026.02.07',
        quota: '名额情况：已结束',
        location: '深圳'
      }
    ]
  },
  'ai-camp-2026-copy': {
    priceLabel: '¥18800',
    applyClosed: false,
    periods: [
      {
        id: 'sz-p1',
        name: '第一期（深圳）',
        date: '07/13 - 07/18',
        fullDate: '2026.07.13-07.18',
        deadline: '2026.07.12',
        quota: '名额情况：招生中',
        location: '深圳'
      },
      {
        id: 'hz-p2',
        name: '第二期（杭州）',
        date: '07/27 - 08/01',
        fullDate: '2026.07.27-08.01',
        deadline: '2026.07.26',
        quota: '名额情况：招生中',
        location: '杭州'
      },
      {
        id: 'bj-p3',
        name: '第三期（北京）',
        date: '08/10 - 08/15',
        fullDate: '2026.08.10-08.15',
        deadline: '2026.08.09',
        quota: '名额情况：招生中',
        location: '北京'
      }
    ]
  }
}

const getActivityConfig = (activityId: string) => {
  return activityConfigMap[activityId] || activityConfigMap[defaultActivityId]
}

const getRouteActivityId = () => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
    options?: Record<string, string>
  }
  const rawActivityId = current?.options?.activityId
  if (!rawActivityId) {
    return ''
  }
  try {
    return decodeURIComponent(rawActivityId)
  } catch {
    return rawActivityId
  }
}

const defaultConfig = getActivityConfig(defaultActivityId)

Component({
  data: {
    activityId: defaultActivityId,
    posterUrls: getPosterFallbackUrls(),
    priceLabel: defaultConfig.priceLabel,
    applyClosed: defaultConfig.applyClosed,
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
    periods: defaultConfig.periods,
    selectedPeriodIndex: 0,
    periodPopupVisible: false
  },
  lifetimes: {
    attached() {
      this.syncActivityFromRoute()
      this.loadPosterUrls()
    }
  },
  pageLifetimes: {
    show() {
      this.syncActivityFromRoute()
    }
  },
  methods: {
    syncActivityFromRoute() {
      const routeActivityId = getRouteActivityId()
      const activityId = routeActivityId || this.data.activityId || defaultActivityId
      const config = getActivityConfig(activityId)
      const maxPeriodIndex = Math.max(0, config.periods.length - 1)
      const selectedPeriodIndex =
        activityId === this.data.activityId
          ? Math.max(0, Math.min(this.data.selectedPeriodIndex, maxPeriodIndex))
          : 0
      this.setData({
        activityId,
        priceLabel: config.priceLabel,
        applyClosed: config.applyClosed,
        periods: config.periods,
        selectedPeriodIndex
      })
    },
    onImageError(event: WechatMiniprogram.ImageErrorEvent) {
      const dataset = event.currentTarget.dataset as { src?: string }
      console.warn('image-load-failed', dataset?.src || '', event.detail?.errMsg || '')
    },
    loadPosterUrls() {
      loadPosterUrls().then((posterUrls) => {
        this.setData({ posterUrls })
      })
    },
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onApply() {
      if (this.data.applyClosed) {
        wx.showToast({
          title: '报名通道已截止',
          icon: 'none'
        })
        return
      }
      const { periods, selectedPeriodIndex, activityId } = this.data
      const selected = periods[selectedPeriodIndex]
      const periodId = selected ? selected.id : ''
      const periodName = selected ? selected.name : ''
      const periodDate = selected ? selected.date : ''
      wx.navigateTo({
        url: `/pages/order-form/order-form?periodId=${encodeURIComponent(periodId)}&periodName=${encodeURIComponent(periodName)}&periodDate=${encodeURIComponent(periodDate)}&activityId=${encodeURIComponent(activityId || '')}`
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
