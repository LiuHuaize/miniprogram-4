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
  detailTitle: string
  durationLabel: string
  ageLabel: string
  infoTip: string
  heroImageUrl?: string
}

type TeacherContact = {
  name: string
  phone: string
}

type WeekendMediaConfig = {
  coverPath: string
  themePath: string
  contentPaths: string[]
  workPaths: string[]
}

const defaultActivityId = 'ai-camp-2026-copy'

type DetailTab = {
  key: string
  label: string
}

const winterTabs: DetailTab[] = [
  { key: 'theme', label: '介绍' },
  { key: 'content', label: '核心收获' },
  { key: 'schedule', label: '日程' },
  { key: 'itinerary', label: '师资' },
  { key: 'stay', label: '保障' },
  { key: 'service', label: '流程' }
]

const summerTabs: DetailTab[] = [
  { key: 'theme', label: '主题' },
  { key: 'content', label: '内容' },
  { key: 'notice', label: '须知' },
  { key: 'schedule', label: '课表' },
  { key: 'service', label: '服务' },
  { key: 'itinerary', label: '师资介绍' }
]

const weekendTabs: DetailTab[] = [
  { key: 'theme', label: '主题' },
  { key: 'content', label: '内容' },
  { key: 'works', label: '作品' }
]

const futureTabs: DetailTab[] = [
  { key: 'content', label: '内容' },
  { key: 'gains', label: '收获' },
  { key: 'schedule', label: '课表' },
  { key: 'itinerary', label: '师资' },
  { key: 'service', label: '服务' }
]

const weekendActivityIds = ['ai-weekend-2026', 'ai-weekend-2026-pm']

const weekendMediaMap: Record<string, WeekendMediaConfig> = {
  'ai-weekend-2026': {
    coverPath: '/assets/poster/weekend-cover.png',
    themePath: '/assets/poster/weekend-theme.jpg',
    contentPaths: ['/assets/poster/weekend-content.jpg'],
    workPaths: [
      '/assets/poster/weekend-work-1.jpg',
      '/assets/poster/weekend-work-2.jpg',
      '/assets/poster/weekend-work-3.jpg'
    ]
  },
  'ai-weekend-2026-pm': {
    coverPath: '/assets/poster/weekend2-cover.png',
    themePath: '/assets/poster/weekend2-theme.jpg',
    contentPaths: [
      '/assets/poster/weekend2-content.jpg',
      '/assets/poster/weekend2-content-2.jpg',
      '/assets/poster/weekend2-content-3.jpg',
      '/assets/poster/weekend2-content-4.jpg',
      '/assets/poster/weekend2-content-5.jpg',
      '/assets/poster/weekend2-content-6.jpg'
    ],
    workPaths: ['/assets/poster/weekend2-work-1.jpg', '/assets/poster/weekend2-work-2.jpg']
  }
}

const getWeekendMediaByActivityId = (activityId: string) => {
  return weekendMediaMap[activityId] || weekendMediaMap['ai-weekend-2026']
}

const isFutureActivity = (activityId: string) => activityId === 'ai-challenge-2025-hz'
const isSummerActivity = (activityId: string) => activityId === 'ai-camp-2026-copy'
const isWeekendActivity = (activityId: string) => weekendActivityIds.includes(activityId)
const isWinterActivity = (activityId: string) =>
  !isFutureActivity(activityId) && !isSummerActivity(activityId) && !isWeekendActivity(activityId)

const getHeroCoverPath = (activityId: string) => {
  if (isFutureActivity(activityId)) return '/assets/poster/future-unicorn-cover.png'
  if (isSummerActivity(activityId)) return '/assets/poster/youth-cover-detail.png'
  if (isWeekendActivity(activityId)) return getWeekendMediaByActivityId(activityId).coverPath
  return '/assets/poster/01-cover.png'
}

const getTabsByActivityId = (activityId: string) => {
  if (isFutureActivity(activityId)) {
    return futureTabs
  }
  if (isWeekendActivity(activityId)) {
    return weekendTabs
  }
  return isSummerActivity(activityId) ? summerTabs : winterTabs
}

const getCampSeriesLabel = (activityId: string) => {
  if (isFutureActivity(activityId)) {
    return 'FLAGSHIP CHALLENGE CAMP'
  }
  if (isSummerActivity(activityId)) {
    return 'FLAGSHIP SUMMER CAMP'
  }
  if (isWeekendActivity(activityId)) {
    return 'WEEKEND WORKSHOP'
  }
  return 'FLAGSHIP WINTER CAMP'
}

const getPriceNoteByActivityId = (activityId: string) => {
  return isWeekendActivity(activityId) ? '/ 场' : '/ 人'
}

const splitPriceLabel = (priceLabel: string) => {
  const match = priceLabel.match(/^([^\d]*)([\d.,]+)(.*)$/)
  if (!match) {
    return {
      priceUnit: '',
      priceValue: priceLabel
    }
  }
  return {
    priceUnit: match[1] || '',
    priceValue: match[2] || priceLabel
  }
}

const activityConfigMap: Record<string, ActivityConfig> = {
  'ai-weekend-2026': {
    priceLabel: '¥498',
    applyClosed: true,
    detailTitle: '【周末工作坊】AI设计个性化学习产品',
    durationLabel: '4 小时',
    ageLabel: '8-16 岁',
    infoTip: '8-16 岁 · 半天周末营',
    periods: [
      {
        id: 'sz-weekend-p1',
        name: '周末营 · AI解决学习痛点（深圳）',
        date: '01/17 13:30 - 17:30',
        fullDate: '2026.01.17 13:30-17:30',
        deadline: '2026.01.16',
        quota: '名额情况：已结束',
        location: '深圳'
      }
    ]
  },
  'ai-weekend-2026-pm': {
    priceLabel: '¥498',
    applyClosed: true,
    detailTitle: '【周末工作坊】化身小小西游AI产品经理',
    durationLabel: '4 小时',
    ageLabel: '8-16 岁',
    infoTip: '8-16 岁 · 半天周末营',
    periods: [
      {
        id: 'sz-weekend-p2',
        name: '周末营 · AI产品经理（深圳）',
        date: '01/02 13:30 - 17:30',
        fullDate: '2026.01.02 13:30-17:30',
        deadline: '2026.01.01',
        quota: '名额情况：已结束',
        location: '深圳'
      }
    ]
  },
  'ai-challenge-2025-hz': {
    priceLabel: '¥18800',
    applyClosed: true,
    detailTitle: '【旗舰】2025暑假 - 少年独角兽AI创业营',
    durationLabel: '6 天',
    ageLabel: '9-16 岁',
    infoTip: '9-16 岁 · 6 天 5 晚',
    heroImageUrl:
      'https://636c-cloudbase-9g9y5ajj044396e0-1395213680.tcb.qcloud.la/ai-challenge-2025-hz-upload/future-unicorn-hero-cover-logo.png',
    periods: [
      {
        id: 'hz-p1',
        name: '第一期（杭州）',
        date: '07/21 - 07/26',
        fullDate: '2025.07.21-07.26',
        deadline: '2025.07.20',
        quota: '名额情况：已结束',
        location: '杭州'
      }
    ]
  },
  'ai-camp-2026': {
    priceLabel: '¥18800',
    applyClosed: true,
    detailTitle: '【旗舰】2026寒假 - 少年独角兽AI创业营',
    durationLabel: '6 天',
    ageLabel: '10-16 岁',
    infoTip: '10-16 岁 · 6 天 5 晚',
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
    detailTitle: '【旗舰】2026暑假 - 少年独角兽AI创业营',
    durationLabel: '6 天',
    ageLabel: '10-16 岁',
    infoTip: '10-16 岁 · 6 天 5 晚',
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
const defaultTabs = getTabsByActivityId(defaultActivityId)
const defaultWeekendMedia = getWeekendMediaByActivityId(defaultActivityId)
const defaultPrice = splitPriceLabel(defaultConfig.priceLabel)

Component({
  data: {
    activityId: defaultActivityId,
    posterUrls: getPosterFallbackUrls(),
    heroCoverPath: getHeroCoverPath(defaultActivityId),
    priceLabel: defaultConfig.priceLabel,
    priceUnit: defaultPrice.priceUnit,
    priceValue: defaultPrice.priceValue,
    priceNote: getPriceNoteByActivityId(defaultActivityId),
    applyClosed: defaultConfig.applyClosed,
    detailTitle: defaultConfig.detailTitle,
    durationLabel: defaultConfig.durationLabel,
    ageLabel: defaultConfig.ageLabel,
    infoTip: defaultConfig.infoTip,
    campSeriesLabel: getCampSeriesLabel(defaultActivityId),
    isFutureCamp: isFutureActivity(defaultActivityId),
    isSummerCamp: isSummerActivity(defaultActivityId),
    isWeekendCamp: isWeekendActivity(defaultActivityId),
    isWinterCamp: isWinterActivity(defaultActivityId),
    weekendThemePath: defaultWeekendMedia.themePath,
    weekendContentPaths: defaultWeekendMedia.contentPaths,
    weekendWorkPaths: defaultWeekendMedia.workPaths,
    tabs: defaultTabs,
    activeTab: defaultTabs[0]?.key || 'theme',
    scrollTop: 0,
    periods: defaultConfig.periods,
    selectedPeriodIndex: 0,
    periodPopupVisible: false,
    heroImageUrl: '',
    teacherPopupVisible: false,
    teacherContacts: [
      {
        name: '小布老师',
        phone: '18316547542'
      },
      {
        name: '彤彤老师',
        phone: '13320338000'
      }
    ] as TeacherContact[]
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
      const priceParts = splitPriceLabel(config.priceLabel)
      const tabs = getTabsByActivityId(activityId)
      const weekendMedia = getWeekendMediaByActivityId(activityId)
      const activeTabFallback = tabs[0]?.key || 'theme'
      const activeTab =
        activityId === this.data.activityId && tabs.some((item) => item.key === this.data.activeTab)
          ? this.data.activeTab
          : activeTabFallback
      const maxPeriodIndex = Math.max(0, config.periods.length - 1)
      const selectedPeriodIndex =
        activityId === this.data.activityId
          ? Math.max(0, Math.min(this.data.selectedPeriodIndex, maxPeriodIndex))
          : 0
      this.setData({
        activityId,
        priceLabel: config.priceLabel,
        priceUnit: priceParts.priceUnit,
        priceValue: priceParts.priceValue,
        priceNote: getPriceNoteByActivityId(activityId),
        applyClosed: config.applyClosed,
        detailTitle: config.detailTitle,
        durationLabel: config.durationLabel,
        ageLabel: config.ageLabel,
        infoTip: config.infoTip,
        campSeriesLabel: getCampSeriesLabel(activityId),
        isFutureCamp: isFutureActivity(activityId),
        isSummerCamp: isSummerActivity(activityId),
        isWeekendCamp: isWeekendActivity(activityId),
        isWinterCamp: isWinterActivity(activityId),
        weekendThemePath: weekendMedia.themePath,
        weekendContentPaths: weekendMedia.contentPaths,
        weekendWorkPaths: weekendMedia.workPaths,
        heroCoverPath: getHeroCoverPath(activityId),
        tabs,
        activeTab,
        periods: config.periods,
        selectedPeriodIndex,
        heroImageUrl: config.heroImageUrl || ''
      })
    },
    onImageError() {},
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
          title: '报名通道已结束',
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
    },
    onOpenTeacherPopup() {
      this.setData({
        teacherPopupVisible: true
      })
    },
    onCloseTeacherPopup() {
      this.setData({
        teacherPopupVisible: false
      })
    }
  }
})
