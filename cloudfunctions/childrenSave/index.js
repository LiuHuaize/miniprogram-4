const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const users = db.collection('users')
const children = db.collection('children')
const {
  maskIdNo,
  normalizeText,
  createGetOrCreateUser
} = require('./backend-common')

const getOrCreateUser = createGetOrCreateUser(users)

exports.main = async (event) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const now = db.serverDate()
    const name = normalizeText(event.name)
    const childId = normalizeText(event.childId)

    if (!name) {
      return { ok: false, message: 'Name is required' }
    }

    const guardian = await getOrCreateUser(OPENID, now)
    let idNo = ''
    let idNoMask = ''

    const rawIdNo = normalizeText(event.idNo)
    if (rawIdNo) {
      idNo = rawIdNo
      idNoMask = maskIdNo(rawIdNo)
    } else if (childId) {
      const existing = await children.doc(childId).get().catch(() => null)
      if (!existing || !existing.data) {
        return { ok: false, message: 'Child not found' }
      }
      if (existing.data.ownerOpenid !== OPENID) {
        return { ok: false, message: 'Not allowed' }
      }
      idNo = existing.data.idNo || ''
      idNoMask = existing.data.idNoMask || maskIdNo(existing.data.idNo || '')
    } else {
      return { ok: false, message: 'ID card is required' }
    }

    if (!idNo) {
      return { ok: false, message: 'ID card is required' }
    }

    const data = {
      ownerOpenid: OPENID,
      guardianId: guardian._id,
      name,
      idNo,
      idNoMask,
      height: normalizeText(event.height),
      weight: normalizeText(event.weight),
      allergies: normalizeText(event.allergies),
      personality: normalizeText(event.personality),
      updatedAt: now
    }

    if (childId) {
      await children.doc(childId).update({ data })
      return { ok: true, childId, idNoMask }
    }

    data.createdAt = now
    const addRes = await children.add({ data })
    return { ok: true, childId: addRes._id, idNoMask }
  } catch (err) {
    return { ok: false, message: err.message || 'Server error' }
  }
}
