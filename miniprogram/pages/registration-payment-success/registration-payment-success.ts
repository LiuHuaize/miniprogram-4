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
const formatDiscountAmount = (totalFee: number) => {
  if (!totalFee) {
    return '--'
  }
  return `-¥ ${(totalFee / 100).toFixed(2)}`
}

Component({
  data: {
    source: '',
    activityId: '',
    periodId: '',
    activityTitle: '',
    submissionId: '',
    reportOrderId: '',
    posterSignupOrderId: '',
    orderNo: '-',
    totalFee: 0,
    amountText: '¥ --',
    statusText: '已支付',
    resultSub: '订单已完成，报名信息已提交',
    primaryActionText: '查看订单',
    detailTitleLabel: '活动名称',
    hintText: '如需修改信息，可前往“我的订单”联系老师协助。',
    scholarshipCode: '',
    scholarshipDiscountAmount: 0,
    scholarshipDiscountText: ''
  },
  pageLifetimes: {
    show() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance<any, any> & {
        options?: Record<string, string>
      }
      const options = current?.options || {}
      const storage = wx.getStorageSync('last_payment_success_context') || {}
      const source = decodeValue(options.source) || storage.source || ''
      const activityId = decodeValue(options.activityId) || storage.activityId || ''
      const periodId = decodeValue(options.periodId) || storage.periodId || ''
      const activityTitle =
        decodeValue(options.activityTitle) ||
        storage.activityTitle ||
        (activityId ? getActivitySummary(activityId).title : '') ||
        (source === '9-9-survey-payment'
          ? '能力测评'
          : source === '2026-0425-activity-poster'
            ? 'AI时代少年创业力峰会'
            : '活动报名')
      const orderNo = decodeValue(options.outTradeNo || options.orderNo) || storage.outTradeNo || '-'
      const totalFee = toNumber(options.totalFee || options.total_fee) || Number(storage.totalFee) || 0
      const submissionId = decodeValue(options.submissionId) || storage.submissionId || ''
      const reportOrderId = decodeValue(options.reportOrderId) || storage.reportOrderId || ''
      const posterSignupOrderId = decodeValue(options.posterSignupOrderId) || storage.posterSignupOrderId || ''
      const scholarshipCode = decodeValue(options.scholarshipCode) || storage.scholarshipCode || ''
      const scholarshipDiscountAmount =
        toNumber(options.scholarshipDiscount || options.scholarship_discount) ||
        Number(storage.scholarshipDiscount) ||
        0
      const isReport = source === '9-9-survey-payment'
      const isPosterSignup = source === '2026-0425-activity-poster'

      this.setData({
        source,
        activityId,
        periodId,
        activityTitle,
        submissionId,
        reportOrderId,
        posterSignupOrderId,
        orderNo,
        totalFee,
        amountText: formatAmount(totalFee),
        resultSub: isReport
          ? '支付已完成，请继续填写测评问卷'
          : isPosterSignup
            ? '支付已完成，报名信息已提交，我们会尽快与您联系确认席位'
            : '订单已完成，报名信息已提交',
        primaryActionText: isReport ? '开始测评' : isPosterSignup ? '完成' : '查看订单',
        detailTitleLabel: isReport ? '测评名称' : '活动名称',
        hintText: isReport
          ? '问卷共 21 题，提交后即可进入后续解读流程。'
          : isPosterSignup
            ? '报名信息已写入系统，如需修改，请联系老师协助。'
            : '如需修改信息，可前往“我的订单”联系老师协助。',
        scholarshipCode,
        scholarshipDiscountAmount,
        scholarshipDiscountText: formatDiscountAmount(scholarshipDiscountAmount)
      })
    }
  },
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onGoQuestionnaire() {
      const query = [
        this.data.reportOrderId ? `reportOrderId=${encodeURIComponent(this.data.reportOrderId)}` : '',
        this.data.orderNo && this.data.orderNo !== '-' ? `outTradeNo=${encodeURIComponent(this.data.orderNo)}` : ''
      ]
        .filter(Boolean)
        .join('&')

      wx.navigateTo({
        url: query
          ? `/pages/9-9-survey-questionnaire/9-9-survey-questionnaire?${query}`
          : '/pages/9-9-survey-questionnaire/9-9-survey-questionnaire'
      })
    },
    onGoHome() {
      wx.redirectTo({
        url: '/pages/index/index'
      })
    },
    onPrimaryAction() {
      if (this.data.source === '9-9-survey-payment') {
        this.onGoQuestionnaire()
        return
      }
      if (this.data.source === '2026-0425-activity-poster') {
        this.onGoHome()
        return
      }
      this.onViewOrder()
    },
    onViewOrder() {
      const query = [
        this.data.submissionId ? `submissionId=${encodeURIComponent(this.data.submissionId)}` : '',
        this.data.activityId ? `activityId=${encodeURIComponent(this.data.activityId)}` : '',
        this.data.periodId ? `periodId=${encodeURIComponent(this.data.periodId)}` : '',
        this.data.orderNo && this.data.orderNo !== '-' ? `outTradeNo=${encodeURIComponent(this.data.orderNo)}` : '',
        this.data.totalFee ? `totalFee=${encodeURIComponent(String(this.data.totalFee))}` : '',
        this.data.scholarshipCode ? `scholarshipCode=${encodeURIComponent(this.data.scholarshipCode)}` : '',
        this.data.scholarshipDiscountAmount
          ? `scholarshipDiscount=${encodeURIComponent(String(this.data.scholarshipDiscountAmount))}`
          : ''
      ]
        .filter(Boolean)
        .join('&')
      wx.navigateTo({
        url: query ? `/pages/order-detail/order-detail?${query}` : '/pages/order-detail/order-detail'
      })
    }
  }
})
