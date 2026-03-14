const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')

const normalizeScholarshipCode = (value) => (typeof value === 'string' ? value.trim().toUpperCase().replace(/[^A-Z]/g, '') : '')

const getLatestSubmitted = async (openid, activityId, periodId) => {
  const where = {
    ownerOpenid: openid,
    activityId,
    status: 'submitted'
  }
  if (periodId) {
    where.periodId = periodId
  }
  const res = await submissions.where(where).orderBy('updatedAt', 'desc').limit(1).get()
  if (!res.data || !res.data.length) {
    return null
  }
  return res.data[0]
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const activityId = event && event.activityId ? String(event.activityId) : ''
  const periodId = event && event.periodId ? String(event.periodId).trim() : ''
  const submissionId = event && event.submissionId ? String(event.submissionId) : ''
  if (!activityId && !submissionId) {
    return { ok: false, message: 'activityId is required' }
  }

  const existing = submissionId
    ? await submissions.doc(submissionId).get().catch(() => null)
    : await getLatestSubmitted(OPENID, activityId, periodId).then((doc) => (doc ? { data: doc } : null))
  if (!existing || !existing.data) {
    return { ok: false, message: 'Submission not found' }
  }
  if (existing.data.ownerOpenid !== OPENID || (activityId && existing.data.activityId !== activityId)) {
    return { ok: false, message: 'Submission not found' }
  }
  if (periodId && existing.data.periodId && existing.data.periodId !== periodId) {
    return { ok: false, message: 'Submission not found' }
  }
  if (existing.data.status === 'paid') {
    return { ok: false, message: 'Submission already paid' }
  }

  const docId = existing.data._id || submissionId
  const scholarshipCode = normalizeScholarshipCode(existing.data.payScholarshipCode || existing.data.scholarshipCode || '')
  const payOrderNo = existing.data.payOrderNo ? String(existing.data.payOrderNo).trim() : ''
  if (scholarshipCode) {
    await cloud.callFunction({
      name: 'scholarshipCodeManage',
      data: {
        action: 'release',
        code: scholarshipCode,
        activityId: existing.data.activityId || activityId,
        submissionId: docId,
        outTradeNo: payOrderNo,
        ownerOpenid: OPENID
      }
    }).catch(() => null)
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

