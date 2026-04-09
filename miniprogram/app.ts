// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-9g9y5ajj044396e0',
        traceUser: true,
      })
    }

    // 登录
    wx.login({
      success: () => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})
