const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')
const scholarshipCodes = db.collection('scholarship_codes')

const toPositiveInteger = (value) => {
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) {
    return Math.floor(num)
  }
  return 0
}

const normalizeCurrency = (value) => (value ? String(value).trim().toUpperCase() : '')
const normalizeScholarshipCode = (value) => (typeof value === 'string' ? value.trim().toUpperCase().replace(/[^A-Z]/g, '') : '')

const getResource = (event) => {
  if (event && event.resource && typeof event.resource === 'object') {
    return event.resource
  }
  return {}
}

const getOutTradeNo = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  return resource.out_trade_no || resource.outTradeNo || payload.out_trade_no || payload.outTradeNo || ''
}

const getPaidAmount = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  const amount = resource.amount && typeof resource.amount === 'object' ? resource.amount : {}
  return toPositiveInteger(amount.total || amount.payer_total || payload.total_fee || payload.totalFee)
}

const getPaidCurrency = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  const amount = resource.amount && typeof resource.amount === 'object' ? resource.amount : {}
  return normalizeCurrency(amount.currency || amount.payer_currency || payload.currency)
}

const getPayerOpenid = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  const payer = resource.payer && typeof resource.payer === 'object' ? resource.payer : {}
  return payer.openid || payload.openid || ''
}

const getTransactionId = (event) => {
  const payload = event && typeof event === 'object' ? event : {}
  const resource = getResource(event)
  return resource.transaction_id || resource.transactionId || payload.transaction_id || payload.transactionId || ''
}

const buildPaidSubmissionData = (expectedCurrency, paidAmount, paidCurrency, transactionId) => ({
  status: 'paid',
  paidAt: db.serverDate(),
  updatedAt: db.serverDate(),
  payCurrency: expectedCurrency || 'CNY',
  payVerifiedAt: db.serverDate(),
  payVerifiedAmount: paidAmount,
  payVerifiedCurrency: paidCurrency || expectedCurrency || 'CNY',
  payTransactionId: transactionId
})

exports.main = async (event) => {
  try {
    const eventType = event && event.event_type ? String(event.event_type) : ''
    if (eventType !== 'TRANSACTION.SUCCESS') {
      return event
    }

    const outTradeNo = getOutTradeNo(event)
    if (!outTradeNo) {
      console.warn('[wxpayOrderCallback] empty outTradeNo')
      return event
    }

    const res = await submissions.where({ payOrderNo: outTradeNo }).limit(1).get()
    if (!res.data || !res.data.length) {
      console.warn('[wxpayOrderCallback] submission not found', {
        outTradeNoSuffix: outTradeNo.slice(-6)
      })
      return event
    }

    const submission = res.data[0]
    const docId = submission._id || ''
    if (!docId) {
      return event
    }
    if (submission.status === 'paid') {
      console.info('[wxpayOrderCallback] duplicate callback ignored', { docId })
      return event
    }
    if (submission.status !== 'submitted') {
      console.warn('[wxpayOrderCallback] invalid status', { docId, status: submission.status || '' })
      return event
    }

    const expectedAmount = toPositiveInteger(submission.payAmount)
    if (!expectedAmount) {
      console.error('[wxpayOrderCallback] missing expected amount', {
        docId,
        outTradeNoSuffix: outTradeNo.slice(-6)
      })
      return event
    }
    const paidAmount = getPaidAmount(event)
    if (!paidAmount || expectedAmount !== paidAmount) {
      console.error('[wxpayOrderCallback] amount mismatch', {
        docId,
        outTradeNoSuffix: outTradeNo.slice(-6),
        expectedAmount,
        paidAmount
      })
      return event
    }

    const expectedCurrency = normalizeCurrency(submission.payCurrency || 'CNY')
    const paidCurrency = getPaidCurrency(event)
    if (paidCurrency && expectedCurrency && paidCurrency !== expectedCurrency) {
      console.error('[wxpayOrderCallback] currency mismatch', {
        docId,
        outTradeNoSuffix: outTradeNo.slice(-6),
        expectedCurrency,
        paidCurrency
      })
      return event
    }

    const payerOpenid = getPayerOpenid(event)
    if (payerOpenid && submission.ownerOpenid && payerOpenid !== submission.ownerOpenid) {
      console.error('[wxpayOrderCallback] payer mismatch', {
        docId,
        outTradeNoSuffix: outTradeNo.slice(-6),
        payerOpenidSuffix: payerOpenid.slice(-6),
        ownerOpenidSuffix: String(submission.ownerOpenid).slice(-6)
      })
      return event
    }

    const scholarshipCode = normalizeScholarshipCode(submission.payScholarshipCode || submission.scholarshipCode || '')
    const transactionId = getTransactionId(event)

    if (!scholarshipCode) {
      const updateRes = await submissions.where({ _id: docId, status: 'submitted' }).update({
        data: buildPaidSubmissionData(expectedCurrency, paidAmount || expectedAmount, paidCurrency, transactionId)
      })
      if (!updateRes || !updateRes.stats || updateRes.stats.updated !== 1) {
        console.info('[wxpayOrderCallback] status unchanged', { docId })
      }
      return event
    }

    try {
      const scholarshipDiscount = toPositiveInteger(submission.payScholarshipDiscount || submission.scholarshipDiscountAmount)
      await db.runTransaction(async (transaction) => {
        const submissionRes = await transaction.collection('submissions').doc(docId).get().catch(() => null)
        const latestSubmission = submissionRes && submissionRes.data ? submissionRes.data : null
        if (!latestSubmission) {
          throw new Error('submission not found in transaction')
        }
        if (latestSubmission.status === 'paid') {
          return
        }
        if (latestSubmission.status !== 'submitted') {
          throw new Error(`invalid submission status: ${latestSubmission.status || ''}`)
        }

        const codeRes = await transaction.collection('scholarship_codes').doc(scholarshipCode).get().catch(() => null)
        const codeDoc = codeRes && codeRes.data ? codeRes.data : null
        if (!codeDoc || codeDoc.type === 'meta') {
          throw new Error('scholarship code missing')
        }

        const sameRedeemedOrder =
          codeDoc.status === 'redeemed' &&
          codeDoc.redeemedSubmissionId === docId &&
          codeDoc.redeemedOrderNo === outTradeNo

        if (codeDoc.status === 'redeemed' && !sameRedeemedOrder) {
          throw new Error('scholarship code already redeemed')
        }

        if (!sameRedeemedOrder) {
          if (codeDoc.status !== 'held') {
            throw new Error(`scholarship code status invalid: ${codeDoc.status || ''}`)
          }
          if ((codeDoc.holdSubmissionId || '') !== docId || (codeDoc.holdOrderNo || '') !== outTradeNo) {
            throw new Error('scholarship code hold mismatch')
          }

          await transaction.collection('scholarship_codes').doc(scholarshipCode).update({
            data: {
              status: 'redeemed',
              holdSubmissionId: '',
              holdActivityId: '',
              holdOpenid: '',
              holdOrderNo: '',
              holdPlacedAt: 0,
              holdExpiresAt: 0,
              redeemedSubmissionId: docId,
              redeemedActivityId: latestSubmission.activityId || submission.activityId || '',
              redeemedByOpenid: latestSubmission.ownerOpenid || submission.ownerOpenid || '',
              redeemedOrderNo: outTradeNo,
              redeemedAt: db.serverDate(),
              updatedAt: db.serverDate()
            }
          })
        }

        await transaction.collection('submissions').doc(docId).update({
          data: {
            ...buildPaidSubmissionData(expectedCurrency, paidAmount || expectedAmount, paidCurrency, transactionId),
            scholarshipStatus: 'redeemed',
            scholarshipDiscountAmount: scholarshipDiscount,
            scholarshipRedeemedAt: db.serverDate(),
            scholarshipRedeemedOrderNo: outTradeNo
          }
        })
      })
    } catch (error) {
      console.error('[wxpayOrderCallback] scholarship redeem failed', {
        docId,
        scholarshipCode,
        message: error.message || 'unknown error'
      })
      return event
    }
  } catch (err) {
    console.error('[wxpayOrderCallback] error', err)
  }

  return event
}

