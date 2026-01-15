export const activityMap: Record<string, { title: string; sub: string; price: string }> = {
  'ai-camp-2026': {
    title: '少年独角兽 AI 创业营 2026',
    sub: '约 6 天 · 深圳 · 广东',
    price: '咨询价'
  }
}

export const getActivitySummary = (activityId: string) => {
  return activityMap[activityId] || activityMap['ai-camp-2026']
}
