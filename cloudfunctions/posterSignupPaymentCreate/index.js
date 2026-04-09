const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const orders = db.collection('poster_signup_orders')

const currency = 'CNY'

const posterPaymentConfigMap = {
  '2026-0425-activity-poster': {
    title: 'AI时代少年创业力峰会',
    description: '4.25活动报名',
    totalFee: 29900,
    eventLabel: '2026.04.25 13:30 - 17:30'
  }
}

const padNumber = (value, length = 2) => String(value).padStart(length, '0')
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, '').slice(0, 11)
const toAgeNumber = (value) => {
  const num = Number(value)
  if (Number.isFinite(num)) {
    return Math.floor(num)
  }
  return 0
}

const buildOutTradeNo = (openid) => {
  const now = new Date()
  const stamp = `${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}${padNumber(
    now.getHours()
  )}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}`
  const random = padNumber(Math.floor(Math.random() * 1000000), 6)
  const suffix = openid ? openid.slice(-4) : '0000'
  return `PS${stamp}${random}${suffix}`
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const posterCode = normalizeText(event?.posterCode || '')
  const config = posterPaymentConfigMap[posterCode]

  if (!OPENID) {
    return {
      ok: false,
      message: 'openid is required'
    }
  }

  if (!config) {
    return {
      ok: false,
      message: '无效的活动海报'
    }
  }

  const parentName = normalizeText(event?.parentName || '')
  const phone = normalizePhone(event?.phone || '')
  const childAge = toAgeNumber(event?.childAge)
  const posterSrc = normalizeText(event?.posterSrc || '')
  const description = normalizeText(event?.description || config.description) || config.description

  if (!parentName) {
    return {
      ok: false,
      message: '请填写家长真实姓名'
    }
  }

  if (!/^1\d{10}$/.test(phone)) {
    return {
      ok: false,
      message: '请填写正确的联系电话'
    }
  }

  if (!childAge || childAge < 1 || childAge > 18) {
    return {
      ok: false,
      message: '请填写正确的孩子年龄'
    }
  }

  const outTradeNo = buildOutTradeNo(OPENID)
  const createdAt = db.serverDate()
  const orderData = {
    ownerOpenid: OPENID,
    source: posterCode,
    businessType: 'activity-poster',
    posterCode,
    title: config.title,
    description,
    outTradeNo,
    totalFee: config.totalFee,
    currency,
    status: 'pending',
    paidAt: null,
    transactionId: '',
    parentName,
    phone,
    childAge,
    posterSrc,
    eventLabel: config.eventLabel || '',
    signup: {
      parentName,
      phone,
      childAge
    },
    activity: {
      posterCode,
      title: config.title,
      description,
      eventLabel: config.eventLabel || '',
      posterSrc
    },
    product: {
      productCode: posterCode,
      title: config.title,
      description,
      totalFee: config.totalFee,
      currency
    },
    payment: {
      status: 'pending',
      totalFee: config.totalFee,
      currency,
      paidAt: null,
      transactionId: ''
    },
    feishuSyncStatus: 'pending',
    feishuRecordId: '',
    feishuSyncErrorMessage: '',
    feishuSyncedAt: null,
    feishuSyncTriedAt: null,
    createdAt,
    updatedAt: createdAt
  }

  const addRes = await orders.add({
    data: orderData
  })

  return {
    ok: true,
    orderId: addRes._id,
    outTradeNo,
    totalFee: config.totalFee,
    title: config.title,
    description,
    posterCode,
    eventLabel: config.eventLabel || ''
  }
}
