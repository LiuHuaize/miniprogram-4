const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')

const getOutTradeNo = (event) => {
  if (event && event.resource && typeof event.resource === 'object') {
    return event.resource.out_trade_no || event.resource.outTradeNo || ''
  }
  return event.out_trade_no || event.outTradeNo || ''
}

exports.main = async (event) => {
  try {
    const eventType = event && event.event_type ? String(event.event_type) : ''
    if (eventType !== 'TRANSACTION.SUCCESS') {
      return event
    }

    const outTradeNo = getOutTradeNo(event)
    if (!outTradeNo) {
      return event
    }

    const res = await submissions.where({ payOrderNo: outTradeNo }).limit(1).get()
    if (res.data && res.data.length > 0) {
      const docId = res.data[0]._id
      const now = db.serverDate()
      await submissions.doc(docId).update({
        data: {
          status: 'paid',
          paidAt: now,
          updatedAt: now
        }
      })
    }
  } catch (err) {
    // keep callback stable
  }

  return event
}
