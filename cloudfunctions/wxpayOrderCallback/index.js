const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')

const toPositiveInteger = (value) => {
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) {
    return Math.floor(num)
  }
  return 0
}

const normalizeCurrency = (value) => (value ? String(value).trim().toUpperCase() : '')

const getResource = (event) => {
  if (event && event.resource && typeof event.resource === 'object') {
    return event.resource
  }
  return {}
}

const getOutTradeNo = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  return resource.out_trade_no || resource.outTradeNo || payload.out_trade_no || payload.outTradeNo || ''
}

const getPaidAmount = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  const amount = resource.amount && typeof resource.amount === 'object' ? resource.amount : {}
  return toPositiveInteger(amount.total || amount.payer_total || payload.total_fee || payload.totalFee)
}

const getPaidCurrency = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  const amount = resource.amount && typeof resource.amount === 'object' ? resource.amount : {}
  return normalizeCurrency(amount.currency || amount.payer_currency || payload.currency)
}

const getPayerOpenid = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  const payer = resource.payer && typeof resource.payer === 'object' ? resource.payer : {}
  return payer.openid || payload.openid || ''
}

const getTransactionId = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  return resource.transaction_id || resource.transactionId || payload.transaction_id || payload.transactionId || ''
}

exports.main = async (event) => {
  try {
    const eventType = event && event.event_type ? String(event.event_type) : ''
    if (eventType !== 'TRANSACTION.SUCCESS') {
      return event
    }

    const outTradeNo = getOutTradeNo(event)
    if (!outTradeNo) {
      console.warn('[wxpayOrderCallback] empty outTradeNo')
      return event
    }

    const res = await submissions.where({ payOrderNo: outTradeNo }).limit(1).get()
    if (!res.data || !res.data.length) {
      console.warn('[wxpayOrderCallback] submission not found', {
        outTradeNoSuffix: outTradeNo.slice(-6)
      })
      return event
    }

    const submission = res.data[0]
    const docId = submission._id || ''
    if (!docId) {
      return event
    }
    if (submission.status === 'paid') {
      console.info('[wxpayOrderCallback] duplicate callback ignored', { docId })
      return event
    }
    if (submission.status !== 'submitted') {
      console.warn('[wxpayOrderCallback] invalid status', { docId, status: submission.status || '' })
      return event
    }

    const expectedAmount = toPositiveInteger(submission.payAmount)
    if (!expectedAmount) {
      console.error('[wxpayOrderCallback] missing expected amount', {
        docId,
        outTradeNoSuffix: outTradeNo.slice(-6)
      })
      return event
    }
    const paidAmount = getPaidAmount(event)
    if (!paidAmount || expectedAmount !== paidAmount) {
      console.error('[wxpayOrderCallback] amount mismatch', {
        docId,
        outTradeNoSuffix: outTradeNo.slice(-6),
        expectedAmount,
        paidAmount
      })
      return event
    }

    const expectedCurrency = normalizeCurrency(submission.payCurrency || 'CNY')
    const paidCurrency = getPaidCurrency(event)
    if (paidCurrency && expectedCurrency && paidCurrency !== expectedCurrency) {
      console.error('[wxpayOrderCallback] currency mismatch', {
        docId,
        outTradeNoSuffix: outTradeNo.slice(-6),
        expectedCurrency,
        paidCurrency
      })
      return event
    }

    const payerOpenid = getPayerOpenid(event)
    if (payerOpenid && submission.ownerOpenid && payerOpenid !== submission.ownerOpenid) {
      console.error('[wxpayOrderCallback] payer mismatch', {
        docId,
        outTradeNoSuffix: outTradeNo.slice(-6),
        payerOpenidSuffix: payerOpenid.slice(-6),
        ownerOpenidSuffix: String(submission.ownerOpenid).slice(-6)
      })
      return event
    }

    const now = db.serverDate()
    const updateRes = await submissions.where({ _id: docId, status: 'submitted' }).update({
      data: {
        status: 'paid',
        paidAt: now,
        updatedAt: now,
        payCurrency: expectedCurrency || 'CNY',
        payVerifiedAt: now,
        payVerifiedAmount: paidAmount || expectedAmount,
        payVerifiedCurrency: paidCurrency || expectedCurrency || 'CNY',
        payTransactionId: getTransactionId(event)
      }
    })
    if (!updateRes || !updateRes.stats || updateRes.stats.updated !== 1) {
      console.info('[wxpayOrderCallback] status unchanged', { docId })
    }
  } catch (err) {
    console.error('[wxpayOrderCallback] error', err)
  }

  return event
}
