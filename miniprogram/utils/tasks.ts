export type TaskQuestion = {
  label: string
  answer: string
}

export type LeaderboardEntry = {
  id: string
  name: string
  grade: string
  school: string
  scoreLabel: string
  statusLabel: string
  idea: string
  tag: string
  initials: string
  galleryId: string
}

export type GalleryEntry = {
  id: string
  name: string
  title: string
  summary: string
  audience: string
  problem: string
  solution: string
  siteName: string
  initials: string
  coverPath: string
}

export type TaskConfig = {
  id: string
  monthLabel: string
  status: string
  statusClass: 'active' | 'soon' | 'ended'
  title: string
  meta: string
  prompt: string
  brief: string
  deadline: string
  participantLabel: string
  submitLabel: string
  coverPath: string
  posterPath: string
  challengePoints: string[]
  questions: TaskQuestion[]
  leaderboard: LeaderboardEntry[]
  gallery: GalleryEntry[]
}

export const defaultTaskId = 'task-2026-03-math'

const taskList: TaskConfig[] = [
  {
    id: 'task-2026-03-math',
    monthLabel: '3 月任务',
    status: '进行中',
    statusClass: 'active',
    title: '用一个软件，让孩子重新爱上数学',
    meta: '图片 + 文字说明 · 适合 8-16 岁 · 3 月 31 日截止',
    prompt: '围绕“孩子为什么不喜欢数学”，设计一个小网站 / 小工具 / 小程序原型。',
    brief: '把一个真实教育问题，转化成有温度、有逻辑、能被看见的产品方案。',
    deadline: '2026.03.31',
    participantLabel: '42 位学员参与',
    submitLabel: '提交任务',
    coverPath: '/assets/poster/youth-cover-list.png',
    posterPath: '/assets/poster/youth-content-1.png',
    challengePoints: [
      '找到一个具体的小朋友画像，而不是“所有学生”',
      '说明他为什么不喜欢数学，是怕难、没成就感，还是觉得枯燥',
      '用页面结构、互动玩法或奖励机制，证明你的解决方案可落地'
    ],
    questions: [
      {
        label: '你针对的是什么样的人群？',
        answer: '例如：三四年级、做题容易焦虑、看到数学就想逃避的学生。'
      },
      {
        label: '你想解决的核心问题是什么？',
        answer: '例如：不知道为什么学、做题没有反馈、看不见进步。'
      },
      {
        label: '你的作品会用什么方式帮助他们？',
        answer: '例如：闯关任务、闯关地图、即时反馈、成长勋章、AI 讲解。'
      }
    ],
    leaderboard: [
      {
        id: 'rank-1',
        name: '林可晴',
        grade: '六年级',
        school: '深圳南山',
        scoreLabel: '92 分',
        statusLabel: '本周热度第一',
        idea: '把数学题拆成剧情闯关，每一题都和角色升级绑定。',
        tag: '闯关学习',
        initials: '晴',
        galleryId: 'gallery-1'
      },
      {
        id: 'rank-2',
        name: '周奕辰',
        grade: '初一',
        school: '杭州滨江',
        scoreLabel: '89 分',
        statusLabel: '老师推荐',
        idea: '把“不会做题”改成“我还差哪一步”，让孩子敢继续尝试。',
        tag: '学习反馈',
        initials: '辰',
        galleryId: 'gallery-2'
      },
      {
        id: 'rank-3',
        name: '陈语彤',
        grade: '五年级',
        school: '北京朝阳',
        scoreLabel: '待评审',
        statusLabel: '新提交',
        idea: '给每个知识点做成“找宝藏”地图，让练习题更像探索。',
        tag: '地图任务',
        initials: '彤',
        galleryId: 'gallery-3'
      }
    ],
    gallery: [
      {
        id: 'gallery-1',
        name: '林可晴',
        title: 'Math Hero 数学勇者站',
        summary: '把数学练习做成 RPG 闯关，让孩子一边闯关一边积累成就。',
        audience: '对数学有畏难情绪、做题坚持不下去的小学生',
        problem: '练习过程太单调，孩子看不到自己的进步，做错后容易放弃。',
        solution: '加入角色成长、通关奖励和 AI 提示，把做题过程变成可视化升级。',
        siteName: 'math-hero.web.app',
        initials: '晴',
        coverPath: '/assets/poster/youth-cover-detail.png'
      },
      {
        id: 'gallery-2',
        name: '周奕辰',
        title: '一步一步学会做题',
        summary: '把每道数学题拆解成“观察、列式、验证”三步，降低放弃率。',
        audience: '觉得题目太复杂、看到长题就发慌的初中生',
        problem: '不会把复杂题拆开，常常第一步没头绪就不想继续。',
        solution: '给每一题都配置过程提示和错误反馈，让孩子知道下一步该做什么。',
        siteName: 'solve-step.demo',
        initials: '辰',
        coverPath: '/assets/poster/future-unicorn-cover.png'
      },
      {
        id: 'gallery-3',
        name: '陈语彤',
        title: '数学藏宝图',
        summary: '通过地图探索和收集机制，让知识点练习更像做任务。',
        audience: '注意力容易分散、需要更强参与感的 9-12 岁学生',
        problem: '传统刷题无法持续吸引孩子，完成率和兴趣都不高。',
        solution: '把知识点包装成地图节点，每完成一个节点就点亮一块区域。',
        siteName: 'math-map.studio',
        initials: '彤',
        coverPath: '/assets/poster/weekend-cover.png'
      }
    ]
  },
  {
    id: 'task-2026-04-reading',
    monthLabel: '4 月任务',
    status: '即将开始',
    statusClass: 'soon',
    title: '做一个让孩子主动阅读的产品原型',
    meta: '海报挑战 · 图片 + 文字说明 · 4 月上线',
    prompt: '围绕“孩子不爱读书”的难题，设计一个有互动感的阅读产品。',
    brief: '从选书、陪伴、反馈三个角度，重新设计阅读体验。',
    deadline: '2026.04.30',
    participantLabel: '即将开放报名',
    submitLabel: '提交任务',
    coverPath: '/assets/poster/future-unicorn-cover.png',
    posterPath: '/assets/poster/future-unicorn-content.png',
    challengePoints: [
      '先理解孩子为什么不爱阅读',
      '思考如何通过产品机制增强陪伴感',
      '让阅读成果可以被记录、被分享、被看见'
    ],
    questions: [
      {
        label: '你的目标用户是谁？',
        answer: '例如：四五年级、爱看短视频、不愿读长文的学生。'
      },
      {
        label: '他最困扰的阅读问题是什么？',
        answer: '例如：选不到喜欢的书、坚持不下去、读完没有反馈。'
      },
      {
        label: '你的产品怎么改变这个问题？',
        answer: '例如：阅读伙伴、任务地图、每日一句、成长记录册。'
      }
    ],
    leaderboard: [
      {
        id: 'rank-4',
        name: '敬请期待',
        grade: '4 月开启',
        school: '任务预告',
        scoreLabel: '--',
        statusLabel: '等待作品上传',
        idea: '你可以先保留这个版位，后面接真实数据。',
        tag: '预告',
        initials: '4',
        galleryId: 'gallery-4'
      }
    ],
    gallery: [
      {
        id: 'gallery-4',
        name: '示例学员',
        title: '阅读任务位示意',
        summary: '这里后续可以接每个学员提交的作品海报、网站链接和答案。',
        audience: '演示 UI 使用',
        problem: '当前先展示页面结构，不接真实作品数据。',
        solution: '后面接云开发后，直接把表单内容渲染到这里。',
        siteName: 'coming-soon.demo',
        initials: '示',
        coverPath: '/assets/poster/future-unicorn-content.png'
      }
    ]
  },
  {
    id: 'task-2026-02-focus',
    monthLabel: '2 月任务',
    status: '已结束',
    statusClass: 'ended',
    title: '如何让孩子放下手机，重新专注学习？',
    meta: '往期任务 · 项目展示 · 已归档',
    prompt: '设计一个帮助孩子建立专注习惯的小工具或小网站。',
    brief: '这是一个往期任务示意，保留卡片结构，方便后续扩展。',
    deadline: '2026.02.28',
    participantLabel: '已归档展示',
    submitLabel: '提交任务',
    coverPath: '/assets/poster/weekend-cover.png',
    posterPath: '/assets/poster/weekend-content.jpg',
    challengePoints: [
      '聚焦一个专注力场景',
      '用简单方法让孩子愿意开始',
      '能让家长和老师看见变化'
    ],
    questions: [
      {
        label: '你想帮谁建立专注习惯？',
        answer: '例如：写作业总是分心、经常刷视频停不下来的孩子。'
      },
      {
        label: '他遇到的主要问题是什么？',
        answer: '例如：任务太长、没有反馈、不知道如何开始。'
      },
      {
        label: '你的方案会怎么帮助他？',
        answer: '例如：番茄钟、奖励币、家长共识卡、专注日历。'
      }
    ],
    leaderboard: [
      {
        id: 'rank-5',
        name: '任务归档',
        grade: '往期作品',
        school: '已结束',
        scoreLabel: '归档',
        statusLabel: '保留页结构',
        idea: '后面可以继续扩展往期排行榜和作品展厅。',
        tag: '归档',
        initials: '档',
        galleryId: 'gallery-5'
      }
    ],
    gallery: [
      {
        id: 'gallery-5',
        name: '往期学员',
        title: '专注训练营工具站',
        summary: '通过打卡、提醒和奖励机制，帮助孩子逐步提升专注力。',
        audience: '容易拖延、做事总被手机打断的孩子',
        problem: '注意力容易被即时刺激带走，任务难以持续完成。',
        solution: '把专注拆成一小段一小段，完成后立即得到反馈。',
        siteName: 'focus-lab.demo',
        initials: '期',
        coverPath: '/assets/poster/weekend2-cover.png'
      }
    ]
  }
]

export const getTaskSummaries = () => taskList.map((item) => ({ ...item }))

export const getTaskDetail = (taskId: string) => {
  return taskList.find((item) => item.id === taskId) || taskList[0]
}
