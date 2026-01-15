Component({
  data: {
    index: 0,
    camper: {
      id: '',
      name: '',
      idNo: '',
      idNoMask: '',
      height: '',
      weight: '',
      allergies: '',
      personality: ''
    }
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
        options?: Record<string, string>
      }
      const index = Number(current?.options?.index || 0)
      this.setData({ index })
      const channel = this.getOpenerEventChannel()
      channel.on('load', (payload: {
        camper?: {
          id?: string
          name: string
          idNo: string
          idNoMask?: string
          height: string
          weight: string
          allergies: string
          personality: string
        }
      } | null) => {
        if (payload?.camper) {
          this.setData({
            camper: {
              id: payload.camper.id || '',
              name: payload.camper.name || '',
              idNo: '',
              idNoMask: payload.camper.idNoMask || '',
              height: payload.camper.height || '',
              weight: payload.camper.weight || '',
              allergies: payload.camper.allergies || '',
              personality: payload.camper.personality || ''
            }
          })
        }
      })
      ;(this as unknown as { eventChannel?: WechatMiniprogram.EventChannel }).eventChannel = channel
    }
  },
  methods: {
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onNameChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        camper: {
          ...this.data.camper,
          name: e.detail.value
        }
      })
    },
    onIdChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        camper: {
          ...this.data.camper,
          idNo: e.detail.value,
          idNoMask: this.data.camper.idNoMask
        }
      })
    },
    onHeightChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        camper: {
          ...this.data.camper,
          height: e.detail.value
        }
      })
    },
    onWeightChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        camper: {
          ...this.data.camper,
          weight: e.detail.value
        }
      })
    },
    onAllergiesChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        camper: {
          ...this.data.camper,
          allergies: e.detail.value
        }
      })
    },
    onPersonalityChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        camper: {
          ...this.data.camper,
          personality: e.detail.value
        }
      })
    },
    onSave() {
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }
      const camper = this.data.camper
      if (!camper.name) {
        wx.showToast({ title: '请填写营员姓名', icon: 'none' })
        return
      }
      wx.cloud.callFunction({
        name: 'childrenSave',
        data: {
          childId: camper.id,
          name: camper.name,
          idNo: camper.idNo,
          height: camper.height,
          weight: camper.weight,
          allergies: camper.allergies,
          personality: camper.personality
        },
        success: (res) => {
          const result = (res.result || {}) as { ok?: boolean; childId?: string; idNoMask?: string; message?: string }
          if (!result.ok) {
            wx.showToast({ title: result.message || '保存失败', icon: 'none' })
            return
          }
          const payload = {
            ...camper,
            id: result.childId || camper.id,
            idNo: '',
            idNoMask: result.idNoMask || camper.idNoMask
          }
          const channel = (this as unknown as { eventChannel?: WechatMiniprogram.EventChannel }).eventChannel
          if (channel) {
            channel.emit('saved', payload)
          }
          wx.showToast({ title: '保存成功', icon: 'success' })
          wx.navigateBack({
            delta: 1
          })
        },
        fail: () => {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      })
    }
  }
})
