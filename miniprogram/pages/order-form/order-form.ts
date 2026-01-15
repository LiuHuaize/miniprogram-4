import { getActivitySummary } from '../../utils/activities'
import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'

Component({
  data: {
    activityId: 'ai-camp-2026',
    summary: getActivitySummary('ai-camp-2026'),
    posterUrls: getPosterFallbackUrls(),
    periods: [
      {
        id: 'p1',
        name: '第一期',
        date: '02/08 - 02/13',
        deadline: '2026.02.07',
        quota: '名额情况：咨询顾问'
      }
    ],
    selectedPeriodIndex: 0,
    periodPopupVisible: false,
    guardian: {
      name: '',
      idNo: '',
      idNoMask: '',
      phone: '',
      wechat: ''
    },
    campers: [
      {
        id: '',
        name: '',
        idNoMask: '',
        height: '',
        weight: '',
        allergies: '',
        personality: ''
      }
    ],
    maxCampers: 6,
    submissionStatus: '',
    loading: false,
    loadedActivityId: ''
  },
  pageLifetimes: {
    show() {
      this.loadPosterUrls()
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
        options?: Record<string, string>
      }
      const options = current?.options || {}
      const periodName = options.periodName ? decodeURIComponent(options.periodName) : ''
      const periodDate = options.periodDate ? decodeURIComponent(options.periodDate) : ''
      const activityId = options.activityId ? decodeURIComponent(options.activityId) : ''
      const nextActivityId = activityId || this.data.activityId
      if (nextActivityId) {
        this.setData({
          activityId: nextActivityId,
          summary: getActivitySummary(nextActivityId)
        })
      }
      if (periodName) {
        const index = this.data.periods.findIndex((item) => item.name === periodName)
        if (index !== -1) {
          this.setData({
            selectedPeriodIndex: index
          })
        }
      }
      if (periodDate) {
        const period = this.data.periods[this.data.selectedPeriodIndex]
        if (period && period.date !== periodDate) {
          const periods = this.data.periods.map((item, index) => {
            if (index === this.data.selectedPeriodIndex) {
              return {
                ...item,
                date: periodDate
              }
            }
            return item
          })
          this.setData({ periods })
        }
      }
      if (nextActivityId && this.data.loadedActivityId !== nextActivityId) {
        this.setData({ loadedActivityId: nextActivityId })
        this.ensureLogin().then(() => {
          this.loadSubmission()
        })
      }
    }
  },
  methods: {
    onImageError(event: WechatMiniprogram.ImageErrorEvent) {
      const dataset = event.currentTarget.dataset as { src?: string }
      console.warn('image-load-failed', dataset?.src || '', event.detail?.errMsg || '')
    },
    loadPosterUrls() {
      loadPosterUrls().then((posterUrls) => {
        this.setData({ posterUrls })
      })
    },
    ensureLogin() {
      return new Promise((resolve) => {
        if (!wx.cloud) {
          wx.showToast({ title: '云开发未初始化', icon: 'none' })
          resolve(false)
          return
        }
        const userId = wx.getStorageSync('user_id')
        if (userId) {
          resolve(true)
          return
        }
        wx.cloud.callFunction({
          name: 'login',
          data: {},
          success: (res) => {
            const result = (res.result || {}) as { userId?: string }
            if (result.userId) {
              wx.setStorageSync('user_id', result.userId)
            }
            resolve(true)
          },
          fail: () => {
            wx.showToast({ title: '登录失败', icon: 'none' })
            resolve(false)
          }
        })
      })
    },
    loadSubmission() {
      if (!wx.cloud) {
        return
      }
      this.setData({ loading: true })
      wx.cloud.callFunction({
        name: 'submissionGetByActivity',
        data: {
          activityId: this.data.activityId
        },
        success: (res) => {
          const result = (res.result || {}) as {
            ok?: boolean
            data?: {
              status: string
              guardianSnapshot: {
                name: string
                phone: string
                wechat: string
                idNoMask: string
              }
              childrenSnapshot: Array<{
                id: string
                name: string
                idNoMask: string
                height: string
                weight: string
                allergies: string
                personality: string
              }>
            } | null
          }
          if (!result.ok || !result.data) {
            return
          }
          const guardian = result.data.guardianSnapshot
          const campers = result.data.childrenSnapshot.length
            ? result.data.childrenSnapshot
            : [
                {
                  id: '',
                  name: '',
                  idNoMask: '',
                  height: '',
                  weight: '',
                  allergies: '',
                  personality: ''
                }
              ]
          this.setData({
            submissionStatus: result.data.status,
            guardian: {
              name: guardian.name || '',
              phone: guardian.phone || '',
              wechat: guardian.wechat || '',
              idNo: '',
              idNoMask: guardian.idNoMask || ''
            },
            campers
          })
        },
        fail: () => {
          wx.showToast({ title: '加载失败', icon: 'none' })
        },
        complete: () => {
          this.setData({ loading: false })
        }
      })
    },
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onChoosePeriod() {
      this.setData({
        periodPopupVisible: true
      })
    },
    onClosePeriods() {
      this.setData({
        periodPopupVisible: false
      })
    },
    onSelectPeriod(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset as { index?: number }
      if (index === undefined) {
        return
      }
      this.setData({
        selectedPeriodIndex: index
      })
    },
    onConfirmPeriod() {
      this.setData({
        periodPopupVisible: false
      })
    },
    onChangeCount(event: WechatMiniprogram.BaseEvent) {
      const { type } = event.currentTarget.dataset as { type?: 'plus' | 'minus' }
      if (!type) {
        return
      }
      const current = this.data.campers.length
      let next = current + (type === 'plus' ? 1 : -1)
      next = Math.max(1, Math.min(this.data.maxCampers, next))
      if (next === current) {
        return
      }
      const campers = this.data.campers.slice(0, next)
      while (campers.length < next) {
        campers.push({
          id: '',
          name: '',
          idNoMask: '',
          height: '',
          weight: '',
          allergies: '',
          personality: ''
        })
      }
      this.setData({
        campers
      })
    },
    onGuardianNameChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        guardian: {
          ...this.data.guardian,
          name: e.detail.value
        }
      })
    },
    onGuardianIdChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        guardian: {
          ...this.data.guardian,
          idNo: e.detail.value,
          idNoMask: this.data.guardian.idNoMask
        }
      })
    },
    onGuardianPhoneChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        guardian: {
          ...this.data.guardian,
          phone: e.detail.value
        }
      })
    },
    onGuardianWechatChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        guardian: {
          ...this.data.guardian,
          wechat: e.detail.value
        }
      })
    },
    onOpenCamper(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset as { index?: number }
      if (index === undefined) {
        return
      }
      const camper = this.data.campers[index]
      wx.navigateTo({
        url: `/pages/camper-list/camper-list?index=${index}&selectedId=${encodeURIComponent(camper.id || '')}`,
        events: {
          selected: (payload: { index: number; camper: { id: string; name: string; idNoMask?: string; height: string; weight: string; allergies: string; personality: string } }) => {
            const campers = [...this.data.campers]
            if (campers[payload.index]) {
              campers[payload.index] = {
                ...payload.camper,
                idNoMask: payload.camper.idNoMask || ''
              }
              this.setData({ campers })
            }
          }
        },
        success: () => {}
      })
    },
    validateForm() {
      if (!this.data.guardian.name) {
        wx.showToast({ title: '请填写监护人姓名', icon: 'none' })
        return false
      }
      if (!this.data.guardian.phone) {
        wx.showToast({ title: '请填写监护人手机号', icon: 'none' })
        return false
      }
      if (!this.data.guardian.idNo && !this.data.guardian.idNoMask) {
        wx.showToast({ title: '请填写监护人身份证号', icon: 'none' })
        return false
      }
      const missing = this.data.campers.find((item) => !item.id)
      if (missing) {
        wx.showToast({ title: '请先选择营员', icon: 'none' })
        return false
      }
      return true
    },
    onSubmit() {
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }
      if (!this.validateForm()) {
        return
      }
      const childIds = this.data.campers.map((item) => item.id).filter(Boolean)
      const isUpdate = this.data.submissionStatus === 'submitted'
      const functionName = isUpdate ? 'submissionUpdate' : 'submissionSubmit'

      wx.showLoading({ title: '提交中' })
      wx.cloud.callFunction({
        name: functionName,
        data: {
          activityId: this.data.activityId,
          guardian: {
            name: this.data.guardian.name,
            phone: this.data.guardian.phone,
            wechat: this.data.guardian.wechat,
            idNo: this.data.guardian.idNo
          },
          childIds
        },
        success: (res) => {
          const result = (res.result || {}) as { ok?: boolean; message?: string }
          if (!result.ok) {
            wx.showToast({ title: result.message || '提交失败', icon: 'none' })
            return
          }
          this.setData({ submissionStatus: 'submitted' })
          wx.showToast({ title: '提交成功', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '提交失败', icon: 'none' })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    }
  }
})
