const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const children = db.collection('children')

const maskIdNo = (value) => {
  if (!value) return ''
  const text = String(value)
  if (text.length <= 8) {
    return text.replace(/.(?=.{2})/g, '*')
  }
  return `${text.slice(0, 3)}${'*'.repeat(text.length - 7)}${text.slice(-4)}`
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()

  const res = await children
    .where({ ownerOpenid: OPENID })
    .orderBy('updatedAt', 'desc')
    .get()

  const data = (res.data || []).map((item) => {
    const idNoMask = item.idNoMask || maskIdNo(item.idNo || '')
    return {
      id: item._id,
      name: item.name || '',
      idNoMask,
      height: item.height || '',
      weight: item.weight || '',
      allergies: item.allergies || '',
      personality: item.personality || ''
    }
  })

  return { ok: true, data }
}
