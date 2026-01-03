Component({
  data: {
    tabValue: 'activity',
    cards: [
      {
        id: 1,
        status: '报名中',
        tagStyle: 'background: #dbeafe; color: #1d4ed8;',
        subLabel: '2026 AI 创业营',
        heroTitle: '少年独角兽',
        heroDesc: 'AI 创业营 · 深圳',
        title: '少年独角兽 AI 创业营（深圳）',
        meta: '6 天 · 深圳 · 10-16 岁',
        heroStyle: 'background-image: url("/assets/poster/01-cover.png"); background-size: cover; background-position: center; background-repeat: no-repeat;',
        overlayStyle: 'background: linear-gradient(180deg, rgba(30, 64, 175, 0.12), rgba(30, 64, 175, 0.55));',
        themeClass: 'card-hero--light'
      },
      {
        id: 2,
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
  },
  methods: {
    onCardTap() {
      wx.navigateTo({
        url: '/pages/detail/detail'
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
