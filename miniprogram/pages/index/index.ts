import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'

const buildCards = (coverUrl: string) => [
  {
    id: 1,
    activityId: 'ai-camp-2026-copy',
    status: '报名中',
    tagStyle: 'background: #ecfdf3; color: #15803d; border: 1px solid #bbf7d0;',
    subLabel: '2026 AI 创业营',
    heroTitle: '少年独角兽',
    heroDesc: 'AI 创业营 · 深圳 / 杭州 / 北京',
    title: '少年独角兽 AI 创业营（深圳 / 杭州 / 北京）',
    meta: '6 天 · 深圳 / 杭州 / 北京 · 10-16 岁',
    heroStyle: `background-image: url("${coverUrl}"); background-size: cover; background-position: center; background-repeat: no-repeat;`,
    overlayStyle: 'background: linear-gradient(180deg, rgba(30, 64, 175, 0.12), rgba(30, 64, 175, 0.55));',
    themeClass: 'card-hero--light'
  },
  {
    id: 2,
    activityId: 'ai-camp-2026',
    status: '已结束',
    tagStyle: 'background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0;',
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
