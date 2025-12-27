Component({
  data: {
    tabValue: 'activity',
    cards: [
      {
        id: 1,
        status: '报名中',
        tagStyle: 'background: #e7f3f1; color: #2f7d75;',
        subLabel: '2026 暑期研究营',
        heroTitle: 'IDEAS X 三亚',
        heroDesc: '2026 亚洲商业 & 探险研学',
        title: 'IDEAS X SANYA: 2026 商业探索营',
        meta: '7 天 · 三亚 · 海滨成长体验',
        heroStyle: 'background: linear-gradient(135deg, #0f766e 0%, #10b981 55%, #5eead4 100%);',
        overlayStyle: 'background: rgba(0, 0, 0, 0.25);',
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
