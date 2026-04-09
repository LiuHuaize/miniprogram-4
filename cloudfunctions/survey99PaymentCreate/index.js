const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const orders = db.collection('report_pay_orders')

const paymentTitle = '能力测评'
const totalFee = 990
const currency = 'CNY'

const padNumber = (value, length = 2) => String(value).padStart(length, '0')
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

const buildOutTradeNo = (openid) => {
  const now = new Date()
  const stamp = `${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}${padNumber(
    now.getHours()
  )}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}`
  const random = padNumber(Math.floor(Math.random() * 1000000), 6)
  const suffix = openid ? openid.slice(-4) : '0000'
  return `RP${stamp}${random}${suffix}`
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const description = normalizeText(event?.description || paymentTitle) || paymentTitle

  if (!OPENID) {
    return {
      ok: false,
      message: 'openid is required'
    }
  }

  const outTradeNo = buildOutTradeNo(OPENID)
  const createdAt = db.serverDate()
  const orderData = {
    ownerOpenid: OPENID,
    source: '9-9-survey-payment',
    title: paymentTitle,
    description,
    outTradeNo,
    totalFee,
    currency,
    status: 'pending',
    paidAt: null,
    transactionId: '',
    questionnaireStatus: 'pending',
    reportStatus: 'pending',
    reportReadyAt: null,
    questionnaireId: '',
    questionnaireSubmittedAt: null,
    product: {
      productCode: 'ability-evaluation-v1',
      title: paymentTitle,
      description,
      totalFee,
      currency
    },
    payment: {
      status: 'pending',
      totalFee,
      currency,
      paidAt: null,
      transactionId: ''
    },
    questionnaire: {
      version: 'v1',
      status: 'pending',
      questionCount: 20,
      childNameAge: '',
      submittedAt: null
    },
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
    totalFee,
    title: paymentTitle,
    description
  }
}
