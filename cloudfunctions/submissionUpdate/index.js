const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const users = db.collection('users')
const children = db.collection('children')
const submissions = db.collection('submissions')
const {
  maskIdNo,
  normalizeText,
  normalizeScholarshipCode,
  scholarshipDiscountAmount,
  scholarshipLabel,
  createGetLatestSubmitted
} = require('./backend-common')

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

const getLatestSubmitted = createGetLatestSubmitted(submissions)
const resetPaymentDraft = {
  payOrderNo: '',
  payAmount: 0,
  payCurrency: '',
  payUnitAmount: 0,
  payAlumniUnitAmount: 0,
  payCamperCount: 0,
  payAlumniCount: 0,
  payRegularCount: 0,
  payDiscountType: '',
  payDiscountLabel: '',
  payDiscountMatchedNames: [],
  payScholarshipCode: '',
  payScholarshipDiscount: 0,
  payScholarshipLabel: '',
  payScholarshipHoldExpiresAt: 0,
  payVerifiedAt: null,
  payVerifiedAmount: 0,
  payVerifiedCurrency: '',
  payTransactionId: '',
  paidAt: null
}

const buildPeriodSnapshot = (periodInput, periodId, fallbackSnapshot) => {
  const period = periodInput && typeof periodInput === 'object' ? periodInput : {}
  const fallback = fallbackSnapshot && typeof fallbackSnapshot === 'object' ? fallbackSnapshot : {}
  return {
    id: periodId,
    name: normalizeText(period.name) || normalizeText(fallback.name),
    date: normalizeText(period.date) || normalizeText(fallback.date),
    deadline: normalizeText(period.deadline) || normalizeText(fallback.deadline),
    quota: normalizeText(period.quota) || normalizeText(fallback.quota)
  }
}

const buildScholarshipSnapshot = (event) => {
  const code = normalizeScholarshipCode(event && event.scholarshipCode ? event.scholarshipCode : '')
  if (code && (code.length < 5 || code.length > 6)) {
    throw new Error('奖学金兑换码格式不正确')
  }
  return {
    code,
    discountAmount: code ? scholarshipDiscountAmount : 0,
    label: code ? scholarshipLabel : '',
    status: code ? 'pending' : '',
    redeemedAt: null,
    redeemedOrderNo: ''
  }
}

exports.main = async (event) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const activityId = event && event.activityId ? String(event.activityId) : ''
    if (!activityId) {
      return { ok: false, message: 'activityId is required' }
    }
    const periodId = event && event.periodId ? String(event.periodId).trim() : ''

    const guardianInput = event.guardian || {}
    const childIds = Array.isArray(event.childIds) ? event.childIds.filter(Boolean) : []
    const scholarshipSnapshot = buildScholarshipSnapshot(event)

    const submissionId = event && event.submissionId ? String(event.submissionId) : ''
    const existing = submissionId
      ? await submissions.doc(submissionId).get().catch(() => null)
      : await getLatestSubmitted(OPENID, activityId, periodId).then((doc) => (doc ? { data: doc } : null))
    if (!existing || !existing.data) {
      return { ok: false, message: 'Submission not found' }
    }
    if (existing.data.ownerOpenid !== OPENID || existing.data.activityId !== activityId) {
      return { ok: false, message: 'Submission not found' }
    }
    if (periodId && existing.data.periodId && existing.data.periodId !== periodId) {
      return { ok: false, message: 'Submission not found' }
    }
    const effectivePeriodId = periodId || existing.data.periodId || ''
    if (!effectivePeriodId) {
      return { ok: false, message: 'periodId is required' }
    }
    const docId = existing.data._id || submissionId

    if (existing.data.status !== 'submitted') {
      const message = existing.data.status === 'paid' ? 'Submission already paid' : 'Submission is cancelled'
      return { ok: false, message }
    }

    const userRes = await users.where({ ownerOpenid: OPENID }).limit(1).get()
    const user = userRes.data.length > 0 ? userRes.data[0] : null

    const guardianResult = buildGuardianSnapshot(guardianInput, existing.data, user)
    const childrenSnapshot = await buildChildrenSnapshots(OPENID, childIds)
    const periodSnapshot = buildPeriodSnapshot(event.periodSnapshot, effectivePeriodId, existing.data.periodSnapshot)

    const now = db.serverDate()
    await submissions.doc(docId).update({
      data: {
        periodId: effectivePeriodId,
        periodSnapshot,
        guardianSnapshot: guardianResult.snapshot,
        childrenSnapshot,
        childIds,
        scholarshipCode: scholarshipSnapshot.code,
        scholarshipDiscountAmount: scholarshipSnapshot.discountAmount,
        scholarshipStatus: scholarshipSnapshot.status,
        scholarshipLabel: scholarshipSnapshot.label,
        scholarshipRedeemedAt: scholarshipSnapshot.redeemedAt,
        scholarshipRedeemedOrderNo: scholarshipSnapshot.redeemedOrderNo,
        updatedAt: now,
        ...resetPaymentDraft
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

    return { ok: true, submissionId: docId }
  } catch (err) {
    return { ok: false, message: err.message || 'Server error' }
  }
}

