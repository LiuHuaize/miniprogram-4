import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'
import { defaultTaskId, getTaskDetail } from '../../utils/tasks'

type DetailTabKey = 'brief' | 'ranking' | 'gallery'

type PosterUrls = Record<string, string>

type DetailState = ReturnType<typeof createDetailState>

type DraftField = 'draftAudience' | 'draftProblem' | 'draftSolution' | 'draftLink'

const detailTabs: Array<{ key: DetailTabKey; label: string }> = [
  { key: 'brief', label: '任务简介' },
  { key: 'ranking', label: '排行榜' },
  { key: 'gallery', label: '学员展厅' }
]

const getRouteTaskId = () => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
    options?: Record<string, string>
  }
  const rawTaskId = current?.options?.taskId
  if (!rawTaskId) return ''
  try {
    return decodeURIComponent(rawTaskId)
  } catch {
    return rawTaskId
  }
}

const createDetailState = (taskId: string, posterUrls: PosterUrls) => {
  const task = getTaskDetail(taskId)
  return {
    taskId: task.id,
    monthLabel: task.monthLabel,
    status: task.status,
    statusClass: task.statusClass,
    title: task.title,
    meta: task.meta,
    prompt: task.prompt,
    brief: task.brief,
    deadline: task.deadline,
    participantLabel: task.participantLabel,
    submitLabel: task.submitLabel,
    coverUrl: posterUrls[task.coverPath] || task.coverPath,
    posterUrl: posterUrls[task.posterPath] || task.posterPath,
    challengePoints: task.challengePoints,
    questions: task.questions,
    leaderboard: task.leaderboard,
    gallery: task.gallery.map((item) => ({
      ...item,
      coverUrl: posterUrls[item.coverPath] || item.coverPath
    }))
  }
}

const defaultPosterUrls = getPosterFallbackUrls()
const defaultState = createDetailState(defaultTaskId, defaultPosterUrls)

Component({
  data: {
    posterUrls: defaultPosterUrls,
    tabs: detailTabs,
    activeTab: 'brief' as DetailTabKey,
    submitPopupVisible: false,
    draftImages: [] as string[],
    draftAudience: '',
    draftProblem: '',
    draftSolution: '',
    draftLink: '',
    ...defaultState
  },
  lifetimes: {
    attached() {
      this.syncTaskDetail()
      this.loadPosters()
    }
  },
  pageLifetimes: {
    show() {
      this.syncTaskDetail()
    }
  },
  methods: {
    syncTaskDetail() {
      const taskId = getRouteTaskId() || this.data.taskId || defaultTaskId
      const nextState = createDetailState(taskId, this.data.posterUrls as PosterUrls)
      this.setData(nextState)
    },
    loadPosters() {
      loadPosterUrls().then((posterUrls) => {
        const nextState = createDetailState(this.data.taskId || defaultTaskId, posterUrls)
        this.setData({
          posterUrls,
          ...nextState
        })
      })
    },
    onBack() {
      wx.navigateBack({ delta: 1 })
    },
    onTab(e: WechatMiniprogram.BaseEvent) {
      const { key } = e.currentTarget.dataset as { key?: DetailTabKey }
      if (!key || key === this.data.activeTab) return
      this.setData({ activeTab: key })
    },
    onPreviewPoster() {
      const current = this.data.posterUrl
      if (!current) return
      wx.previewImage({
        current,
        urls: [current]
      })
    },
    onPreviewGallery(e: WechatMiniprogram.BaseEvent) {
      const { galleryId } = e.currentTarget.dataset as { galleryId?: string }
      if (!galleryId) return
      const gallery = (this.data.gallery as Array<DetailState['gallery'][number]>).find(
        (item) => item.id === galleryId
      )
      if (!gallery?.coverUrl) {
        wx.showToast({ title: '作品预览建设中', icon: 'none' })
        return
      }
      wx.previewImage({
        current: gallery.coverUrl,
        urls: [gallery.coverUrl]
      })
    },
    onOpenSubmit() {
      this.setData({ submitPopupVisible: true })
    },
    onCloseSubmit() {
      this.setData({ submitPopupVisible: false })
    },
    onChooseImages() {
      const remainCount = Math.max(0, 6 - this.data.draftImages.length)
      if (!remainCount) {
        wx.showToast({ title: '最多上传 6 张', icon: 'none' })
        return
      }
      wx.chooseImage({
        count: remainCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const nextImages = [...this.data.draftImages, ...res.tempFilePaths].slice(0, 6)
          this.setData({ draftImages: nextImages })
        }
      })
    },
    onRemoveImage(e: WechatMiniprogram.BaseEvent) {
      const { index } = e.currentTarget.dataset as { index?: number }
      if (index === undefined) return
      const nextImages = [...this.data.draftImages]
      nextImages.splice(index, 1)
      this.setData({ draftImages: nextImages })
    },
    onDraftInput(e: WechatMiniprogram.Input) {
      const { field } = e.currentTarget.dataset as { field?: DraftField }
      if (!field) return
      this.setData({
        [field]: e.detail.value || ''
      })
    },
    onMockSubmit() {
      if (!this.data.draftImages.length) {
        wx.showToast({ title: '请先上传作品图片', icon: 'none' })
        return
      }
      if (!this.data.draftProblem || !this.data.draftSolution) {
        wx.showToast({ title: '请先补充文字说明', icon: 'none' })
        return
      }
      wx.showToast({ title: 'UI 演示提交成功', icon: 'success' })
      this.setData({
        submitPopupVisible: false,
        draftImages: [],
        draftAudience: '',
        draftProblem: '',
        draftSolution: '',
        draftLink: ''
      })
    }
  }
})
