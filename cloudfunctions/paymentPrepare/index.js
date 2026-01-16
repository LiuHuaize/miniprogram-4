const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')

const padNumber = (value, length = 2) => String(value).padStart(length, '0')

const buildOutTradeNo = (openid) => {
  const now = new Date()
  const stamp = `${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}${padNumber(
    now.getHours()
  )}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}`
  const random = padNumber(Math.floor(Math.random() * 1000000), 6)
  const suffix = openid ? openid.slice(-4) : '0000'
  return `MP${stamp}${random}${suffix}`
}

exports.main = async (event) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const activityId = event && event.activityId ? String(event.activityId) : ''
    if (!activityId) {
      return { ok: false, message: 'activityId is required' }
    }

    const docId = `${OPENID}_${activityId}`
    const submissionRes = await submissions.doc(docId).get().catch(() => null)
    if (!submissionRes || !submissionRes.data) {
      return { ok: false, message: 'Submission not found' }
    }
    if (submissionRes.data.status === 'paid') {
      return { ok: false, message: 'Submission already paid' }
    }
    if (submissionRes.data.status === 'cancelled') {
      return { ok: false, message: 'Submission is cancelled' }
    }

    const outTradeNo = submissionRes.data.payOrderNo || buildOutTradeNo(OPENID)
    const totalFee = 100

    const now = db.serverDate()
    await submissions.doc(docId).update({
      data: {
        payOrderNo: outTradeNo,
        payAmount: totalFee,
        updatedAt: now
      }
    })

    return { ok: true, outTradeNo, totalFee }
  } catch (err) {
    return { ok: false, message: err.message || 'Server error' }
  }
}
