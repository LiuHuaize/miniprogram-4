/**
 * 微信支付 - 微信支付订单号查询订单
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

exports.main = async (event) => {
  const transactionId = normalizeText(event?.transactionId || event?.transaction_id || '')

  if (!transactionId) {
    return {
      code: -1,
      msg: 'transactionId is required'
    }
  }

  const res = await cloud.callFunction({
    name: 'cloudbase_module',
    data: {
      name: 'wxpay_query_order_by_transaction_id',
      data: {
        transaction_id: transactionId
      }
    }
  })

  return res.result
}
