const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const users = db.collection('users')

exports.main = async (event) => {
  const { OPENID, UNIONID } = cloud.getWXContext()
  const profile = event && event.profile ? event.profile : {}
  const now = db.serverDate()

  const existing = await users.where({ ownerOpenid: OPENID }).limit(1).get()
  if (existing.data.length > 0) {
    const user = existing.data[0]
    const updateData = {
      lastLoginAt: now,
      updatedAt: now,
    }
    if (profile && Object.keys(profile).length > 0) {
      updateData.profile = profile
    }
    if (UNIONID) {
      updateData.unionid = UNIONID
    }
    await users.doc(user._id).update({ data: updateData })
    return {
      ok: true,
      userId: user._id,
      openid: OPENID,
      isNew: false,
    }
  }

  const newUser = {
    ownerOpenid: OPENID,
    profile,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    unionid: UNIONID || '',
  }
  const addRes = await users.add({ data: newUser })
  return {
    ok: true,
    userId: addRes._id,
    openid: OPENID,
    isNew: true,
  }
}
