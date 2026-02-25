import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'

const buildCards = (coverUrl: string) => [
  {
    id: 1,
    activityId: 'ai-camp-2026',
    status: '已结束',
    tagStyle:
      'background: rgba(255, 255, 255, 0.9); color: #475569; border: 1px solid rgba(255, 255, 255, 0.55); box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);',
    subLabel: '2026 AI 创业营',
    heroTitle: '少年独角兽',
    heroDesc: 'AI 创业营 · 深圳',
    title: '少年独角兽 AI 创业营（深圳）',
    meta: '6 天 · 深圳 · 10-16 岁',
    heroStyle: `background-image: url("${coverUrl}"); background-size: cover; background-position: center; background-repeat: no-repeat;`,
    overlayStyle: 'background: linear-gradient(180deg, rgba(30, 64, 175, 0.12), rgba(30, 64, 175, 0.55));',
    themeClass: 'card-hero--light'
  }
]

const defaultPosterUrls = getPosterFallbackUrls()
const defaultCoverUrl = defaultPosterUrls['/assets/poster/01-cover.png'] || ''
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
    cards: buildCards(defaultCoverUrl)
  },
  lifetimes: {
    attached() {
      logInfo('attached start', {
        defaultCoverUrl,
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
          const coverUrl = posterUrls['/assets/poster/01-cover.png'] || defaultCoverUrl
          logInfo('poster urls loaded', {
            coverUrl,
            hasCover: Boolean(posterUrls['/assets/poster/01-cover.png']),
            total: Object.keys(posterUrls || {}).length
          })
          const cards = buildCards(coverUrl)
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
      const { activityId } = e.currentTarget.dataset as { activityId?: string }
      logInfo('card tap', { activityId })
      wx.navigateTo({
        url: `/pages/detail/detail?activityId=${encodeURIComponent(activityId || '')}`
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
