const maskIdNo = (value) => {
  if (!value) return ''
  const text = String(value)
  if (text.length <= 8) {
    return text.replace(/.(?=.{2})/g, '*')
  }
  return `${text.slice(0, 3)}${'*'.repeat(text.length - 7)}${text.slice(-4)}`
}

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeScholarshipCode = (value) => normalizeText(value).toUpperCase().replace(/[^A-Z]/g, '')
const scholarshipDiscountAmount = 250000
const scholarshipLabel = '新学员奖学金兑换码'

const createGetOrCreateUser = (users) => async (openid, now) => {
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

const createGetLatestSubmitted = (submissions) => async (openid, activityId, periodId) => {
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

module.exports = {
  maskIdNo,
  normalizeText,
  normalizeScholarshipCode,
  scholarshipDiscountAmount,
  scholarshipLabel,
  createGetOrCreateUser,
  createGetLatestSubmitted
}
