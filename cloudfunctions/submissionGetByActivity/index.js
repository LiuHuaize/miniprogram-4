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
  idNoMask: guardian.idNoMask || maskIdNo(guardian.idNo || '')
})

const sanitizeChild = (child = {}) => ({
  id: child.id || '',
  name: child.name || '',
  idNoMask: child.idNoMask || maskIdNo(child.idNo || ''),
  height: child.height || '',
  weight: child.weight || '',
  allergies: child.allergies || '',
  personality: child.personality || ''
})

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const activityId = event && event.activityId ? String(event.activityId) : ''
  if (!activityId) {
    return { ok: false, message: 'activityId is required' }
  }

  const res = await submissions
    .where({ ownerOpenid: OPENID, activityId })
    .limit(1)
    .get()

  if (!res.data || res.data.length === 0) {
    return { ok: true, data: null }
  }

  const doc = res.data[0]
  const guardianSnapshot = sanitizeGuardian(doc.guardianSnapshot)
  const childrenSnapshot = (doc.childrenSnapshot || []).map(sanitizeChild)

  return {
    ok: true,
    data: {
      id: doc._id,
      activityId: doc.activityId,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      cancelledAt: doc.cancelledAt || null,
      guardianSnapshot,
      childrenSnapshot,
      childIds: doc.childIds || []
    }
  }
}
