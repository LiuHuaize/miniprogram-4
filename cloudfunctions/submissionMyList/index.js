const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const submissions = db.collection('submissions')

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const res = await submissions
    .where({ ownerOpenid: OPENID })
    .orderBy('updatedAt', 'desc')
    .get()

  const data = (res.data || []).map((doc) => ({
    id: doc._id,
    activityId: doc.activityId,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    cancelledAt: doc.cancelledAt || null,
    childrenCount: (doc.childIds || []).length,
    guardianName: doc.guardianSnapshot ? doc.guardianSnapshot.name || '' : ''
  }))

  return { ok: true, data }
}
