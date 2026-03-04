const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')
const PAGE_SIZE = 100

const getAllMySubmissions = async (openid) => {
  const all = []
  let offset = 0

  while (true) {
    const res = await submissions
      .where({ ownerOpenid: openid })
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

  return all
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const rows = await getAllMySubmissions(OPENID)

  const data = rows.map((doc) => ({
    id: doc._id,
    activityId: doc.activityId,
    periodId: doc.periodId || '',
    periodSnapshot: doc.periodSnapshot || null,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    cancelledAt: doc.cancelledAt || null,
    childrenCount: (doc.childIds || []).length,
    guardianName: doc.guardianSnapshot ? doc.guardianSnapshot.name || '' : ''
  }))

  return { ok: true, data }
}
