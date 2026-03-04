const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

const resolveMessage = (result, fallback) => {
  const message = result && (result.message || result.msg || result.errmsg)
  if (!message) {
    return fallback
  }
  return String(message)
}

exports.main = async (event) => {
  try {
    const activityId = event && event.activityId ? normalizeText(String(event.activityId)) : ''
    const periodId = event && event.periodId ? normalizeText(String(event.periodId)) : ''
    const submissionId = event && event.submissionId ? normalizeText(String(event.submissionId)) : ''
    const description = event && event.description ? normalizeText(String(event.description)) : ''

    if (!activityId && !submissionId) {
      return { ok: false, message: 'activityId is required' }
    }

    const prepareRes = await cloud.callFunction({
      name: 'paymentPrepare',
      data: {
        activityId,
        periodId,
        submissionId
      }
    })
    const prepareResult = prepareRes && prepareRes.result ? prepareRes.result : {}
    if (!prepareResult.ok || !prepareResult.outTradeNo || !prepareResult.totalFee) {
      return {
        ok: false,
        message: resolveMessage(prepareResult, 'Payment prepare failed')
      }
    }

    const payRes = await cloud.callFunction({
      name: 'wxpayFunctions',
      data: {
        type: 'wxpay_order',
        outTradeNo: prepareResult.outTradeNo,
        totalFee: prepareResult.totalFee,
        description: description || '活动报名'
      }
    })
    const payResult = payRes && payRes.result ? payRes.result : {}

    if (payResult.errcode || payResult.code === -1) {
      return {
        ok: false,
        message: resolveMessage(payResult, 'Create wxpay order failed')
      }
    }

    const payment = payResult.data || {}
    const packageValue = payment.packageVal || payment.package || ''
    if (!payment.timeStamp || !payment.nonceStr || !packageValue) {
      return {
        ok: false,
        message: 'Payment params missing'
      }
    }

    return {
      ok: true,
      payment,
      outTradeNo: prepareResult.outTradeNo,
      totalFee: prepareResult.totalFee,
      activityId: prepareResult.activityId || activityId,
      periodId: prepareResult.periodId || periodId,
      submissionId: prepareResult.submissionId || submissionId
    }
  } catch (err) {
    return { ok: false, message: err.message || 'Server error' }
  }
}
