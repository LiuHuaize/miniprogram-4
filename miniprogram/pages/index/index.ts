import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'

const buildCards = (
  weekendCoverUrl: string,
  weekendPmCoverUrl: string,
  futureCoverUrl: string,
  summerCoverUrl: string,
  winterCoverUrl: string
) => [
    {
      id: 2,
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
      id: 3,
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
    },
    {
      id: 4,
      activityId: 'ai-weekend-2026-pm',
      status: '已结束',
      statusClass: 'card-tag--ended',
      subLabel: '',
      heroTitle: '',
      heroDesc: '',
      title: '【周末工作坊】化身小小西游AI产品经理',
      meta: '4 小时 · 深圳 · 8-16 岁',
      coverUrl: weekendPmCoverUrl,
      overlayStyle: '',
      themeClass: 'card-hero--light'
    },
    {
      id: 5,
      activityId: 'ai-weekend-2026',
      status: '已结束',
      statusClass: 'card-tag--ended',
      subLabel: '',
      heroTitle: '',
      heroDesc: '',
      title: '【周末工作坊】AI设计个性化学习产品',
      meta: '4 小时 · 深圳 · 8-16 岁',
      coverUrl: weekendCoverUrl,
      overlayStyle: '',
      themeClass: 'card-hero--light'
    },
    {
      id: 1,
      activityId: 'ai-challenge-2025-hz',
      status: '已结束',
      statusClass: 'card-tag--ended',
      subLabel: '',
      heroTitle: '',
      heroDesc: '',
      title: '【旗舰】2025暑假 - 少年独角兽AI创业营',
      meta: '6 天 · 杭州 · 9-16 岁',
      coverUrl: futureCoverUrl,
      overlayStyle: '',
      themeClass: 'card-hero--light'
    }
  ]

const defaultPosterUrls = getPosterFallbackUrls()
const defaultWeekendCoverUrl =
  defaultPosterUrls['/assets/poster/weekend-cover.png'] ||
  defaultPosterUrls['/assets/poster/01-cover.png'] ||
  ''
const defaultWeekendPmCoverUrl =
  defaultPosterUrls['/assets/poster/weekend2-cover.png'] ||
  defaultPosterUrls['/assets/poster/weekend-cover.png'] ||
  defaultPosterUrls['/assets/poster/01-cover.png'] ||
  ''
const defaultFutureCoverUrl =
  defaultPosterUrls['/assets/poster/future-unicorn-cover.png'] ||
  defaultPosterUrls['/assets/poster/future-unicorn-content.png'] ||
  defaultPosterUrls['/assets/poster/01-cover.png'] ||
  ''
const defaultSummerCoverUrl =
  defaultPosterUrls['/assets/poster/summer-cover.png'] ||
  defaultPosterUrls['/assets/poster/youth-cover-list.png'] ||
  defaultPosterUrls['/assets/poster/01-cover.png'] ||
  ''
const defaultWinterCoverUrl =
  defaultPosterUrls['/assets/poster/winter-cover.png'] ||
  defaultPosterUrls['/assets/poster/01-cover.png'] ||
  defaultSummerCoverUrl

const applyCardFilters = (
  cards: ReturnType<typeof buildCards>,
  typeFilter: string,
  keyword: string
) => {
  const normalizedKeyword = keyword.trim().toLowerCase()

  return cards.filter((card) => {
    const matchType =
      typeFilter === '创业营'
        ? card.title.includes('旗舰') || card.title.includes('创业营')
        : typeFilter === '周末工作坊'
          ? card.title.includes('周末工作坊')
          : true
    const matchKeyword = normalizedKeyword
      ? card.title.toLowerCase().includes(normalizedKeyword)
      : true

    return matchType && matchKeyword
  })
}

Component({
  data: {
    tabValue: 'activity',
    posterUrls: defaultPosterUrls,
    allCards: buildCards(
      defaultWeekendCoverUrl,
      defaultWeekendPmCoverUrl,
      defaultFutureCoverUrl,
      defaultSummerCoverUrl,
      defaultWinterCoverUrl
    ),
    cards: buildCards(
      defaultWeekendCoverUrl,
      defaultWeekendPmCoverUrl,
      defaultFutureCoverUrl,
      defaultSummerCoverUrl,
      defaultWinterCoverUrl
    ),
    currentTypeFilter: '类型',
    searchKeyword: ''
  },
  lifetimes: {
    attached() {
      loadPosterUrls()
        .then((posterUrls) => {
          const weekendCoverUrl =
            posterUrls['/assets/poster/weekend-cover.png'] ||
            posterUrls['/assets/poster/01-cover.png'] ||
            defaultWeekendCoverUrl
          const weekendPmCoverUrl =
            posterUrls['/assets/poster/weekend2-cover.png'] ||
            posterUrls['/assets/poster/weekend-cover.png'] ||
            defaultWeekendPmCoverUrl
          const futureCoverUrl =
            posterUrls['/assets/poster/future-unicorn-cover.png'] ||
            posterUrls['/assets/poster/future-unicorn-content.png'] ||
            defaultFutureCoverUrl
          const summerCoverUrl =
            posterUrls['/assets/poster/summer-cover.png'] ||
            posterUrls['/assets/poster/youth-cover-list.png'] ||
            posterUrls['/assets/poster/01-cover.png'] ||
            defaultSummerCoverUrl
          const winterCoverUrl =
            posterUrls['/assets/poster/winter-cover.png'] ||
            posterUrls['/assets/poster/01-cover.png'] ||
            defaultWinterCoverUrl
          const cards = buildCards(
            weekendCoverUrl,
            weekendPmCoverUrl,
            futureCoverUrl,
            summerCoverUrl,
            winterCoverUrl
          )
          const filteredCards = applyCardFilters(
            cards,
            this.data.currentTypeFilter,
            this.data.searchKeyword
          )
          this.setData(
            {
              posterUrls,
              allCards: cards,
              cards: filteredCards
            }
          )
        })
        .catch(() => {})
    }
  },
  methods: {
    onTypeFilterTap() {
      wx.showActionSheet({
        itemList: ['全部类型', '创业营', '周末工作坊'],
        success: (res) => {
          const types = ['类型', '创业营', '周末工作坊']
          const selectedType = types[res.tapIndex]
          const filtered = applyCardFilters(
            this.data.allCards,
            selectedType,
            this.data.searchKeyword
          )

          this.setData({
            currentTypeFilter: selectedType,
            cards: filtered
          })
        }
      })
    },
    onSearchChange(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
      const keyword = e.detail?.value || ''
      const filtered = applyCardFilters(
        this.data.allCards,
        this.data.currentTypeFilter,
        keyword
      )

      this.setData({
        searchKeyword: keyword,
        cards: filtered
      })
    },
    onCardTap(e: WechatMiniprogram.BaseEvent) {
      const { activityId, id } = e.currentTarget.dataset as { activityId?: string; id?: number | string }
      const fallbackActivityId = this.data.cards.find((item) => `${item.id}` === `${id || ''}`)?.activityId || ''
      const resolvedActivityId = activityId || fallbackActivityId
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
      if (value === this.data.tabValue) return
      if (value === 'mine') {
        wx.redirectTo({ url: '/pages/my/my' })
        return
      }
      this.setData({ tabValue: value })
    }
  }
})
