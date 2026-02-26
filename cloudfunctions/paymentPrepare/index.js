const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')

const padNumber = (value, length = 2) => String(value).padStart(length, '0')

const activityPaymentConfigMap = {
  'ai-camp-2026': {
    totalFee: 1680000,
    periodIds: ['sz-p1']
  },
  'ai-camp-2026-copy': {
    totalFee: 1880000,
    periodIds: ['sz-p1', 'hz-p2', 'bj-p3']
  }
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

const resolveTotalFee = (activityId, periodId) => {
  const config = activityPaymentConfigMap[activityId]
  if (!config || !config.totalFee) {
    return {
      ok: false,
      message: 'Activity payment config missing'
    }
  }
  if (periodId && Array.isArray(config.periodIds) && config.periodIds.length && !config.periodIds.includes(periodId)) {
    return {
      ok: false,
      message: 'Invalid periodId for activity'
    }
  }
  return {
    ok: true,
    totalFee: Number(config.totalFee)
  }
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
    const resolvedPeriodId = periodId || submissionRes.data.periodId || ''
    const feeResult = resolveTotalFee(resolvedActivityId, resolvedPeriodId)
    if (!feeResult.ok) {
      console.warn('[paymentPrepare] fee config invalid', {
        resolvedActivityId,
        resolvedPeriodId,
        message: feeResult.message
      })
      return { ok: false, message: feeResult.message || 'Payment config invalid' }
    }

    const outTradeNo = buildOutTradeNo(OPENID)
    const totalFee = feeResult.totalFee

    const now = db.serverDate()
    await submissions.doc(docId).update({
      data: {
        activityId: resolvedActivityId,
        periodId: resolvedPeriodId || submissionRes.data.periodId || '',
        payOrderNo: outTradeNo,
        payAmount: totalFee,
        updatedAt: now
      }
    })

    console.info('[paymentPrepare] ready', { outTradeNo, totalFee, resolvedActivityId, resolvedPeriodId })
    return {
      ok: true,
      outTradeNo,
      totalFee,
      activityId: resolvedActivityId,
      periodId: resolvedPeriodId,
      submissionId: docId
    }
  } catch (err) {
    console.error('[paymentPrepare] error', err)
    return { ok: false, message: err.message || 'Server error' }
  }
}
