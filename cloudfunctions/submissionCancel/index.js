const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const activityId = event && event.activityId ? String(event.activityId) : ''
  if (!activityId) {
    return { ok: false, message: 'activityId is required' }
  }

  const docId = `${OPENID}_${activityId}`
  const existing = await submissions.doc(docId).get().catch(() => null)
  if (!existing || !existing.data) {
    return { ok: false, message: 'Submission not found' }
  }

  const now = db.serverDate()
  await submissions.doc(docId).update({
    data: {
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now
    }
  })

  return { ok: true }
}
