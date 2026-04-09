const cloud = require('wx-server-sdk')
const {
  scholarshipSeedVersion,
  scholarshipEligibleActivityIds,
  scholarshipLabel,
  interviewFeeDiscountAmount,
  defaultScholarshipAmount,
  defaultScholarshipDiscountAmount,
  buildScholarshipDescription,
  initialScholarshipCodeDocs
} = require('./codes')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const submissions = db.collection('submissions')
const scholarshipCodes = db.collection('scholarship_codes')

const holdDurationMs = 15 * 60 * 1000
const seedMetaId = '__meta__'
const eligibleActivityIdSet = new Set(scholarshipEligibleActivityIds)

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeScholarshipCode = (value) => normalizeText(value).toUpperCase().replace(/[^A-Z]/g, '')
const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const chunk = (items, size) => {
  const result = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

const buildCodeDoc = (codeDocInput) => {
  const scholarshipAmount = toNumber(codeDocInput && codeDocInput.scholarshipAmount) || defaultScholarshipAmount
  const interviewDiscountAmount =
    toNumber(codeDocInput && codeDocInput.interviewFeeDiscountAmount) || interviewFeeDiscountAmount
  const discountAmount =
    toNumber(codeDocInput && codeDocInput.discountAmount) || scholarshipAmount + interviewDiscountAmount

  return {
    code: codeDocInput.code,
    batchId: codeDocInput.batchId || scholarshipSeedVersion,
    label: codeDocInput.label || scholarshipLabel,
    description: codeDocInput.description || buildScholarshipDescription(scholarshipAmount),
    scholarshipAmount,
    interviewFeeDiscountAmount: interviewDiscountAmount,
    discountAmount,
    activityIds: scholarshipEligibleActivityIds,
    status: codeDocInput.initialStatus || 'unused',
    holdSubmissionId: '',
    holdActivityId: '',
    holdOpenid: '',
    holdOrderNo: '',
    holdPlacedAt: 0,
    holdExpiresAt: 0,
    redeemedSubmissionId: '',
    redeemedActivityId: '',
    redeemedByOpenid: '',
    redeemedOrderNo: '',
    redeemedAt: null,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }
}

const isActivityEligible = (activityId) => eligibleActivityIdSet.has(activityId)

const hasActiveHold = (doc, nowMs) => {
  if (!doc || doc.status !== 'held') {
    return false
  }
  return toNumber(doc.holdExpiresAt) > nowMs
}

const isSameHoldOwner = (doc, submissionId, outTradeNo) => {
  if (!doc) {
    return false
  }
  if (submissionId && doc.holdSubmissionId && doc.holdSubmissionId === submissionId) {
    return true
  }
  if (outTradeNo && doc.holdOrderNo && doc.holdOrderNo === outTradeNo) {
    return true
  }
  return false
}

const resolveOperatorOpenid = (event, context) => {
  const contextOpenid = normalizeText(context && context.OPENID ? context.OPENID : '')
  if (contextOpenid) {
    return contextOpenid
  }
  return normalizeText(event && event.ownerOpenid ? event.ownerOpenid : '')
}

const normalizeCodeDoc = (doc) => {
  const scholarshipAmount = toNumber(doc && doc.scholarshipAmount) || defaultScholarshipAmount
  const interviewDiscountAmount =
    toNumber(doc && doc.interviewFeeDiscountAmount) || interviewFeeDiscountAmount
  const discountAmount =
    toNumber(doc && doc.discountAmount) || scholarshipAmount + interviewDiscountAmount || defaultScholarshipDiscountAmount

  return {
    scholarshipAmount,
    scholarshipYuan: scholarshipAmount / 100,
    interviewFeeDiscountAmount: interviewDiscountAmount,
    interviewFeeDiscountYuan: interviewDiscountAmount / 100,
    discountAmount,
    discountYuan: discountAmount / 100,
    label: doc && doc.label ? doc.label : scholarshipLabel,
    description: doc && doc.description ? doc.description : buildScholarshipDescription(scholarshipAmount)
  }
}

const formatPreviewMessage = (normalizedCodeDoc) => {
  return `兑换码可用，支付时可抵扣¥${normalizedCodeDoc.discountYuan}（奖学金¥${normalizedCodeDoc.scholarshipYuan} + 面试抵扣¥${normalizedCodeDoc.interviewFeeDiscountYuan}）`
}

const ensureSeeded = async () => {
  const metaRes = await scholarshipCodes.doc(seedMetaId).get().catch(() => null)
  if (metaRes && metaRes.data && metaRes.data.version === scholarshipSeedVersion) {
    return { seeded: 0, totalCodes: initialScholarshipCodeDocs.length }
  }

  const existingRes = await scholarshipCodes.where({ batchId: _.in([...new Set(initialScholarshipCodeDocs.map((item) => item.batchId))]) }).limit(200).get().catch(() => ({ data: [] }))
  const existingCodeSet = new Set((existingRes.data || []).map((item) => normalizeScholarshipCode(item.code || item._id || '')))
  const missingCodeDocs = initialScholarshipCodeDocs.filter((item) => !existingCodeSet.has(item.code))

  for (const group of chunk(missingCodeDocs, 20)) {
    await Promise.all(
      group.map((codeDoc) => scholarshipCodes.doc(codeDoc.code).set({ data: buildCodeDoc(codeDoc) }))
    )
  }

  await scholarshipCodes.doc(seedMetaId).set({
    data: {
      type: 'meta',
      version: scholarshipSeedVersion,
      totalCodes: initialScholarshipCodeDocs.length,
      updatedAt: db.serverDate(),
      seededAt: db.serverDate()
    }
  })

  return {
    seeded: missingCodeDocs.length,
    totalCodes: initialScholarshipCodeDocs.length
  }
}

const ensureSubmissionOwned = async (submissionId, ownerOpenid, activityId) => {
  if (!submissionId || !ownerOpenid) {
    return null
  }
  const res = await submissions.doc(submissionId).get().catch(() => null)
  if (!res || !res.data) {
    return null
  }
  if (res.data.ownerOpenid !== ownerOpenid) {
    return null
  }
  if (activityId && res.data.activityId && res.data.activityId !== activityId) {
    return null
  }
  return res.data
}

const previewCode = async (event, context) => {
  const activityId = normalizeText(event && event.activityId)
  const submissionId = normalizeText(event && event.submissionId)
  const code = normalizeScholarshipCode(event && event.code)

  if (!activityId || !isActivityEligible(activityId)) {
    return { ok: false, available: false, message: '当前活动暂不支持奖学金兑换码' }
  }
  if (!code) {
    return { ok: false, available: false, message: '请输入兑换码' }
  }

  await ensureSeeded()
  const codeRes = await scholarshipCodes.doc(code).get().catch(() => null)
  if (!codeRes || !codeRes.data || codeRes.data.type === 'meta') {
    return { ok: false, available: false, normalizedCode: code, message: '兑换码不存在' }
  }

  const codeDoc = codeRes.data
  const activityIds = Array.isArray(codeDoc.activityIds) ? codeDoc.activityIds.filter(Boolean) : []
  if (activityIds.length > 0 && !activityIds.includes(activityId)) {
    return { ok: false, available: false, normalizedCode: code, message: '兑换码不适用于当前活动' }
  }

  const nowMs = Date.now()
  if (codeDoc.status === 'redeemed' && codeDoc.redeemedSubmissionId !== submissionId) {
    return { ok: false, available: false, normalizedCode: code, message: '兑换码已被使用' }
  }
  if (hasActiveHold(codeDoc, nowMs) && !isSameHoldOwner(codeDoc, submissionId, '')) {
    return { ok: false, available: false, normalizedCode: code, message: '兑换码正在处理中，请稍后再试' }
  }

  return {
    ok: true,
    available: true,
    normalizedCode: code,
    ...normalizeCodeDoc(codeDoc),
    holdExpiresAt: hasActiveHold(codeDoc, nowMs) && codeDoc.holdSubmissionId === submissionId
      ? toNumber(codeDoc.holdExpiresAt)
      : 0,
    message: formatPreviewMessage(normalizeCodeDoc(codeDoc))
  }
}

const holdCode = async (event, context) => {
  const activityId = normalizeText(event && event.activityId)
  const submissionId = normalizeText(event && event.submissionId)
  const outTradeNo = normalizeText(event && event.outTradeNo)
  const code = normalizeScholarshipCode(event && event.code)
  const ownerOpenid = resolveOperatorOpenid(event, context)

  if (!activityId || !isActivityEligible(activityId)) {
    return { ok: false, message: '当前活动暂不支持奖学金兑换码' }
  }
  if (!code) {
    return { ok: false, message: '兑换码不能为空' }
  }
  if (!submissionId || !outTradeNo || !ownerOpenid) {
    return { ok: false, message: '兑换码锁定参数缺失' }
  }

  await ensureSeeded()
  const submission = await ensureSubmissionOwned(submissionId, ownerOpenid, activityId)
  if (!submission) {
    return { ok: false, message: 'Submission not found' }
  }

  const nowMs = Date.now()
  const holdExpiresAt = nowMs + holdDurationMs

  try {
    const result = await db.runTransaction(async (transaction) => {
      const codeRes = await transaction.collection('scholarship_codes').doc(code).get().catch(() => null)
      const codeDoc = codeRes && codeRes.data ? codeRes.data : null
      if (!codeDoc || codeDoc.type === 'meta') {
        throw new Error('兑换码不存在')
      }
      const activityIds = Array.isArray(codeDoc.activityIds) ? codeDoc.activityIds.filter(Boolean) : []
      if (activityIds.length > 0 && !activityIds.includes(activityId)) {
        throw new Error('兑换码不适用于当前活动')
      }
      if (codeDoc.status === 'redeemed' && codeDoc.redeemedSubmissionId !== submissionId) {
        throw new Error('兑换码已被使用')
      }
      if (hasActiveHold(codeDoc, nowMs) && !isSameHoldOwner(codeDoc, submissionId, outTradeNo)) {
        throw new Error('兑换码正在处理中，请稍后再试')
      }

      await transaction.collection('scholarship_codes').doc(code).update({
        data: {
          status: 'held',
          holdSubmissionId: submissionId,
          holdActivityId: activityId,
          holdOpenid: ownerOpenid,
          holdOrderNo: outTradeNo,
          holdPlacedAt: nowMs,
          holdExpiresAt,
          updatedAt: db.serverDate()
        }
      })

      return normalizeCodeDoc(codeDoc)
    })

    return {
      ok: true,
      code,
      holdExpiresAt,
      ...result,
      message: '兑换码已锁定，等待支付完成'
    }
  } catch (error) {
    return { ok: false, message: error.message || '兑换码暂不可用' }
  }
}

const releaseCode = async (event, context) => {
  const activityId = normalizeText(event && event.activityId)
  const submissionId = normalizeText(event && event.submissionId)
  const outTradeNo = normalizeText(event && event.outTradeNo)
  const code = normalizeScholarshipCode(event && event.code)
  const ownerOpenid = resolveOperatorOpenid(event, context)

  if (!code) {
    return { ok: true, released: false }
  }

  await ensureSeeded()

  if (submissionId && ownerOpenid) {
    const submission = await ensureSubmissionOwned(submissionId, ownerOpenid, activityId)
    if (!submission) {
      return { ok: false, released: false, message: 'Submission not found' }
    }
  }

  try {
    const result = await db.runTransaction(async (transaction) => {
      const codeRes = await transaction.collection('scholarship_codes').doc(code).get().catch(() => null)
      const codeDoc = codeRes && codeRes.data ? codeRes.data : null
      if (!codeDoc || codeDoc.type === 'meta') {
        return { released: false }
      }
      if (codeDoc.status !== 'held') {
        return { released: false }
      }
      if (submissionId && codeDoc.holdSubmissionId && codeDoc.holdSubmissionId !== submissionId) {
        return { released: false }
      }
      if (ownerOpenid && codeDoc.holdOpenid && codeDoc.holdOpenid !== ownerOpenid) {
        return { released: false }
      }
      if (outTradeNo && codeDoc.holdOrderNo && codeDoc.holdOrderNo !== outTradeNo) {
        return { released: false }
      }

      await transaction.collection('scholarship_codes').doc(code).update({
        data: {
          status: 'unused',
          holdSubmissionId: '',
          holdActivityId: '',
          holdOpenid: '',
          holdOrderNo: '',
          holdPlacedAt: 0,
          holdExpiresAt: 0,
          updatedAt: db.serverDate()
        }
      })

      return { released: true }
    })

    return { ok: true, released: !!result.released }
  } catch (error) {
    return { ok: false, released: false, message: error.message || '兑换码释放失败' }
  }
}

exports.main = async (event, context) => {
  const action = normalizeText(event && event.action) || 'preview'

  if (action === 'seed') {
    const seedResult = await ensureSeeded()
    return {
      ok: true,
      ...seedResult,
      version: scholarshipSeedVersion
    }
  }
  if (action === 'preview') {
    return previewCode(event, context)
  }
  if (action === 'hold') {
    return holdCode(event, context)
  }
  if (action === 'release') {
    return releaseCode(event, context)
  }

  return { ok: false, message: 'Unsupported action' }
}
