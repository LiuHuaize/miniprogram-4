Component({
  data: {
    tabValue: 'mine',
    orders: [
      {
        id: 'QX202602210001',
        title: '未来学习中心 · 26 年春季黑客松',
        status: '已支付',
        statusStyle: 'background: #e8f6ee; color: #2ba471;',
        price: '¥ 26800',
        time: '报名时间 2026.02.18',
        action: '查看详情 >'
      },
      {
        id: 'QX202601150021',
        title: 'IDEAS X SANYA: 2026 商业探索营',
        status: '未支付',
        statusStyle: 'background: #f1f2f4; color: #6b7280;',
        price: '¥ 19800',
        time: '报名时间 2026.01.15',
        action: '继续支付 >'
      },
      {
        id: 'QX202512050080',
        title: '2025 IDEA 教育开放日',
        status: '已结束',
        statusStyle: 'background: #fdf3d1; color: #b77a08;',
        price: '¥ 0',
        time: '报名时间 2025.12.05',
        action: '查看详情 >'
      }
    ]
  },
  methods: {
    onTabChange(e: WechatMiniprogram.CustomEvent) {
      const value = e.detail.value
      if (value === this.data.tabValue) return
      if (value === 'activity') {
        wx.redirectTo({ url: '/pages/index/index' })
        return
      }
      this.setData({ tabValue: value })
    }
  }
})
