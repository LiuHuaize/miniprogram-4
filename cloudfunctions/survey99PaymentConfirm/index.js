const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const orders = db.collection('report_pay_orders')

const paidStatus = 'paid'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

const toPositiveInteger = (value) => {
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) {
    return Math.floor(num)
  }
  return 0
}

const normalizeCurrency = (value) => {
  const text = normalizeText(value)
  return text ? text.toUpperCase() : ''
}

const resolveQueryPayload = (result = {}) => {
  const first = result && typeof result === 'object' ? result : {}
  const second = first.data && typeof first.data === 'object' ? first.data : first
  const third = second.data && typeof second.data === 'object' ? second.data : second
  return third && typeof third === 'object' ? third : {}
}

const resolveTradeState = (payload = {}) => {
  return normalizeText(
    payload.trade_state || payload.tradeState || payload.trade_status || payload.tradeStatus || payload.state || ''
  ).toUpperCase()
}

const resolveTransactionId = (payload = {}) => {
  return normalizeText(payload.transaction_id || payload.transactionId || '')
}

const resolvePaidAmount = (payload = {}) => {
  const amount = payload.amount && typeof payload.amount === 'object' ? payload.amount : {}
  return toPositiveInteger(
    amount.payer_total || amount.total || payload.payer_total || payload.total || payload.total_fee || payload.totalFee
  )
}

const resolvePaidCurrency = (payload = {}) => {
  const amount = payload.amount && typeof payload.amount === 'object' ? payload.amount : {}
  return normalizeCurrency(amount.payer_currency || amount.currency || payload.currency || payload.payerCurrency)
}

const getOrderDoc = async (orderId, outTradeNo, openid) => {
  if (orderId) {
    const doc = await orders.doc(orderId).get().catch(() => null)
    if (doc?.data) {
      return doc.data
    }
  }

  if (!outTradeNo) {
    return null
  }

  const res = await orders
    .where({
      ownerOpenid: openid,
      outTradeNo
    })
    .limit(1)
    .get()

  if (!res.data?.length) {
    return null
  }

  return res.data[0]
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const orderId = normalizeText(event?.orderId || '')
  const outTradeNo = normalizeText(event?.outTradeNo || event?.out_trade_no || '')

  if (!OPENID) {
    return {
      ok: false,
      message: 'openid is required'
    }
  }

  const order = await getOrderDoc(orderId, outTradeNo, OPENID)
  if (!order) {
    return {
      ok: false,
      message: 'Order not found'
    }
  }

  if (order.ownerOpenid !== OPENID) {
    return {
      ok: false,
      message: 'Order not found'
    }
  }

  if (order.status === paidStatus) {
    return {
      ok: true,
      paid: true,
      orderId: order._id,
      outTradeNo: order.outTradeNo,
      totalFee: toPositiveInteger(order.totalFee)
    }
  }

  let lastMessage = '支付结果确认中，请稍后再试'

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const queryRes = await cloud.callFunction({
      name: 'wxpayFunctions',
      data: {
        type: 'wxpay_query_order_by_out_trade_no',
        outTradeNo: order.outTradeNo
      }
    })

    const queryResult = queryRes?.result || {}
    if (queryResult.errcode || queryResult.code === -1) {
      lastMessage = normalizeText(queryResult.msg || queryResult.message || queryResult.errmsg) || lastMessage
    } else {
      const payload = resolveQueryPayload(queryResult)
      const tradeState = resolveTradeState(payload)
      const paidAmount = resolvePaidAmount(payload)
      const paidCurrency = resolvePaidCurrency(payload) || normalizeCurrency(order.currency || 'CNY')

      if (tradeState === 'SUCCESS') {
        const expectedAmount = toPositiveInteger(order.totalFee)
        if (expectedAmount && paidAmount && expectedAmount !== paidAmount) {
          return {
            ok: false,
            message: '支付金额校验失败'
          }
        }

        await orders.doc(order._id).update({
          data: {
            status: paidStatus,
            paidAt: db.serverDate(),
            transactionId: resolveTransactionId(payload),
            payVerifiedAmount: paidAmount || expectedAmount,
            payVerifiedCurrency: paidCurrency || 'CNY',
            payment: {
              status: paidStatus,
              totalFee: expectedAmount || paidAmount,
              currency: paidCurrency || 'CNY',
              paidAt: db.serverDate(),
              transactionId: resolveTransactionId(payload)
            },
            updatedAt: db.serverDate()
          }
        })

        return {
          ok: true,
          paid: true,
          orderId: order._id,
          outTradeNo: order.outTradeNo,
          totalFee: expectedAmount || paidAmount
        }
      }

      if (tradeState && tradeState !== 'NOTPAY' && tradeState !== 'USERPAYING') {
        lastMessage = `当前支付状态：${tradeState}`
        break
      }
    }

    if (attempt < 5) {
      await sleep(800)
    }
  }

  return {
    ok: false,
    pending: true,
    message: lastMessage
  }
}
