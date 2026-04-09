/**
 * 微信支付 - 根据商户订单号查询订单
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

exports.main = async (event) => {
  const outTradeNo = normalizeText(event?.outTradeNo || event?.out_trade_no || '')

  if (!outTradeNo) {
    return {
      code: -1,
      msg: 'outTradeNo is required'
    }
  }

  const res = await cloud.callFunction({
    name: 'cloudbase_module',
    data: {
      name: 'wxpay_query_order_by_out_trade_no',
      data: {
        out_trade_no: outTradeNo
      }
    }
  })

  return res.result
}
