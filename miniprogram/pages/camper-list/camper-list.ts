type CamperItem = {
  id: string
  name: string
  idNoMask?: string
  height: string
  weight: string
  allergies: string
  personality: string
  disabled?: boolean
}

const decodeValue = (value?: string) => {
  if (!value) {
    return ''
  }
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const normalizeIdList = (ids: string[] = [], selectedId = '') => {
  const selected = decodeValue(selectedId)
  const normalized = ids
    .map((id) => decodeValue(id))
    .filter((id) => !!id && id !== selected)
  return Array.from(new Set(normalized))
}

const parseBlockedIds = (value?: string, selectedId = '') => {
  const decoded = decodeValue(value)
  if (!decoded) {
    return [] as string[]
  }
  try {
    const parsed = JSON.parse(decoded)
    if (Array.isArray(parsed)) {
      return normalizeIdList(parsed as string[], selectedId)
    }
  } catch {
  }
  return normalizeIdList(decoded.split(','), selectedId)
}

const withBlockedState = (campers: CamperItem[] = [], blockedIds: string[] = []) => {
  const blockedIdSet = new Set(blockedIds)
  return campers.map((item) => ({
    ...item,
    disabled: blockedIdSet.has(item.id)
  }))
}

Component({
  data: {
    campers: [] as CamperItem[],
    selectedId: '',
    index: 0,
    blockedIds: [] as string[]
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
        options?: Record<string, string>
      }
      const routeIndex = Number(current?.options?.index || 0)
      const routeSelectedId = decodeValue(current?.options?.selectedId || '')
      const routeBlockedIds = parseBlockedIds(current?.options?.blockedIds || '', routeSelectedId)
      this.setData({
        index: Number.isFinite(routeIndex) ? routeIndex : 0,
        selectedId: routeSelectedId,
        blockedIds: routeBlockedIds
      })
      const channel = this.getOpenerEventChannel()
      channel.on('init', (payload: { index?: number; selectedId?: string; blockedIds?: string[] } | null) => {
        const eventIndex = Number(payload?.index || 0)
        const eventSelectedId = decodeValue(payload?.selectedId || '')
        const eventBlockedIds = normalizeIdList(payload?.blockedIds || [], eventSelectedId)
        this.setData({
          index: Number.isFinite(eventIndex) ? eventIndex : 0,
          selectedId: eventSelectedId,
          blockedIds: eventBlockedIds,
          campers: withBlockedState(this.data.campers, eventBlockedIds)
        })
      })
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
          const result = (res.result || {}) as { ok?: boolean; data?: CamperItem[] }
          if (result.ok && result.data) {
            const blockedIds = normalizeIdList(this.data.blockedIds, this.data.selectedId)
            this.setData({
              blockedIds,
              campers: withBlockedState(result.data, blockedIds)
            })
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
      const { id, disabled } = event.currentTarget.dataset as { id?: string; disabled?: boolean | 'true' | 'false' }
      if (!id) {
        return
      }
      const isDisabled = disabled === true || disabled === 'true'
      if (isDisabled) {
        wx.showToast({ title: '该营员已在其他位置选择', icon: 'none' })
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
      if (selected.disabled) {
        wx.showToast({
          title: '该营员已在其他位置选择',
          icon: 'none'
        })
        return
      }
      const payload = {
        index: this.data.index,
        camper: {
          id: selected.id,
          name: selected.name,
          idNoMask: selected.idNoMask || '',
          height: selected.height,
          weight: selected.weight,
          allergies: selected.allergies,
          personality: selected.personality
        }
      }
      const channel = this.getOpenerEventChannel()
      channel.emit('selected', payload)
      wx.navigateBack({
        delta: 1
      })
    }
  }
})
