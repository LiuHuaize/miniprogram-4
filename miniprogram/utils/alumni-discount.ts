export const alumniDiscountFeeYuan = 12800
export const alumniDiscountLabel = '已获得老学员优惠'

const normalizeName = (value?: string) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value
    .normalize('NFKC')
    .replace(/[\s\u00a0\u200b]/g, '')
    .trim()
}

const oldStudentNames = [
  '邓嘉浩',
  '隋沐希',
  '周纯羽',
  '王乐怡',
  '黄冠霖',
  '孙靖钦',
  '许俊铧',
  '项舒昱',
  '张乘铭',
  '王乐羲',
  '梁洪浩',
  '余奕霆',
  '王琳涵',
  '刘芃铄',
  '高心依',
  '林豪洋',
  '宋奕晟',
  '谢玮宸',
  '刘原澈',
  '胡其凡',
  '张子乐',
  '杨宸逸',
  '徐如恩',
  '于旻宣',
  '刘奕暖',
  '李米',
  '张小禾陈一非',
  '张小禾',
  '陈一非',
  '陈一乐',
  '郭昱辰',
  '张家瑞',
  '韩屹曈',
  '贺子恒',
  '宋政霖',
  '施嘉轩',
  '姜金汐',
  '王秋择',
  '王珩宇',
  '谢文德',
  '马荣浩',
  '陈昱扬',
  '武承泽',
  '袁嘉铭',
  '江钇辰',
  '张東畅',
  '张东畅',
  '王晴晴',
  '匡蓁',
  '顾珺甯',
  '邹耀仪',
  '林芮涵',
  '陈铮妍',
  '林梓乐',
  '王意昕',
  '覃胜莹',
  '邓开元',
  '张郁雯',
  '陈志腾',
  '黎原宏',
  '王子涵',
  '吴欣仪',
  '吴灿滨',
  '苏饷'
]

const oldStudentNameSet = new Set(oldStudentNames.map((name) => normalizeName(name)).filter(Boolean))

const normalizeFee = (value: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return parsed
}

export const isAlumniName = (name?: string) => {
  const normalized = normalizeName(name)
  if (!normalized) {
    return false
  }
  return oldStudentNameSet.has(normalized)
}

export const resolveAlumniPrice = (names: string[] = [], regularFeeYuan = 0) => {
  const matchedAlumniNames: string[] = []
  let alumniCount = 0
  const normalizedRegularFeeYuan = normalizeFee(regularFeeYuan)

  names.forEach((name) => {
    if (!isAlumniName(name)) {
      return
    }
    alumniCount += 1
    matchedAlumniNames.push((typeof name === 'string' ? name.trim() : '') || normalizeName(name))
  })

  const camperCount = names.length
  const regularCount = Math.max(camperCount - alumniCount, 0)
  const totalFeeYuan = alumniCount * alumniDiscountFeeYuan + regularCount * normalizedRegularFeeYuan

  return {
    camperCount,
    alumniCount,
    regularCount,
    matchedAlumniNames,
    totalFeeYuan
  }
}
