import { getActivitySummary } from '../../utils/activities'

const decodeValue = (value?: string) => (value ? decodeURIComponent(value) : '')
const toNumber = (value?: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const formatAmount = (totalFee: number) => {
  if (!totalFee) {
    return '¥ --'
  }
  return `¥ ${(totalFee / 100).toFixed(2)}`
}

Component({
  data: {
    activityId: '',
    periodId: '',
    activityTitle: '',
    submissionId: '',
    orderNo: '-',
    totalFee: 0,
    amountText: '¥ --',
    statusText: '已支付'
  },
  pageLifetimes: {
    show() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
        options?: Record<string, string>
      }
      const options = current?.options || {}
      const storage = wx.getStorageSync('last_pay_success') || {}
      const activityId = decodeValue(options.activityId) || storage.activityId || ''
      const periodId = decodeValue(options.periodId) || storage.periodId || ''
      const activityTitle =
        decodeValue(options.activityTitle) ||
        storage.activityTitle ||
        (activityId ? getActivitySummary(activityId).title : '') ||
        '活动报名'
      const orderNo = decodeValue(options.outTradeNo || options.orderNo) || storage.outTradeNo || '-'
      const totalFee = toNumber(options.totalFee || options.total_fee) || Number(storage.totalFee) || 0
      const submissionId = decodeValue(options.submissionId) || storage.submissionId || ''

      this.setData({
        activityId,
        periodId,
        activityTitle,
        submissionId,
        orderNo,
        totalFee,
        amountText: formatAmount(totalFee)
      })
    }
  },
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onGoHome() {
      wx.redirectTo({
        url: '/pages/index/index'
      })
    },
    onViewOrder() {
      const query = [
        this.data.submissionId ? `submissionId=${encodeURIComponent(this.data.submissionId)}` : '',
        this.data.activityId ? `activityId=${encodeURIComponent(this.data.activityId)}` : '',
        this.data.periodId ? `periodId=${encodeURIComponent(this.data.periodId)}` : '',
        this.data.orderNo && this.data.orderNo !== '-' ? `outTradeNo=${encodeURIComponent(this.data.orderNo)}` : '',
        this.data.totalFee ? `totalFee=${encodeURIComponent(String(this.data.totalFee))}` : ''
      ]
        .filter(Boolean)
        .join('&')
      wx.navigateTo({
        url: query ? `/pages/order-detail/order-detail?${query}` : '/pages/order-detail/order-detail'
      })
    }
  }
})
