export const activityMap: Record<string, { title: string; sub: string; price: string }> = {
  'ai-weekend-2026': {
    title: '工作坊 · AI解决学习痛点（周末营）',
    sub: '深圳 · 广东',
    price: '¥498'
  },
  'ai-weekend-2026-pm': {
    title: '工作坊 · AI产品经理（周末营）',
    sub: '深圳 · 广东',
    price: '¥498'
  },
  'ai-challenge-2025-hz': {
    title: '2025人工智能创业挑战营',
    sub: '杭州 · 浙江',
    price: '¥18800'
  },
  'ai-camp-2026': {
    title: '【旗舰】2026寒假 - 少年独角兽AI创业营',
    sub: '深圳 · 广东',
    price: '¥18800'
  },
  'ai-camp-2026-copy': {
    title: '【旗舰】2026暑假 - 少年独角兽AI创业营',
    sub: '深圳 / 杭州 / 北京',
    price: '¥18800'
  }
}

export const getActivitySummary = (activityId: string) => {
  return activityMap[activityId] || activityMap['ai-camp-2026']
}
