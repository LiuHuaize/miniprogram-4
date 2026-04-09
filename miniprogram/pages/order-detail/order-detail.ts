import { getActivitySummary } from '../../utils/activities'

const decodeValue = (value?: string) => (value ? decodeURIComponent(value) : '')
const toNumber = (value?: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const toDate = (value: unknown) => {
  if (!value) return null
  if (typeof value === 'object' && value && '$date' in (value as Record<string, unknown>)) {
    const stamp = (value as { $date: number }).$date
    return Number.isFinite(stamp) ? new Date(stamp) : null
  }
  if (value instanceof Date) {
    return value
  }
  const parsed = new Date(value as string)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
const formatDateTime = (value: unknown) => {
  const date = toDate(value)
  if (!date) return '--'
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}.${month}.${day} ${hour}:${minute}`
}
const formatAmount = (totalFee: number) => {
  if (!totalFee) return '¥ --'
  return `¥ ${(totalFee / 100).toFixed(2)}`
}
const splitAmount = (amountText: string) => {
  const match = amountText.match(/^([^\d]*)([\d.,-]+)(.*)$/)
  if (!match) {
    return {
      amountUnit: '',
      amountValue: amountText
    }
  }
  return {
    amountUnit: match[1] || '',
    amountValue: match[2] || amountText
  }
}
const formatDiscountAmount = (totalFee: number) => {
  if (!totalFee) return '--'
  return `-¥ ${(totalFee / 100).toFixed(2)}`
}
const buildStatusText = (status?: string) => {
  if (status === 'paid') return '已支付'
  if (status === 'submitted') return '已提交'
  if (status === 'cancelled') return '已撤销'
  return status ? '处理中' : '--'
}
const buildHeightWeight = (height?: string, weight?: string) => {
  const heightText = height ? `${height} cm` : ''
  const weightText = weight ? `${weight} kg` : ''
  if (heightText && weightText) return `${heightText} / ${weightText}`
  return heightText || weightText || '--'
}

Component({
  data: {
    activityId: 'ai-camp-2026',
    periodId: '',
    submissionId: '',
    summary: getActivitySummary('ai-camp-2026'),
    orderNo: '--',
    statusText: '--',
    statusClass: '',
    orderTimeText: '--',
    totalFee: 0,
    amountText: '¥ --',
    amountUnit: '¥',
    amountValue: '--',
    scholarshipCode: '',
    scholarshipDiscountAmount: 0,
    scholarshipDiscountText: '',
    scholarshipStatusText: '',
    travelText: '--',
    guardian: {
      name: '--',
      phone: '--',
      idNo: '--',
      idNoMask: ''
    },
    campers: [] as Array<{
      id: string
      name: string
      idNo: string
      idNoMask: string
      height: string
      weight: string
      heightWeight: string
    }>,
    loading: false
  },
  lifetimes: {
    ready() {}
  },
  pageLifetimes: {
    show() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance<any, any> & {
        options?: Record<string, string>
      }
      const options = current?.options || {}
      const storage = wx.getStorageSync('last_payment_success_context') || {}
      const activityId = decodeValue(options.activityId) || storage.activityId || this.data.activityId
      const periodId = decodeValue(options.periodId) || storage.periodId || ''
      const submissionId = decodeValue(options.submissionId) || storage.submissionId || ''
      const orderNo = decodeValue(options.outTradeNo || options.orderNo) || storage.outTradeNo || ''
      const totalFee =
        toNumber(options.totalFee || options.total_fee) || Number(storage.totalFee) || this.data.totalFee || 0
      const scholarshipCode = decodeValue(options.scholarshipCode) || storage.scholarshipCode || ''
      const scholarshipDiscountAmount =
        toNumber(options.scholarshipDiscount || options.scholarship_discount) ||
        Number(storage.scholarshipDiscount) ||
        0
      const amountText = formatAmount(totalFee)
      const amountParts = splitAmount(amountText)

      this.setData({
        activityId,
        periodId,
        submissionId,
        summary: getActivitySummary(activityId),
        orderNo: orderNo || this.data.orderNo,
        totalFee,
        amountText,
        amountUnit: amountParts.amountUnit,
        amountValue: amountParts.amountValue,
        scholarshipCode,
        scholarshipDiscountAmount,
        scholarshipDiscountText: formatDiscountAmount(scholarshipDiscountAmount),
        scholarshipStatusText: scholarshipCode ? '待支付完成核销' : ''
      })
      this.ensureLogin().then(() => {
        this.loadDetail()
      })
    }
  },
  methods: {
    ensureLogin() {
      return new Promise((resolve) => {
        if (!wx.cloud) {
          wx.showToast({ title: '云开发未初始化', icon: 'none' })
          resolve(false)
          return
        }
        const userId = wx.getStorageSync('user_id')
        if (userId) {
          resolve(true)
          return
        }
        wx.cloud.callFunction({
          name: 'login',
          data: {},
          success: (res) => {
            const result = (res.result || {}) as { userId?: string }
            if (result.userId) {
              wx.setStorageSync('user_id', result.userId)
            }
            resolve(true)
          },
          fail: () => {
            wx.showToast({ title: '登录失败', icon: 'none' })
            resolve(false)
          }
        })
      })
    },
    loadDetail() {
      if (!wx.cloud) return
      if (!this.data.activityId && !this.data.submissionId) return
      this.setData({ loading: true })
      wx.cloud.callFunction({
        name: 'submissionGetByActivity',
        data: {
          activityId: this.data.activityId,
          periodId: this.data.periodId,
          submissionId: this.data.submissionId
        },
        success: (res) => {
          const result = (res.result || {}) as {
            ok?: boolean
            data?: {
              id: string
              activityId: string
              periodId?: string
              status: string
              createdAt: unknown
              updatedAt: unknown
              paidAt?: unknown
              payOrderNo?: string
              payAmount?: number
              scholarshipCode?: string
              scholarshipStatus?: string
              scholarshipDiscountAmount?: number
              payScholarshipCode?: string
              payScholarshipDiscount?: number
              guardianSnapshot: {
                name: string
                phone: string
                idNo: string
                idNoMask: string
              }
              childrenSnapshot: Array<{
                id: string
                name: string
                idNo: string
                idNoMask: string
                height: string
                weight: string
              }>
            } | null
          }
          if (!result.ok || !result.data) {
            return
          }
          const data = result.data
          const summary = getActivitySummary(data.activityId || this.data.activityId)
          const statusText = buildStatusText(data.status)
          const statusClass = data.status === 'paid' ? 'info-value--success' : ''
          const orderNo = data.payOrderNo || this.data.orderNo || '--'
          const totalFee = Number(data.payAmount) || this.data.totalFee || 0
          const amountText = formatAmount(totalFee)
          const amountParts = splitAmount(amountText)
          const orderTimeText = formatDateTime(data.createdAt || data.paidAt || data.updatedAt)
          const guardian = data.guardianSnapshot || { name: '', phone: '', idNo: '', idNoMask: '' }
          const campersRaw = Array.isArray(data.childrenSnapshot) ? data.childrenSnapshot : []
          const scholarshipCode = data.payScholarshipCode || data.scholarshipCode || ''
          const scholarshipDiscountAmount =
            Number(data.payScholarshipDiscount) || Number(data.scholarshipDiscountAmount) || 0
          const scholarshipStatusText = scholarshipCode
            ? data.status === 'paid' || data.scholarshipStatus === 'redeemed'
              ? '已核销'
              : '待支付生效'
            : ''
          const campers =
            campersRaw.length > 0
              ? campersRaw.map((item) => ({
                  id: item.id || '',
                  name: item.name || '--',
                  idNo: item.idNo || '',
                  idNoMask: item.idNoMask || '',
                  height: item.height || '',
                  weight: item.weight || '',
                  heightWeight: buildHeightWeight(item.height, item.weight)
                }))
              : [
                  {
                    id: '',
                    name: '--',
                    idNo: '',
                    idNoMask: '',
                    height: '',
                    weight: '',
                    heightWeight: '--'
                  }
                ]

          this.setData({
            activityId: data.activityId || this.data.activityId,
            periodId: data.periodId || this.data.periodId,
            submissionId: data.id || this.data.submissionId,
            summary,
            statusText,
            statusClass,
            orderNo,
            totalFee,
            amountText,
            amountUnit: amountParts.amountUnit,
            amountValue: amountParts.amountValue,
            orderTimeText,
            scholarshipCode,
            scholarshipDiscountAmount,
            scholarshipDiscountText: formatDiscountAmount(scholarshipDiscountAmount),
            scholarshipStatusText,
            guardian: {
              name: guardian.name || '--',
              phone: guardian.phone || '--',
              idNo: guardian.idNo || '--',
              idNoMask: guardian.idNoMask || ''
            },
            campers
          })
        },
        fail: () => {
          wx.showToast({ title: '加载失败', icon: 'none' })
        },
        complete: () => {
          this.setData({ loading: false })
        }
      })
    },
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    }
  }
})
