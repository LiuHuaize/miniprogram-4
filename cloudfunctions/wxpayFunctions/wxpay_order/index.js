/**
 * 微信支付 - 下单
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const toNumber = (value, fallback) => {
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) return Math.floor(num)
  return fallback
}

// 云函数入口函数
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const outTradeNo = event.outTradeNo || event.out_trade_no || ''
  const totalFee = toNumber(event.totalFee || event.total_fee, 1)
  const description = event.description || '活动报名'

  if (!outTradeNo) {
    return { code: -1, msg: 'outTradeNo is required' }
  }

  const res = await cloud.callFunction({
    name: 'cloudbase_module',
    data: {
      name: 'wxpay_order',
      data: {
        description,
        amount: {
          total: totalFee,
          currency: 'CNY'
        },
        out_trade_no: outTradeNo,
        payer: {
          openid: wxContext.OPENID
        }
      }
    }
  })
  return res.result
}
