const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')

const maskIdNo = (value) => {
  if (!value) return ''
  const text = String(value)
  if (text.length <= 8) {
    return text.replace(/.(?=.{2})/g, '*')
  }
  return `${text.slice(0, 3)}${'*'.repeat(text.length - 7)}${text.slice(-4)}`
}

const sanitizeGuardian = (guardian = {}) => ({
  name: guardian.name || '',
  phone: guardian.phone || '',
  wechat: guardian.wechat || '',
  idNo: guardian.idNo || '',
  idNoMask: guardian.idNoMask || maskIdNo(guardian.idNo || '')
})

const sanitizeChild = (child = {}) => ({
  id: child.id || '',
  name: child.name || '',
  idNo: child.idNo || '',
  idNoMask: child.idNoMask || maskIdNo(child.idNo || ''),
  height: child.height || '',
  weight: child.weight || '',
  allergies: child.allergies || '',
  personality: child.personality || ''
})

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const activityId = event && event.activityId ? String(event.activityId) : ''
  const periodId = event && event.periodId ? String(event.periodId).trim() : ''
  const submissionId = event && event.submissionId ? String(event.submissionId) : ''
  if (!activityId && !submissionId) {
    return { ok: false, message: 'activityId is required' }
  }

  let doc = null
  if (submissionId) {
    const res = await submissions.doc(submissionId).get().catch(() => null)
    if (!res || !res.data) {
      return { ok: true, data: null }
    }
    if (res.data.ownerOpenid !== OPENID || (activityId && res.data.activityId !== activityId)) {
      return { ok: false, message: 'Submission not found' }
    }
    if (periodId && res.data.periodId && res.data.periodId !== periodId) {
      return { ok: false, message: 'Submission not found' }
    }
    doc = res.data
  } else {
    const where = { ownerOpenid: OPENID, activityId }
    if (periodId) {
      where.periodId = periodId
    }
    const res = await submissions.where(where).orderBy('updatedAt', 'desc').limit(1).get()

    if (!res.data || res.data.length === 0) {
      return { ok: true, data: null }
    }
    doc = res.data[0]
  }

  const guardianSnapshot = sanitizeGuardian(doc.guardianSnapshot)
  const childrenSnapshot = (doc.childrenSnapshot || []).map(sanitizeChild)

  return {
    ok: true,
    data: {
      id: doc._id,
      activityId: doc.activityId,
      periodId: doc.periodId || '',
      periodSnapshot: doc.periodSnapshot || null,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      cancelledAt: doc.cancelledAt || null,
      payOrderNo: doc.payOrderNo || '',
      payAmount: doc.payAmount || 0,
      paidAt: doc.paidAt || null,
      guardianSnapshot,
      childrenSnapshot,
      childIds: doc.childIds || []
    }
  }
}
