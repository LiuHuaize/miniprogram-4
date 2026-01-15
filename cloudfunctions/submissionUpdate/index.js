const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const users = db.collection('users')
const children = db.collection('children')
const submissions = db.collection('submissions')

const maskIdNo = (value) => {
  if (!value) return ''
  const text = String(value)
  if (text.length <= 8) {
    return text.replace(/.(?=.{2})/g, '*')
  }
  return `${text.slice(0, 3)}${'*'.repeat(text.length - 7)}${text.slice(-4)}`
}

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

const buildGuardianSnapshot = (guardianInput, existingSubmission, existingUser) => {
  const name = normalizeText(guardianInput.name)
  const phone = normalizeText(guardianInput.phone)
  const wechat = normalizeText(guardianInput.wechat)
  const idNoRaw = normalizeText(guardianInput.idNo)

  if (!name) {
    throw new Error('Guardian name is required')
  }
  if (!phone) {
    throw new Error('Guardian phone is required')
  }

  let idNo = ''
  let idNoMask = ''

  if (idNoRaw) {
    idNo = idNoRaw
    idNoMask = maskIdNo(idNoRaw)
  } else if (existingSubmission && existingSubmission.guardianSnapshot) {
    idNo = existingSubmission.guardianSnapshot.idNo || ''
    idNoMask = existingSubmission.guardianSnapshot.idNoMask || maskIdNo(idNo)
  } else if (existingUser) {
    idNo = existingUser.idNo || ''
    idNoMask = existingUser.idNoMask || maskIdNo(idNo)
  }

  if (!idNo) {
    throw new Error('Guardian ID card is required')
  }

  return {
    snapshot: {
      name,
      phone,
      wechat,
      idNo,
      idNoMask
    },
    userUpdate: {
      name,
      phone,
      wechat,
      idNo,
      idNoMask
    }
  }
}

const buildChildrenSnapshots = async (openid, childIds) => {
  if (!childIds.length) {
    throw new Error('At least one child is required')
  }

  const uniqueIds = Array.from(new Set(childIds))
  if (uniqueIds.length !== childIds.length) {
    throw new Error('Duplicate child is not allowed')
  }

  const res = await children
    .where({ ownerOpenid: openid, _id: _.in(uniqueIds) })
    .get()

  if (!res.data || res.data.length !== uniqueIds.length) {
    throw new Error('Child not found')
  }

  const map = new Map()
  res.data.forEach((child) => {
    map.set(child._id, child)
  })

  const snapshots = uniqueIds.map((id) => {
    const child = map.get(id)
    const childIdNo = child ? child.idNo || '' : ''
    const childIdNoMask = child ? child.idNoMask || maskIdNo(childIdNo) : ''
    if (!child || !childIdNo) {
      throw new Error('Child ID card is required')
    }
    return {
      id: child._id,
      name: child.name || '',
      idNo: childIdNo,
      idNoMask: childIdNoMask,
      height: child.height || '',
      weight: child.weight || '',
      allergies: child.allergies || '',
      personality: child.personality || ''
    }
  })

  return snapshots
}

exports.main = async (event) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const activityId = event && event.activityId ? String(event.activityId) : ''
    if (!activityId) {
      return { ok: false, message: 'activityId is required' }
    }

    const guardianInput = event.guardian || {}
    const childIds = Array.isArray(event.childIds) ? event.childIds.filter(Boolean) : []

    const docId = `${OPENID}_${activityId}`
    const existing = await submissions.doc(docId).get().catch(() => null)
    if (!existing || !existing.data) {
      return { ok: false, message: 'Submission not found' }
    }

    if (existing.data.status !== 'submitted') {
      return { ok: false, message: 'Submission is cancelled' }
    }

    const userRes = await users.where({ ownerOpenid: OPENID }).limit(1).get()
    const user = userRes.data.length > 0 ? userRes.data[0] : null

    const guardianResult = buildGuardianSnapshot(guardianInput, existing.data, user)
    const childrenSnapshot = await buildChildrenSnapshots(OPENID, childIds)

    const now = db.serverDate()
    await submissions.doc(docId).update({
      data: {
        guardianSnapshot: guardianResult.snapshot,
        childrenSnapshot,
        childIds,
        updatedAt: now
      }
    })

    if (user) {
      await users.doc(user._id).update({
        data: {
          ...guardianResult.userUpdate,
          updatedAt: now
        }
      })
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, message: err.message || 'Server error' }
  }
}
