type TicketConfirmResult = {
  ok?: boolean
  message?: string
  paid?: boolean
  orderId?: string
  outTradeNo?: string
  totalFee?: number
  title?: string
  eventLabel?: string
  parentName?: string
  phone?: string
  childAge?: number
}

const ticketStorageKey = '2026_0425_activity_ticket_context'
const defaultTitle = 'AI时代少年创业力峰会'
const defaultEventLabel = '2026.04.25 13:30 - 17:30'

const decodeValue = (value?: string) => {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const normalizeText = (value?: string | number) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim()
  }
  return ''
}

const toPositiveInteger = (value?: string | number) => {
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) {
    return Math.floor(num)
  }
  return 0
}

const maskParentName = (value?: string) => {
  const chars = Array.from(normalizeText(value))
  if (!chars.length) return '家长朋友'
  if (chars.length === 1) return chars[0]
  if (chars.length === 2) return `${chars[0]}*`
  if (chars.length === 3) return `${chars[0]}*${chars[2]}`
  return `${chars[0]}*${chars[chars.length - 1]}`
}

const splitEventLabel = (value?: string) => {
  const text = normalizeText(value)
  if (!text) {
    return {
      dateText: '',
      timeText: ''
    }
  }

  const match = text.match(/^(\S+)\s+(.+)$/)
  if (!match) {
    return {
      dateText: text,
      timeText: ''
    }
  }

  return {
    dateText: match[1],
    timeText: match[2]
  }
}

const formatAmount = (totalFee: number) => {
  if (!totalFee) return '¥ --'
  return `¥ ${(totalFee / 100).toFixed(0)}`
}

const formatChildAge = (value?: string | number) => {
  const age = toPositiveInteger(value)
  return age ? `${age}岁` : '--'
}

const formatTicketNo = (value?: string) => {
  const text = normalizeText(value).replace(/\s+/g, '')
  if (!text) return 'PENDING'
  return text.length > 16 ? text.slice(-16).toUpperCase() : text.toUpperCase()
}

const buildBarcodeSegments = (value?: string) => {
  const seed = formatTicketNo(value).replace(/[^A-Z0-9]/g, '') || 'PS20260425'
  return [
    seed.slice(0, 4),
    seed.slice(4, 8),
    seed.slice(8, 12),
    seed.slice(12, 16)
  ].filter(Boolean)
}

Page({
  data: {
    loading: true,
    orderId: '',
    outTradeNo: '',
    title: defaultTitle,
    eventLabel: defaultEventLabel,
    parentName: '',
    maskedParentName: '家长朋友',
    phone: '--',
    childAgeText: '--',
    totalFee: 29900,
    amountText: '¥ 299',
    welcomeText: `欢迎家长朋友来到${defaultTitle}`,
    dateText: '2026.04.25',
    timeText: '13:30 - 17:30',
    ticketNo: 'PENDING',
    barcodeSegments: buildBarcodeSegments(''),
    guideText: '截图此照片，联系顾问老师拉群'
  },
  onLoad(options: Record<string, string>) {
    const storage = wx.getStorageSync(ticketStorageKey) || {}
    const orderId = decodeValue(options.orderId || options.posterSignupOrderId) || storage.orderId || ''
    const outTradeNo = decodeValue(options.outTradeNo || options.orderNo) || storage.outTradeNo || ''
    const title = decodeValue(options.title || options.activityTitle) || storage.title || defaultTitle
    const eventLabel = decodeValue(options.eventLabel) || storage.eventLabel || defaultEventLabel
    const parentName = decodeValue(options.parentName) || storage.parentName || ''
    const phone = decodeValue(options.phone) || storage.phone || '--'
    const childAge = decodeValue(options.childAge) || storage.childAge || ''
    const totalFee = toPositiveInteger(options.totalFee || storage.totalFee) || 29900

    this.applyTicketData({
      orderId,
      outTradeNo,
      title,
      eventLabel,
      parentName,
      phone,
      childAge,
      totalFee
    })

    this.loadTicketDetail()
  },
  applyTicketData(payload: {
    orderId?: string
    outTradeNo?: string
    title?: string
    eventLabel?: string
    parentName?: string
    phone?: string
    childAge?: string | number
    totalFee?: string | number
  }) {
    const orderId = normalizeText(payload.orderId) || this.data.orderId
    const outTradeNo = normalizeText(payload.outTradeNo) || this.data.outTradeNo
    const title = normalizeText(payload.title) || this.data.title || defaultTitle
    const eventLabel = normalizeText(payload.eventLabel) || this.data.eventLabel || defaultEventLabel
    const parentName = normalizeText(payload.parentName) || this.data.parentName
    const maskedParentName = maskParentName(parentName)
    const totalFee = toPositiveInteger(payload.totalFee || this.data.totalFee) || 29900
    const split = splitEventLabel(eventLabel)

    this.setData({
      loading: false,
      orderId,
      outTradeNo,
      title,
      eventLabel,
      parentName,
      maskedParentName,
      phone: normalizeText(payload.phone) || this.data.phone || '--',
      childAgeText: formatChildAge(payload.childAge || this.data.childAgeText),
      totalFee,
      amountText: formatAmount(totalFee),
      welcomeText: `欢迎${maskedParentName}来到${title}`,
      dateText: split.dateText || '2026.04.25',
      timeText: split.timeText || '13:30 - 17:30',
      ticketNo: formatTicketNo(outTradeNo),
      barcodeSegments: buildBarcodeSegments(outTradeNo)
    })

    wx.setStorageSync(ticketStorageKey, {
      orderId,
      outTradeNo,
      title,
      eventLabel,
      parentName,
      phone: normalizeText(payload.phone) || this.data.phone || '',
      childAge: toPositiveInteger(payload.childAge || this.data.childAgeText),
      totalFee
    })
  },
  loadTicketDetail() {
    if (!wx.cloud) {
      this.setData({ loading: false })
      return
    }

    if (!this.data.orderId && !this.data.outTradeNo) {
      this.setData({ loading: false })
      return
    }

    wx.cloud.callFunction({
      name: 'posterSignupPaymentConfirm',
      data: {
        orderId: this.data.orderId,
        outTradeNo: this.data.outTradeNo
      },
      success: (res) => {
        const result = (res.result || {}) as TicketConfirmResult
        if (!result.ok) {
          this.setData({ loading: false })
          return
        }

        this.applyTicketData({
          orderId: result.orderId,
          outTradeNo: result.outTradeNo,
          title: result.title,
          eventLabel: result.eventLabel,
          parentName: result.parentName,
          phone: result.phone,
          childAge: result.childAge,
          totalFee: result.totalFee
        })
      },
      fail: () => {
        this.setData({ loading: false })
      }
    })
  },
  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      })
      return
    }

    wx.reLaunch({
      url: '/pages/index/index'
    })
  },
  onGoHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }
})
