import { getActivitySummary } from '../../utils/activities'

const formatDate = (value: unknown) => {
  if (!value) return ''
  let date: Date | null = null
  if (typeof value === 'object' && value && '$date' in (value as Record<string, unknown>)) {
    const stamp = (value as { $date: number }).$date
    date = new Date(stamp)
  } else if (value instanceof Date) {
    date = value
  } else {
    date = new Date(value as string)
  }
  if (!date || Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

Component({
  data: {
    list: [] as Array<{
      id: string
      activityId: string
      status: string
      statusText: string
      updatedLabel: string
      childrenCount: number
      summary: { title: string; sub: string; price: string }
    }>,
    loading: false
  },
  lifetimes: {
    attached() {
      this.ensureLogin().then(() => {
        this.loadList()
      })
    }
  },
  pageLifetimes: {
    show() {
      this.ensureLogin().then(() => {
        this.loadList()
      })
    }
  },
  methods: {
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
    loadList() {
      if (!wx.cloud) return
      this.setData({ loading: true })
      wx.cloud.callFunction({
        name: 'submissionMyList',
        data: {},
        success: (res) => {
          const result = (res.result || {}) as {
            ok?: boolean
            data?: Array<{
              id: string
              activityId: string
              status: string
              updatedAt: unknown
              childrenCount: number
            }>
          }
          if (!result.ok || !result.data) {
            return
          }
          const list = result.data.map((item) => {
            const summary = getActivitySummary(item.activityId)
            return {
              id: item.id,
              activityId: item.activityId,
              status: item.status,
              statusText: item.status === 'submitted' ? '已提交' : '已撤销',
              updatedLabel: formatDate(item.updatedAt),
              childrenCount: item.childrenCount || 0,
              summary
            }
          })
          this.setData({ list })
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
      wx.navigateBack({ delta: 1 })
    },
    onOpen(e: WechatMiniprogram.BaseEvent) {
      const { activityId } = e.currentTarget.dataset as { activityId?: string }
      if (!activityId) return
      wx.navigateTo({
        url: `/pages/order-form/order-form?activityId=${encodeURIComponent(activityId)}`
      })
    },
    onCancel(e: WechatMiniprogram.BaseEvent) {
      const { activityId } = e.currentTarget.dataset as { activityId?: string }
      if (!activityId) return
      wx.showModal({
        title: '确认撤销报名？',
        success: (res) => {
          if (!res.confirm) return
          wx.cloud.callFunction({
            name: 'submissionCancel',
            data: { activityId },
            success: (callRes) => {
              const result = (callRes.result || {}) as { ok?: boolean; message?: string }
              if (!result.ok) {
                wx.showToast({ title: result.message || '撤销失败', icon: 'none' })
                return
              }
              wx.showToast({ title: '已撤销', icon: 'success' })
              this.loadList()
            },
            fail: () => {
              wx.showToast({ title: '撤销失败', icon: 'none' })
            }
          })
        }
      })
    }
  }
})
