const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')
const { resolveAlumniDiscount } = require('./alumni-discount')

const scholarshipDiscountAmount = 250000
const scholarshipLabel = '新学员奖学金兑换码'

const padNumber = (value, length = 2) => String(value).padStart(length, '0')
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeScholarshipCode = (value) => normalizeText(value).toUpperCase().replace(/[^A-Z]/g, '')

const activityPaymentConfigMap = {
  'ai-weekend-2026': {
    totalFee: 49800,
    periodIds: ['sz-weekend-p1']
  },
  'ai-weekend-2026-pm': {
    totalFee: 49800,
    periodIds: ['sz-weekend-p2']
  },
  'ai-challenge-2025-hz': {
    totalFee: 1880000,
    periodIds: ['hz-p1']
  },
  'ai-camp-2026': {
    totalFee: 1880000,
    periodIds: ['sz-p1']
  },
  'ai-camp-2026-copy': {
    totalFee: 1880000,
    periodIds: ['sz-p1', 'hz-p2', 'bj-p3']
  }
}

const clearPayScholarshipDraft = {
  payScholarshipCode: '',
  payScholarshipDiscount: 0,
  payScholarshipLabel: '',
  payScholarshipHoldExpiresAt: 0
}

const buildOutTradeNo = (openid) => {
  const now = new Date()
  const stamp = `${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}${padNumber(
    now.getHours()
  )}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}`
  const random = padNumber(Math.floor(Math.random() * 1000000), 6)
  const suffix = openid ? openid.slice(-4) : '0000'
  return `MP${stamp}${random}${suffix}`
}

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

const toPositiveInteger = (value) => {
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) {
    return Math.floor(num)
  }
  return 0
}

const resolveFeeConfig = (activityId) => {
  const config = activityPaymentConfigMap[activityId]
  if (!config || !config.totalFee) {
    return {
      ok: false,
      message: 'Activity payment config missing'
    }
  }
  return {
    ok: true,
    config
  }
}

const resolvePeriodId = (periodId, periodIds = []) => {
  const normalizedPeriodId = periodId ? String(periodId).trim() : ''
  const configuredPeriodIds = Array.isArray(periodIds) ? periodIds.filter(Boolean) : []
  if (!configuredPeriodIds.length) {
    return { ok: true, periodId: normalizedPeriodId }
  }
  if (normalizedPeriodId) {
    if (!configuredPeriodIds.includes(normalizedPeriodId)) {
      return {
        ok: false,
        message: 'Invalid periodId for activity'
      }
    }
    return {
      ok: true,
      periodId: normalizedPeriodId
    }
  }
  if (configuredPeriodIds.length === 1) {
    return {
      ok: true,
      periodId: configuredPeriodIds[0]
    }
  }
  return {
    ok: false,
    message: 'periodId is required'
  }
}

const resolveTotalFee = (activityId) => {
  const configResult = resolveFeeConfig(activityId)
  if (!configResult.ok) {
    return configResult
  }
  const config = configResult.config
  return {
    ok: true,
    totalFee: Number(config.totalFee),
    periodIds: Array.isArray(config.periodIds) ? config.periodIds : []
  }
}

const shouldRequirePeriodId = (activityId) => {
  const configResult = resolveFeeConfig(activityId)
  if (!configResult.ok) {
    return false
  }
  const periodIds = Array.isArray(configResult.config.periodIds) ? configResult.config.periodIds.filter(Boolean) : []
  return periodIds.length > 1
}

const decideOutTradeNo = (existingOrderNo, existingPayAmount, nextPayAmount, openid) => {
  if (!existingOrderNo) {
    return {
      outTradeNo: buildOutTradeNo(openid),
      reusedOrderNo: false
    }
  }
  if (existingPayAmount !== nextPayAmount) {
    return {
      outTradeNo: buildOutTradeNo(openid),
      reusedOrderNo: false
    }
  }
  return {
    outTradeNo: existingOrderNo,
    reusedOrderNo: true
  }
}

const validateRequestPeriod = (activityId, periodId, submissionId) => {
  if (submissionId || !activityId) {
    return { ok: true }
  }
  if (!shouldRequirePeriodId(activityId) || periodId) {
    return { ok: true }
  }
  return {
    ok: false,
    message: 'periodId is required'
  }
}

const callScholarshipCodeManage = async (action, payload) => {
  try {
    const res = await cloud.callFunction({
      name: 'scholarshipCodeManage',
      data: {
        action,
        ...payload
      }
    })
    return res && res.result ? res.result : { ok: false, message: '奖学金服务返回为空' }
  } catch (error) {
    return { ok: false, message: error.message || '奖学金服务暂不可用' }
  }
}

const joinDiscountTypes = (discountApplied, scholarshipApplied) => {
  const result = []
  if (discountApplied) {
    result.push('alumni_mixed')
  }
  if (scholarshipApplied) {
    result.push('scholarship_code')
  }
  return result.join(',')
}

const joinDiscountLabels = (discountLabel, scholarshipDiscountLabel) => {
  return [discountLabel || '', scholarshipDiscountLabel || ''].filter(Boolean).join('；')
}

exports.main = async (event) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const activityId = event && event.activityId ? String(event.activityId) : ''
    const periodId = event && event.periodId ? String(event.periodId).trim() : ''
    const submissionId = event && event.submissionId ? String(event.submissionId) : ''
    console.info('[paymentPrepare] request', {
      activityId,
      periodId,
      submissionId,
      openidSuffix: OPENID ? OPENID.slice(-6) : ''
    })
    if (!activityId && !submissionId) {
      return { ok: false, message: 'activityId is required' }
    }
    const periodValidationResult = validateRequestPeriod(activityId, periodId, submissionId)
    if (!periodValidationResult.ok) {
      return { ok: false, message: periodValidationResult.message || 'periodId is required' }
    }

    const submissionRes = submissionId
      ? await submissions.doc(submissionId).get().catch(() => null)
      : await getLatestSubmitted(OPENID, activityId, periodId).then((doc) => (doc ? { data: doc } : null))
    if (!submissionRes || !submissionRes.data) {
      console.warn('[paymentPrepare] submission not found', { submissionId, activityId, periodId })
      return { ok: false, message: 'Submission not found' }
    }
    const docId = submissionRes.data._id || submissionId
    if (submissionRes.data.ownerOpenid !== OPENID) {
      console.warn('[paymentPrepare] submission not owned', { docId })
      return { ok: false, message: 'Submission not found' }
    }
    if (activityId && submissionRes.data.activityId && submissionRes.data.activityId !== activityId) {
      console.warn('[paymentPrepare] activity mismatch', {
        docId,
        activityId,
        actualActivityId: submissionRes.data.activityId || ''
      })
      return { ok: false, message: 'Submission not found' }
    }
    if (periodId && submissionRes.data.periodId && submissionRes.data.periodId !== periodId) {
      console.warn('[paymentPrepare] period mismatch', {
        docId,
        periodId,
        actualPeriodId: submissionRes.data.periodId || ''
      })
      return { ok: false, message: 'Submission not found' }
    }
    if (submissionRes.data.status === 'paid') {
      console.warn('[paymentPrepare] already paid', { docId })
      return { ok: false, message: 'Submission already paid' }
    }
    if (submissionRes.data.status === 'cancelled') {
      console.warn('[paymentPrepare] cancelled', { docId })
      return { ok: false, message: 'Submission is cancelled' }
    }

    const resolvedActivityId = submissionRes.data.activityId || activityId
    const feeResult = resolveTotalFee(resolvedActivityId)
    if (!feeResult.ok) {
      console.warn('[paymentPrepare] fee config invalid', {
        resolvedActivityId,
        resolvedPeriodId: periodId || submissionRes.data.periodId || '',
        message: feeResult.message
      })
      return { ok: false, message: feeResult.message || 'Payment config invalid' }
    }
    const periodResult = resolvePeriodId(periodId || submissionRes.data.periodId || '', feeResult.periodIds)
    if (!periodResult.ok) {
      console.warn('[paymentPrepare] period invalid', {
        resolvedActivityId,
        requestPeriodId: periodId,
        submissionPeriodId: submissionRes.data.periodId || '',
        message: periodResult.message
      })
      return { ok: false, message: periodResult.message || 'periodId is required' }
    }
    const resolvedPeriodId = periodResult.periodId

    const existingOrderNo = submissionRes.data.payOrderNo ? String(submissionRes.data.payOrderNo).trim() : ''
    const existingPayAmount = toPositiveInteger(submissionRes.data.payAmount)
    const regularFee = feeResult.totalFee
    const discountResult = resolveAlumniDiscount(submissionRes.data.childrenSnapshot, regularFee)
    const computedTotalFee = discountResult.camperCount > 0 ? discountResult.totalFee : regularFee
    const scholarshipCode = normalizeScholarshipCode(submissionRes.data.scholarshipCode)
    const existingPayScholarshipCode = normalizeScholarshipCode(submissionRes.data.payScholarshipCode)
    const hasNewCamper = discountResult.regularCount > 0

    if (existingPayScholarshipCode && existingPayScholarshipCode !== scholarshipCode) {
      await callScholarshipCodeManage('release', {
        code: existingPayScholarshipCode,
        activityId: resolvedActivityId,
        submissionId: docId,
        outTradeNo: existingOrderNo,
        ownerOpenid: OPENID
      })
    }

    if (scholarshipCode && !hasNewCamper) {
      return { ok: false, message: '奖学金兑换码仅限新学员使用' }
    }

    let scholarshipApplied = false
    let scholarshipDiscount = 0
    let scholarshipHoldExpiresAt = 0
    let scholarshipDiscountLabel = ''

    let totalFee = computedTotalFee
    if (scholarshipCode) {
      totalFee = Math.max(computedTotalFee - scholarshipDiscountAmount, 0)
    }

    const orderNoResult = decideOutTradeNo(existingOrderNo, existingPayAmount, totalFee, OPENID)
    const outTradeNo = orderNoResult.outTradeNo

    if (scholarshipCode) {
      const holdResult = await callScholarshipCodeManage('hold', {
        code: scholarshipCode,
        activityId: resolvedActivityId,
        submissionId: docId,
        outTradeNo,
        ownerOpenid: OPENID
      })
      if (!holdResult.ok) {
        return { ok: false, message: holdResult.message || '奖学金兑换码不可用' }
      }
      scholarshipApplied = true
      scholarshipDiscount = toPositiveInteger(holdResult.discountAmount) || scholarshipDiscountAmount
      scholarshipHoldExpiresAt = toPositiveInteger(holdResult.holdExpiresAt)
      scholarshipDiscountLabel = holdResult.label || scholarshipLabel
      totalFee = Math.max(computedTotalFee - scholarshipDiscount, 0)
    } else if (existingPayScholarshipCode) {
      await callScholarshipCodeManage('release', {
        code: existingPayScholarshipCode,
        activityId: resolvedActivityId,
        submissionId: docId,
        outTradeNo: existingOrderNo,
        ownerOpenid: OPENID
      })
    }

    const now = db.serverDate()
    await submissions.doc(docId).update({
      data: {
        activityId: resolvedActivityId,
        periodId: resolvedPeriodId || submissionRes.data.periodId || '',
        payOrderNo: outTradeNo,
        payAmount: totalFee,
        payCurrency: 'CNY',
        payUnitAmount: regularFee,
        payAlumniUnitAmount: discountResult.discountFee,
        payCamperCount: discountResult.camperCount,
        payAlumniCount: discountResult.alumniCount,
        payRegularCount: discountResult.regularCount,
        payDiscountType: joinDiscountTypes(discountResult.discountApplied, scholarshipApplied),
        payDiscountLabel: joinDiscountLabels(discountResult.discountLabel, scholarshipApplied ? scholarshipDiscountLabel : ''),
        payDiscountMatchedNames: discountResult.matchedNames,
        scholarshipStatus: scholarshipApplied ? 'held' : scholarshipCode ? 'pending' : '',
        scholarshipDiscountAmount: scholarshipCode ? scholarshipDiscountAmount : 0,
        scholarshipLabel: scholarshipCode ? scholarshipLabel : '',
        scholarshipRedeemedAt: null,
        scholarshipRedeemedOrderNo: '',
        payScholarshipCode: scholarshipApplied ? scholarshipCode : '',
        payScholarshipDiscount: scholarshipApplied ? scholarshipDiscount : 0,
        payScholarshipLabel: scholarshipApplied ? scholarshipDiscountLabel : '',
        payScholarshipHoldExpiresAt: scholarshipApplied ? scholarshipHoldExpiresAt : 0,
        updatedAt: now,
        ...(scholarshipApplied ? {} : clearPayScholarshipDraft)
      }
    })

    console.info('[paymentPrepare] ready', {
      outTradeNo,
      totalFee,
      reusedOrderNo: orderNoResult.reusedOrderNo,
      resolvedActivityId,
      resolvedPeriodId,
      discountApplied: discountResult.discountApplied,
      camperCount: discountResult.camperCount,
      alumniCount: discountResult.alumniCount,
      regularCount: discountResult.regularCount,
      scholarshipApplied,
      scholarshipCode,
      scholarshipHoldExpiresAt,
      regularFee,
      matchedNames: discountResult.matchedNames
    })
    return {
      ok: true,
      outTradeNo,
      totalFee,
      activityId: resolvedActivityId,
      periodId: resolvedPeriodId,
      submissionId: docId,
      discountApplied: discountResult.discountApplied,
      discountLabel: discountResult.discountLabel,
      camperCount: discountResult.camperCount,
      alumniCount: discountResult.alumniCount,
      regularCount: discountResult.regularCount,
      regularFee,
      matchedNames: discountResult.matchedNames,
      scholarshipCode: scholarshipApplied ? scholarshipCode : '',
      scholarshipDiscount: scholarshipApplied ? scholarshipDiscount : 0,
      scholarshipLabel: scholarshipApplied ? scholarshipDiscountLabel : '',
      scholarshipHoldExpiresAt: scholarshipApplied ? scholarshipHoldExpiresAt : 0
    }
  } catch (err) {
    console.error('[paymentPrepare] error', err)
    return { ok: false, message: err.message || 'Server error' }
  }
}

