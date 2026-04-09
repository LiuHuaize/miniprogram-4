import { getPosterFallbackUrls } from '../../utils/cloud-assets'
import { getTaskSummaries } from '../../utils/tasks'

type TaskCard = ReturnType<typeof getTaskSummaries>[number] & {
  coverUrl: string
}

const buildTaskCards = (posterUrls: Record<string, string>): TaskCard[] => {
  return getTaskSummaries().map((item) => ({
    ...item,
    coverUrl: posterUrls[item.coverPath] || item.coverPath
  }))
}

Component({
  data: {
    tabValue: 'activity',
    searchKeyword: '',
    currentTypeFilter: '全部任务',
    posterUrls: getPosterFallbackUrls(),
    tasks: buildTaskCards(getPosterFallbackUrls())
  },
  lifetimes: {
    attached() {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }
  },
  methods: {
    onTaskTap(e: WechatMiniprogram.BaseEvent) {
      const { taskId } = e.currentTarget.dataset as { taskId?: string }
      if (!taskId) return
      wx.navigateTo({
        url: `/pages/task-detail/task-detail?taskId=${encodeURIComponent(taskId)}`
      })
    },
    onTabChange(e: WechatMiniprogram.CustomEvent) {
      const value = e.detail.value
      if (value === this.data.tabValue) return
      if (value === 'activity') {
        wx.redirectTo({ url: '/pages/index/index' })
        return
      }
      if (value === 'mine') {
        wx.redirectTo({ url: '/pages/my/my' })
        return
      }
      this.setData({ tabValue: value })
    }
  }
})
