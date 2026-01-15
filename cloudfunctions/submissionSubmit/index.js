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

const getOrCreateUser = async (openid, now) => {
  const existing = await users.where({ ownerOpenid: openid }).limit(1).get()
  if (existing.data.length > 0) {
    return existing.data[0]
  }
  const newUser = {
    ownerOpenid: openid,
    createdAt: now,
    updatedAt: now
  }
  const addRes = await users.add({ data: newUser })
  return { _id: addRes._id, ownerOpenid: openid }
}

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

    const now = db.serverDate()
    const guardianInput = event.guardian || {}
    const childIds = Array.isArray(event.childIds) ? event.childIds.filter(Boolean) : []

    const user = await getOrCreateUser(OPENID, now)
    const docId = `${OPENID}_${activityId}`
    const existing = await submissions.doc(docId).get().catch(() => null)
    const existingDoc = existing && existing.data ? existing.data : null

    if (existingDoc && existingDoc.status === 'submitted') {
      return { ok: false, message: 'Submission already exists' }
    }

    const guardianResult = buildGuardianSnapshot(guardianInput, existingDoc, user)
    const childrenSnapshot = await buildChildrenSnapshots(OPENID, childIds)

    const submissionData = {
      ownerOpenid: OPENID,
      guardianId: user._id,
      activityId,
      status: 'submitted',
      guardianSnapshot: guardianResult.snapshot,
      childrenSnapshot,
      childIds,
      updatedAt: now,
      cancelledAt: null
    }

    if (existingDoc) {
      await submissions.doc(docId).update({ data: submissionData })
    } else {
      submissionData.createdAt = now
      await submissions.doc(docId).set({ data: submissionData })
    }

    await users.doc(user._id).update({
      data: {
        ...guardianResult.userUpdate,
        updatedAt: now
      }
    })

    return { ok: true, submissionId: docId }
  } catch (err) {
    return { ok: false, message: err.message || 'Server error' }
  }
}
