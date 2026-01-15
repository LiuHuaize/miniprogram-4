import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'

const buildCards = (coverUrl: string) => [
  {
    id: 1,
    activityId: 'ai-camp-2026',
    status: '报名中',
    tagStyle: 'background: #dbeafe; color: #1d4ed8;',
    subLabel: '2026 AI 创业营',
    heroTitle: '少年独角兽',
    heroDesc: 'AI 创业营 · 深圳',
    title: '少年独角兽 AI 创业营（深圳）',
    meta: '6 天 · 深圳 · 10-16 岁',
    heroStyle: `background-image: url("${coverUrl}"); background-size: cover; background-position: center; background-repeat: no-repeat;`,
    overlayStyle: 'background: linear-gradient(180deg, rgba(30, 64, 175, 0.12), rgba(30, 64, 175, 0.55));',
    themeClass: 'card-hero--light'
  },
  {
    id: 2,
    activityId: 'open-day-2025',
    status: '已结束',
    tagStyle: 'background: #fdf3d1; color: #b77a08;',
    subLabel: '',
    heroTitle: 'OPEN DAY',
    heroDesc: '未来独角兽体验日',
    title: '2025 IDEA 教育开放日',
    meta: '1 天 · 上海 · 体验式课堂',
    heroStyle: 'background: linear-gradient(135deg, #fde68a 0%, #fcd34d 50%, #fdba74 100%);',
    overlayStyle: 'background: rgba(255, 255, 255, 0.2);',
    themeClass: 'card-hero--dark'
  },
  {
    id: 3,
    activityId: 'spring-hackathon-2026',
    status: '报名中',
    tagStyle: 'background: #e7f3f1; color: #2f7d75;',
    subLabel: '',
    heroTitle: '未来黑客松',
    heroDesc: '科技 + 商业双主题',
    title: '未来学习中心 · 26 年春季黑客松',
    meta: '3 天 · 北京 · 创新竞赛',
    heroStyle: 'background: linear-gradient(135deg, #0f172a 0%, #334155 55%, #64748b 100%);',
    overlayStyle: 'background: rgba(0, 0, 0, 0.2);',
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
              this.logLayout('after-setData')
            }
          )
        })
        .catch((error) => {
          console.error(logPrefix, 'loadPosterUrls failed', error)
        })
    },
    ready() {
      logInfo('ready', { cards: this.data.cards.length })
      this.logLayout('ready')
    }
  },
  pageLifetimes: {
    show() {
      logInfo('page show', { cards: this.data.cards.length })
      this.logLayout('page-show')
    }
  },
  methods: {
    logLayout(tag: string) {
      try {
        wx.nextTick(() => {
          const query = wx.createSelectorQuery().in(this)
          query.select('.scroll-area').boundingClientRect()
          query.select('.card-list').boundingClientRect()
          query.select('.card').boundingClientRect()
          query.exec((res) => {
            const [scrollArea, cardList, firstCard] = res || []
            logInfo(`layout ${tag}`, {
              scrollArea,
              cardList,
              firstCard
            })
          })
        })
      } catch (error) {
        console.warn(logPrefix, 'logLayout failed', error)
      }
    },
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
