Component({
  data: {
    index: 0,
    camper: {
      id: '',
      name: '',
      gender: '',
      birthday: '',
      idNo: ''
    },
    genderVisible: false,
    genderOptions: [
      { label: '男', value: '男' },
      { label: '女', value: '女' }
    ]
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
      channel.on('load', (payload: { camper?: { id?: string; name: string; gender: string; birthday: string; idNo: string } } | null) => {
        if (payload?.camper) {
          this.setData({
            camper: {
              id: payload.camper.id || '',
              name: payload.camper.name || '',
              gender: payload.camper.gender || '',
              birthday: payload.camper.birthday || '',
              idNo: payload.camper.idNo || ''
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
          idNo: e.detail.value
        }
      })
    },
    onOpenGender() {
      this.setData({
        genderVisible: true
      })
    },
    onCloseGender() {
      this.setData({
        genderVisible: false
      })
    },
    onConfirmGender(e: WechatMiniprogram.CustomEvent) {
      const label = e.detail.label
      const text = Array.isArray(label) ? label[0] : label
      this.setData({
        camper: {
          ...this.data.camper,
          gender: text
        },
        genderVisible: false
      })
    },
    onBirthChange(e: WechatMiniprogram.PickerChange) {
      const value = e.detail.value
      this.setData({
        camper: {
          ...this.data.camper,
          birthday: value
        }
      })
    },
    onSave() {
      const camper = {
        ...this.data.camper,
        id: this.data.camper.id || `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
      }
      const list = wx.getStorageSync('commonCampers') || []
      const existsIndex = list.findIndex((item: { id: string }) => item.id === camper.id)
      if (existsIndex >= 0) {
        list[existsIndex] = camper
      } else {
        list.unshift(camper)
      }
      wx.setStorageSync('commonCampers', list)
      const channel = (this as unknown as { eventChannel?: WechatMiniprogram.EventChannel }).eventChannel
      if (channel) {
        channel.emit('saved', camper)
      }
      wx.navigateBack({
        delta: 1
      })
    }
  }
})
