Component({
  data: {
    campers: [] as Array<{ id: string; name: string; idNoMask?: string; height: string; weight: string; allergies: string; personality: string }>,
    selectedId: '',
    index: 0
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
        options?: Record<string, string>
      }
      const index = Number(current?.options?.index || 0)
      const selectedId = current?.options?.selectedId || ''
      this.setData({ index, selectedId })
      this.loadCampers()
    }
  },
  methods: {
    loadCampers() {
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }
      wx.cloud.callFunction({
        name: 'childrenList',
        data: {},
        success: (res) => {
          const result = (res.result || {}) as { ok?: boolean; data?: typeof this.data.campers }
          if (result.ok && result.data) {
            this.setData({ campers: result.data })
          }
        },
        fail: () => {
          wx.showToast({ title: '营员加载失败', icon: 'none' })
        }
      })
    },
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onAdd() {
      wx.navigateTo({
        url: '/pages/camper-info/camper-info?mode=add',
        events: {
          saved: () => {
            this.loadCampers()
          }
        },
        success: (res) => {
          res.eventChannel.emit('load', {
            camper: null
          })
        }
      })
    },
    onSelect(event: WechatMiniprogram.BaseEvent) {
      const { id } = event.currentTarget.dataset as { id?: string }
      if (!id) {
        return
      }
      this.setData({ selectedId: id })
    },
    onConfirm() {
      const selected = this.data.campers.find((item) => item.id === this.data.selectedId)
      if (!selected) {
        wx.showToast({
          title: '请选择营员',
          icon: 'none'
        })
        return
      }
      const payload = {
        index: this.data.index,
        camper: selected
      }
      const channel = this.getOpenerEventChannel()
      channel.emit('selected', payload)
      wx.navigateBack({
        delta: 1
      })
    }
  }
})
