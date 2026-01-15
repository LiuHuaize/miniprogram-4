Component({
  data: {
    tabValue: 'mine',
    hasLogin: false,
    loginLoading: false,
    userInfo: {
      nickName: '微信用户',
      avatarUrl: '',
    }
  },
  lifetimes: {
    attached() {
      this.restoreSession()
    },
  },
  methods: {
    restoreSession() {
      const profile = wx.getStorageSync('user_profile')
      const userId = wx.getStorageSync('user_id')
      if (profile && userId) {
        this.setData({
          hasLogin: true,
          userInfo: profile,
        })
      }
    },
    onLoginTap() {
      if (this.data.hasLogin) return
      if (this.data.loginLoading) return
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }

      this.setData({ loginLoading: true })
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: res => {
          const profile = {
            nickName: res.userInfo.nickName,
            avatarUrl: res.userInfo.avatarUrl,
          }
          wx.cloud.callFunction({
            name: 'login',
            data: { profile },
            success: fnRes => {
              const callResult = fnRes as WechatMiniprogram.Cloud.CallFunctionResult
              const result = (callResult.result || {}) as {
                userId?: string
                isNew?: boolean
              }
              if (result?.userId) {
                wx.setStorageSync('user_id', result.userId)
              }
              wx.setStorageSync('user_profile', profile)
              this.setData({
                hasLogin: true,
                userInfo: profile,
              })
              wx.showToast({
                title: result?.isNew ? '注册成功' : '登录成功',
                icon: 'success',
              })
            },
            fail: () => {
              wx.showToast({ title: '登录失败', icon: 'none' })
            },
            complete: () => {
              this.setData({ loginLoading: false })
            },
          })
        },
        fail: () => {
          this.setData({ loginLoading: false })
          wx.showToast({ title: '已取消授权', icon: 'none' })
        },
      })
    },
    onLogoutTap() {
      wx.removeStorageSync('user_profile')
      wx.removeStorageSync('user_id')
      this.setData({
        hasLogin: false,
        userInfo: {
          nickName: '微信用户',
          avatarUrl: '',
        },
      })
    },
    onMenuTap(e: WechatMiniprogram.CustomEvent) {
      const key = e.currentTarget.dataset.key
      if (key === 'logout') {
        this.onLogoutTap()
        return
      }
      if (key === 'login') {
        this.onLoginTap()
        return
      }
      if (key === 'info') {
        wx.navigateTo({ url: '/pages/my-submissions/my-submissions' })
        return
      }
      wx.showToast({ title: '功能建设中', icon: 'none' })
    },
    onTabChange(e: WechatMiniprogram.CustomEvent) {
      const value = e.detail.value
      if (value === this.data.tabValue) return
      if (value === 'activity') {
        wx.redirectTo({ url: '/pages/index/index' })
        return
      }
      this.setData({ tabValue: value })
    }
  }
})
