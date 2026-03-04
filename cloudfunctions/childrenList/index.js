const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const children = db.collection('children')
const PAGE_SIZE = 100

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

  const all = []
  let offset = 0

  while (true) {
    const res = await children
      .where({ ownerOpenid: OPENID })
      .orderBy('updatedAt', 'desc')
      .skip(offset)
      .limit(PAGE_SIZE)
      .get()

    const batch = res.data || []
    if (!batch.length) {
      break
    }

    all.push(...batch)
    if (batch.length < PAGE_SIZE) {
      break
    }
    offset += batch.length
  }

  const data = all.map((item) => {
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
