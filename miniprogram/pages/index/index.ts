import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'

const buildCards = (summerCoverUrl: string, winterCoverUrl: string) => [
  {
    id: 1,
    activityId: 'ai-camp-2026-copy',
    status: '报名中',
    statusClass: 'card-tag--active',
    subLabel: '',
    heroTitle: '',
    heroDesc: '',
    title: '【旗舰】2026暑假 - 少年独角兽AI创业营',
    meta: '6 天 · 深圳 / 杭州 / 北京 · 10-16 岁',
    coverUrl: summerCoverUrl,
    overlayStyle: '',
    themeClass: 'card-hero--light'
  },
  {
    id: 2,
    activityId: 'ai-camp-2026',
    status: '已结束',
    statusClass: 'card-tag--ended',
    subLabel: '',
    heroTitle: '',
    heroDesc: '',
    title: '【旗舰】2026寒假 - 少年独角兽AI创业营',
    meta: '6 天 · 深圳 · 10-16 岁',
    coverUrl: winterCoverUrl,
    overlayStyle: '',
    themeClass: 'card-hero--light'
  }
]

const defaultPosterUrls = getPosterFallbackUrls()
const defaultSummerCoverUrl =
  defaultPosterUrls['/assets/poster/summer-cover.png'] ||
  defaultPosterUrls['/assets/poster/youth-cover-list.png'] ||
  defaultPosterUrls['/assets/poster/01-cover.png'] ||
  ''
const defaultWinterCoverUrl =
  defaultPosterUrls['/assets/poster/winter-cover.png'] ||
  defaultPosterUrls['/assets/poster/01-cover.png'] ||
  defaultSummerCoverUrl
const logPrefix = '[index]'
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
    tabValue: 'activity',
    posterUrls: defaultPosterUrls,
    cards: buildCards(defaultSummerCoverUrl, defaultWinterCoverUrl)
  },
  lifetimes: {
    attached() {
      logInfo('attached start', {
        defaultSummerCoverUrl,
        defaultWinterCoverUrl,
        initialCards: this.data.cards.length
      })
      try {
        const info = wx.getSystemInfoSync()
        logInfo('system info', {
          model: info.model,
          system: info.system,
          platform: info.platform,
          version: info.version,
          SDKVersion: info.SDKVersion,
          windowWidth: info.windowWidth,
          windowHeight: info.windowHeight,
          screenWidth: info.screenWidth,
          screenHeight: info.screenHeight
        })
      } catch (error) {
        console.warn(logPrefix, 'getSystemInfoSync failed', error)
      }

      loadPosterUrls()
        .then((posterUrls) => {
          const summerCoverUrl =
            posterUrls['/assets/poster/summer-cover.png'] ||
            posterUrls['/assets/poster/youth-cover-list.png'] ||
            posterUrls['/assets/poster/01-cover.png'] ||
            defaultSummerCoverUrl
          const winterCoverUrl =
            posterUrls['/assets/poster/winter-cover.png'] ||
            posterUrls['/assets/poster/01-cover.png'] ||
            defaultWinterCoverUrl
          logInfo('poster urls loaded', {
            summerCoverUrl,
            winterCoverUrl,
            hasSummerCover: Boolean(posterUrls['/assets/poster/youth-cover-list.png']),
            hasWinterCover: Boolean(posterUrls['/assets/poster/01-cover.png']),
            total: Object.keys(posterUrls || {}).length
          })
          const cards = buildCards(summerCoverUrl, winterCoverUrl)
          this.setData(
            {
              posterUrls,
              cards
            },
            () => {
              logInfo('setData done', { cards: this.data.cards.length })
            }
          )
        })
        .catch((error) => {
          console.error(logPrefix, 'loadPosterUrls failed', error)
        })
    },
    ready() {
      logInfo('ready', { cards: this.data.cards.length })
    }
  },
  pageLifetimes: {
    show() {
      logInfo('page show', { cards: this.data.cards.length })
    }
  },
  methods: {
    onCardTap(e: WechatMiniprogram.BaseEvent) {
      const { activityId, id } = e.currentTarget.dataset as { activityId?: string; id?: number | string }
      const fallbackActivityId = this.data.cards.find((item) => `${item.id}` === `${id || ''}`)?.activityId || ''
      const resolvedActivityId = activityId || fallbackActivityId
      logInfo('card tap', { activityId, id, resolvedActivityId })
      if (!resolvedActivityId) {
        wx.showToast({
          title: '活动信息异常，请重试',
          icon: 'none'
        })
        return
      }
      wx.navigateTo({
        url: `/pages/detail/detail?activityId=${encodeURIComponent(resolvedActivityId)}`
      })
    },
    onTabChange(e: WechatMiniprogram.CustomEvent) {
      const value = e.detail.value
      logInfo('tab change', { value })
      if (value === this.data.tabValue) return
      if (value === 'mine') {
        wx.redirectTo({ url: '/pages/my/my' })
        return
      }
      this.setData({ tabValue: value })
    }
  }
})
