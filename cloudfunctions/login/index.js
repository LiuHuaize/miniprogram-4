const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const users = db.collection('users')

exports.main = async (event, context) => {
  const { OPENID, UNIONID } = cloud.getWXContext()
  const profile = event && event.profile ? event.profile : {}
  const now = db.serverDate()

  const existing = await users.where({ _openid: OPENID }).limit(1).get()
  if (existing.data.length > 0) {
    const user = existing.data[0]
    const updateData = {
      lastLoginAt: now,
    }
    if (profile && Object.keys(profile).length > 0) {
      updateData.profile = profile
    }
    if (UNIONID) {
      updateData.unionid = UNIONID
    }
    await users.doc(user._id).update({ data: updateData })
    return {
      userId: user._id,
      openid: OPENID,
      isNew: false,
    }
  }

  const newUser = {
    profile,
    createdAt: now,
    lastLoginAt: now,
    unionid: UNIONID || '',
  }
  const addRes = await users.add({ data: newUser })
  return {
    userId: addRes._id,
    openid: OPENID,
    isNew: true,
  }
}
