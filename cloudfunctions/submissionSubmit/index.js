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
  scholarshipLabel,
  createGetOrCreateUser,
  createGetLatestSubmitted
} = require('./backend-common')

const getOrCreateUser = createGetOrCreateUser(users)
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
    throw new Error('请填写监护人身份证明')
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
      throw new Error('请完善学员身份证明')
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

const buildPeriodSnapshot = (periodInput, periodId) => {
  const period = periodInput && typeof periodInput === 'object' ? periodInput : {}
  return {
    id: periodId,
    name: normalizeText(period.name),
    date: normalizeText(period.date),
    deadline: normalizeText(period.deadline),
    quota: normalizeText(period.quota)
  }
}

const buildScholarshipSnapshot = async (activityId, submissionId, event) => {
  const code = normalizeScholarshipCode(event && event.scholarshipCode ? event.scholarshipCode : '')
  if (code && (code.length < 5 || code.length > 6)) {
    throw new Error('奖学金兑换码格式不正确')
  }
  if (!code) {
    return {
      code: '',
      discountAmount: 0,
      label: '',
      status: '',
      redeemedAt: null,
      redeemedOrderNo: ''
    }
  }

  const previewRes = await cloud.callFunction({
    name: 'scholarshipCodeManage',
    data: {
      action: 'preview',
      activityId,
      submissionId,
      code
    }
  }).catch((error) => ({
    result: {
      ok: false,
      available: false,
      message: error.message || '奖学金兑换码暂不可用'
    }
  }))

  const previewResult = previewRes && previewRes.result ? previewRes.result : {}
  if (!previewResult.ok || !previewResult.available) {
    throw new Error(previewResult.message || '奖学金兑换码不可用')
  }

  return {
    code: previewResult.normalizedCode || code,
    discountAmount: Number(previewResult.discountAmount) || 0,
    label: previewResult.label || scholarshipLabel,
    status: 'pending',
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
    if (!periodId) {
      return { ok: false, message: 'periodId is required' }
    }

    const now = db.serverDate()
    const guardianInput = event.guardian || {}
    const childIds = Array.isArray(event.childIds) ? event.childIds.filter(Boolean) : []
    const periodSnapshot = buildPeriodSnapshot(event.periodSnapshot, periodId)

    const user = await getOrCreateUser(OPENID, now)
    const existingSubmitted = await getLatestSubmitted(OPENID, activityId, periodId)
    const scholarshipSnapshot = await buildScholarshipSnapshot(
      activityId,
      existingSubmitted ? existingSubmitted._id || '' : '',
      event
    )

    const guardianResult = buildGuardianSnapshot(guardianInput, existingSubmitted, user)
    const childrenSnapshot = await buildChildrenSnapshots(OPENID, childIds)

    const submissionData = {
      ownerOpenid: OPENID,
      guardianId: user._id,
      activityId,
      periodId,
      periodSnapshot,
      status: 'submitted',
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
      cancelledAt: null,
      ...resetPaymentDraft
    }

    let submissionId = ''
    if (existingSubmitted) {
      submissionId = existingSubmitted._id
      await submissions.doc(submissionId).update({ data: submissionData })
    } else {
      submissionData.createdAt = now
      const addRes = await submissions.add({ data: submissionData })
      submissionId = addRes._id
    }

    await users.doc(user._id).update({
      data: {
        ...guardianResult.userUpdate,
        updatedAt: now
      }
    })

    return { ok: true, submissionId }
  } catch (err) {
    return { ok: false, message: err.message || 'Server error' }
  }
}
