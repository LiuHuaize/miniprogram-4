type UserProfile = {
  nickName: string
  avatarUrl: string
  avatarFileId?: string
}

Component({
  data: {
    tabValue: 'mine',
    hasLogin: false,
    loginLoading: false,
    profileEditorVisible: false,
    profileSaving: false,
    userInfo: {
      nickName: '微信用户',
      avatarUrl: '',
      avatarFileId: ''
    },
    profileDraft: {
      nickName: '',
      avatarUrl: '',
      avatarFileId: ''
    }
  },
  lifetimes: {
    attached() {
      this.restoreSession()
    },
  },
  methods: {
    isProfileComplete(profile?: UserProfile) {
      if (!profile) return false
      if (!profile.nickName) return false
      if (profile.nickName === '微信用户') return false
      if (!profile.avatarUrl) return false
      return true
    },
    restoreSession() {
      const profile = wx.getStorageSync('user_profile')
      const userId = wx.getStorageSync('user_id')
      if (profile && userId) {
        if (wx.cloud && profile.avatarFileId) {
          wx.cloud.getTempFileURL({
            fileList: [profile.avatarFileId],
            success: (res) => {
              const tempFileURL = res.fileList?.[0]?.tempFileURL || ''
              const nextProfile = {
                ...profile,
                avatarUrl: tempFileURL || profile.avatarUrl
              }
              wx.setStorageSync('user_profile', nextProfile)
              this.setData({
                hasLogin: true,
                userInfo: nextProfile,
                profileEditorVisible: !this.isProfileComplete(nextProfile),
                profileDraft: {
                  nickName: nextProfile.nickName || '',
                  avatarUrl: nextProfile.avatarUrl || '',
                  avatarFileId: nextProfile.avatarFileId || ''
                }
              })
            },
            fail: () => {
              this.setData({
                hasLogin: true,
                userInfo: profile,
                profileEditorVisible: !this.isProfileComplete(profile),
                profileDraft: {
                  nickName: profile.nickName || '',
                  avatarUrl: profile.avatarUrl || '',
                  avatarFileId: profile.avatarFileId || ''
                }
              })
            }
          })
          return
        }
        this.setData({
          hasLogin: true,
          userInfo: profile,
          profileEditorVisible: !this.isProfileComplete(profile),
          profileDraft: {
            nickName: profile.nickName || '',
            avatarUrl: profile.avatarUrl || '',
            avatarFileId: profile.avatarFileId || ''
          }
        })
      }
    },
    normalizeProfile(userInfo?: WechatMiniprogram.UserInfo): UserProfile {
      return {
        nickName: userInfo?.nickName || '',
        avatarUrl: userInfo?.avatarUrl || '',
        avatarFileId: ''
      }
    },
    saveProfile(profile: UserProfile) {
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
            profileEditorVisible: false,
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
          this.setData({
            loginLoading: false,
            profileSaving: false
          })
        },
      })
    },
    onLoginTap() {
      if (this.data.hasLogin) {
        if (!this.isProfileComplete(this.data.userInfo as UserProfile)) {
          this.setData({
            profileEditorVisible: true,
            profileDraft: {
              nickName: this.data.userInfo.nickName || '',
              avatarUrl: this.data.userInfo.avatarUrl || '',
              avatarFileId: this.data.userInfo.avatarFileId || ''
            }
          })
        }
        return
      }
      if (this.data.loginLoading) return
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }

      this.setData({ loginLoading: true })
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: res => {
          const isDemote = Boolean((res.userInfo as { is_demote?: boolean })?.is_demote)
          const profile = this.normalizeProfile(res.userInfo)
          if (isDemote || !this.isProfileComplete(profile)) {
            this.setData({
              profileEditorVisible: true,
              profileDraft: {
                ...profile,
                avatarFileId: ''
              },
              loginLoading: false,
            })
            return
          }
          this.saveProfile(profile)
        },
        fail: () => {
          this.setData({ loginLoading: false })
          wx.showToast({ title: '已取消授权', icon: 'none' })
        },
      })
    },
    onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
      const avatarUrl = e.detail?.avatarUrl || ''
      if (!avatarUrl) return
      this.setData({
        'profileDraft.avatarUrl': avatarUrl
      })
    },
    onNicknameInput(e: WechatMiniprogram.Input) {
      const value = (e.detail?.value || '').trim()
      this.setData({
        'profileDraft.nickName': value
      })
    },
    onNicknameBlur(e: WechatMiniprogram.Input) {
      const value = (e.detail?.value || '').trim()
      if (!value) return
      this.setData({
        'profileDraft.nickName': value
      })
    },
    onProfileCancel() {
      this.setData({
        profileEditorVisible: false,
        profileDraft: {
          nickName: '',
          avatarUrl: '',
          avatarFileId: ''
        }
      })
    },
    onProfileConfirm() {
      if (this.data.profileSaving) return
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }
      const { nickName, avatarUrl } = this.data.profileDraft as UserProfile
      if (!nickName) {
        wx.showToast({ title: '请填写昵称', icon: 'none' })
        return
      }
      if (!avatarUrl) {
        wx.showToast({ title: '请选择头像', icon: 'none' })
        return
      }
      this.setData({ profileSaving: true })
      const isRemote = avatarUrl.startsWith('http') || avatarUrl.startsWith('cloud://')
      if (isRemote) {
        this.saveProfile({
          nickName,
          avatarUrl,
          avatarFileId: avatarUrl.startsWith('cloud://') ? avatarUrl : ''
        })
        return
      }
      const ext = avatarUrl.includes('.png') ? 'png' : 'jpg'
      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl,
        success: uploadRes => {
          const fileId = uploadRes.fileID
          wx.cloud.getTempFileURL({
            fileList: [fileId],
            success: tempRes => {
              const tempFileURL = tempRes.fileList?.[0]?.tempFileURL || ''
              this.saveProfile({
                nickName,
                avatarUrl: tempFileURL || avatarUrl,
                avatarFileId: fileId
              })
            },
            fail: () => {
              this.saveProfile({
                nickName,
                avatarUrl,
                avatarFileId: fileId
              })
            }
          })
        },
        fail: () => {
          this.setData({ profileSaving: false })
          wx.showToast({ title: '头像上传失败', icon: 'none' })
        }
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
          avatarFileId: ''
        },
        profileEditorVisible: false,
        profileDraft: {
          nickName: '',
          avatarUrl: '',
          avatarFileId: ''
        }
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
