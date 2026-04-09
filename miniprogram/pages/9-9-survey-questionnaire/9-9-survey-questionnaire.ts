type QuestionItem = {
  id: string
  no: number
  title: string
  score: number
  reverse?: boolean
  dimensionKey: string
  dimensionLabel: string
}

type SubmitResult = {
  ok?: boolean
  message?: string
  questionnaireId?: string
}

type SubmitStatusResult = {
  ok?: boolean
  submitted?: boolean
  feishuSynced?: boolean
  questionnaireId?: string
  message?: string
}

const scoreOptions = [1, 2, 3, 4, 5]

const questionSource: QuestionItem[] = [
  {
    id: 'critical-thinking-1',
    no: 2,
    title: '面对从未见过的复杂拼搭或科学实验任务时，孩子会先观察整体结构，尝试推导解决步骤。',
    score: 0,
    dimensionKey: 'critical_thinking',
    dimensionLabel: '批判与逻辑'
  },
  {
    id: 'adaptability-1',
    no: 3,
    title: '当计划好的户外活动因天气等不可抗力取消时，孩子能较快接受现状，并寻找其他的娱乐方式。',
    score: 0,
    dimensionKey: 'adaptability_resilience',
    dimensionLabel: '适应与韧性'
  },
  {
    id: 'critical-thinking-2',
    no: 4,
    title: '孩子在网上看到一个新奇的观点或短视频后，会向您询问信息的真实来源，或表达自己的看法。',
    score: 0,
    dimensionKey: 'critical_thinking',
    dimensionLabel: '批判与逻辑'
  },
  {
    id: 'initiative-1',
    no: 5,
    title: '在学校或社团活动中，孩子会主动申请承担之前没做过的新角色或新任务。',
    score: 0,
    dimensionKey: 'initiative_execution',
    dimensionLabel: '主动与执行'
  },
  {
    id: 'collaboration-1',
    no: 6,
    title: '当同伴因为失败或受挫而难过时，孩子能察觉到对方的情绪，并尝试用语言或行动给予安慰。',
    score: 0,
    dimensionKey: 'empathy_collaboration',
    dimensionLabel: '共情与协作'
  },
  {
    id: 'initiative-2',
    no: 7,
    title: '孩子想到一个新点子（如改造旧玩具或优化房间布置）后，能很快找材料并动手尝试实现。',
    score: 0,
    dimensionKey: 'initiative_execution',
    dimensionLabel: '主动与执行'
  },
  {
    id: 'digital-1',
    no: 8,
    title: '接触到一个新的电子产品或 APP 软件时，孩子能通过摸索很快掌握其主要功能并解决问题。',
    score: 0,
    dimensionKey: 'digital_literacy_focus',
    dimensionLabel: '数字素养与专注'
  },
  {
    id: 'collaboration-2',
    no: 9,
    title: '在多人参与的游戏或小组作业中，孩子会有意识地协调不同人的任务，推动目标达成。',
    score: 0,
    dimensionKey: 'empathy_collaboration',
    dimensionLabel: '共情与协作'
  },
  {
    id: 'critical-thinking-3',
    no: 10,
    title: '孩子在向您转述一件复杂的事情（如学校发生的冲突）时，能逻辑清晰地说清楚来龙去脉。',
    score: 0,
    dimensionKey: 'critical_thinking',
    dimensionLabel: '批判与逻辑'
  },
  {
    id: 'initiative-3',
    no: 11,
    title: '面对重复、枯燥的家务或学习任务，孩子会尝试寻找一种更高效或更有趣的方法来完成。',
    score: 0,
    dimensionKey: 'initiative_execution',
    dimensionLabel: '主动与执行'
  },
  {
    id: 'adaptability-2',
    no: 12,
    title: '孩子在尝试新技能（如运动、编程）时，即使连续多次失败，仍表现出继续钻研的兴趣。',
    score: 0,
    dimensionKey: 'adaptability_resilience',
    dimensionLabel: '适应与韧性'
  },
  {
    id: 'digital-2',
    no: 13,
    title: '孩子会对家里的智能设备（如智能音箱、扫地机）如何理解指令或“认脸”表现出好奇并询问。',
    score: 0,
    dimensionKey: 'digital_literacy_focus',
    dimensionLabel: '数字素养与专注'
  },
  {
    id: 'initiative-4',
    no: 14,
    title: '遇到物品损坏（如玩具失灵、网线断了），孩子会尝试拆解或寻找故障原因，努力修复。',
    score: 0,
    dimensionKey: 'initiative_execution',
    dimensionLabel: '主动与执行'
  },
  {
    id: 'collaboration-3',
    no: 15,
    title: '在集体讨论中，孩子在表达自己观点的同时，会顾及其他成员的感受，并提供协助。',
    score: 0,
    dimensionKey: 'empathy_collaboration',
    dimensionLabel: '共情与协作'
  },
  {
    id: 'critical-thinking-4',
    no: 16,
    title: '当原有的解决办法行不通时，孩子能主动跳出惯性，尝试从一个完全不同的视角去思考。',
    score: 0,
    dimensionKey: 'critical_thinking',
    dimensionLabel: '批判与逻辑'
  },
  {
    id: 'collaboration-4',
    no: 17,
    title: '在公共场合或陌生群体中，孩子能够自信、清晰地向他人展示自己的想法或成果。',
    score: 0,
    dimensionKey: 'empathy_collaboration',
    dimensionLabel: '共情与协作'
  },
  {
    id: 'digital-3',
    no: 18,
    title: '在使用互联网或社交媒体时，孩子表现出对个人隐私保护的警觉，并能辨别不良内容。',
    score: 0,
    dimensionKey: 'digital_literacy_focus',
    dimensionLabel: '数字素养与专注'
  },
  {
    id: 'adaptability-3',
    no: 19,
    title: '换到一个全新的学习环境（如新学校、新营地）后，孩子能很快融入新集体并适应新节奏。',
    score: 0,
    dimensionKey: 'adaptability_resilience',
    dimensionLabel: '适应与韧性'
  },
  {
    id: 'digital-4',
    no: 20,
    title: '孩子在处理多项任务时，偶尔会因为被更有趣的新鲜事物吸引，而暂时偏离最初的目标。',
    score: 0,
    reverse: true,
    dimensionKey: 'digital_literacy_focus',
    dimensionLabel: '数字素养与专注'
  },
  {
    id: 'adaptability-4',
    no: 21,
    title: '在遇到极大的挫折（如努力很久的比赛输了）时，孩子有时会表现出强烈的沮丧感或短暂的畏难情绪。',
    score: 0,
    reverse: true,
    dimensionKey: 'adaptability_resilience',
    dimensionLabel: '适应与韧性'
  }
]

const decodeValue = (value?: string) => (value ? decodeURIComponent(value) : '')
const toNumber = (value?: string | number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const normalizeText = (value?: string) => (typeof value === 'string' ? value.trim() : '')
const getDraftStorageKey = (orderId: string, outTradeNo: string) => {
  return `report_questionnaire_draft_${orderId || outTradeNo || 'default'}`
}

Page({
  data: {
    childNameAge: '',
    questions: questionSource,
    scoreOptions,
    questionCount: questionSource.length,
    answeredCount: 0,
    submitting: false,
    reportOrderId: '',
    outTradeNo: ''
  },
  ensureLogin() {
    return new Promise((resolve) => {
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        resolve(false)
        return
      }

      const userId = wx.getStorageSync('user_id')
      if (userId) {
        resolve(true)
        return
      }

      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: (res) => {
          const result = (res.result || {}) as { userId?: string }
          if (result.userId) {
            wx.setStorageSync('user_id', result.userId)
          }
          resolve(true)
        },
        fail: () => {
          wx.showToast({ title: '登录失败', icon: 'none' })
          resolve(false)
        }
      })
    })
  },
  onLoad(options: Record<string, string>) {
    const storage = wx.getStorageSync('last_payment_success_context') || {}
    const reportOrderId = decodeValue(options.reportOrderId) || storage.reportOrderId || ''
    const outTradeNo = decodeValue(options.outTradeNo) || storage.outTradeNo || ''
    const draftKey = getDraftStorageKey(reportOrderId, outTradeNo)
    const draft = wx.getStorageSync(draftKey) || {}
    const answerMap = draft.answerMap || {}
    const questions = questionSource.map((item) => ({
      ...item,
      score: toNumber(answerMap[item.no])
    }))

    this.setData({
      reportOrderId,
      outTradeNo,
      childNameAge: draft.childNameAge || '',
      questions,
      answeredCount: questions.filter((item) => item.score > 0).length
    })
  },
  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      })
      return
    }

    wx.reLaunch({
      url: '/pages/index/index'
    })
  },
  saveDraft(nextChildNameAge?: string, nextQuestions?: QuestionItem[]) {
    const childNameAge = typeof nextChildNameAge === 'string' ? nextChildNameAge : this.data.childNameAge
    const questions = Array.isArray(nextQuestions) ? nextQuestions : this.data.questions
    const answerMap = questions.reduce((result, item) => {
      result[item.no] = item.score || 0
      return result
    }, {} as Record<number, number>)

    wx.setStorageSync(getDraftStorageKey(this.data.reportOrderId, this.data.outTradeNo), {
      childNameAge,
      answerMap
    })
  },
  onChildInfoInput(e: WechatMiniprogram.CustomEvent) {
    const childNameAge = e.detail.value || ''
    this.setData({ childNameAge })
    this.saveDraft(childNameAge)
  },
  onSelectScore(e: WechatMiniprogram.CustomEvent) {
    const no = toNumber(e.currentTarget.dataset.no)
    const score = toNumber(e.currentTarget.dataset.score)
    if (!no || !score) {
      return
    }

    const questions = this.data.questions.map((item) => {
      if (item.no !== no) {
        return item
      }
      return {
        ...item,
        score
      }
    })

    this.setData({
      questions,
      answeredCount: questions.filter((item) => item.score > 0).length
    })
    this.saveDraft(undefined, questions)
  },
  onSubmit() {
    if (!wx.cloud) {
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    if (this.data.submitting) {
      return
    }

    const childNameAge = normalizeText(this.data.childNameAge)
    if (!childNameAge) {
      wx.showToast({ title: '请先填写孩子信息', icon: 'none' })
      return
    }

    const unanswered = this.data.questions.find((item) => !item.score)
    if (unanswered) {
      wx.showToast({ title: `请先完成第 ${unanswered.no} 题`, icon: 'none' })
      return
    }

    if (!this.data.reportOrderId && !this.data.outTradeNo) {
      wx.showToast({ title: '未找到支付订单', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    this.ensureLogin().then((ok) => {
      if (!ok) {
        this.setData({ submitting: false })
        return
      }

      wx.showLoading({ title: '提交中' })
      wx.cloud.callFunction({
        name: 'survey99QuestionnaireSubmit',
        data: {
          reportOrderId: this.data.reportOrderId,
          outTradeNo: this.data.outTradeNo,
          childNameAge,
          answers: this.data.questions.map((item) => ({
            id: item.id,
            no: item.no,
            title: item.title,
            score: item.score,
            reverse: !!item.reverse,
            dimensionKey: item.dimensionKey,
            dimensionLabel: item.dimensionLabel
          }))
        },
        success: (res) => {
          const result = (res.result || {}) as SubmitResult
          wx.hideLoading()

          if (!result.ok) {
            wx.showToast({ title: result.message || '提交失败', icon: 'none' })
            this.setData({ submitting: false })
            return
          }

          wx.removeStorageSync(getDraftStorageKey(this.data.reportOrderId, this.data.outTradeNo))
          wx.redirectTo({
            url: '/pages/9-9-survey-submit-success/9-9-survey-submit-success'
          })
        },
        fail: () => {
          wx.hideLoading()
          wx.showLoading({ title: '确认结果' })
          setTimeout(() => {
            this.checkSubmitStatus()
          }, 800)
        }
      })
    })
  },
  checkSubmitStatus() {
    wx.cloud.callFunction({
      name: 'survey99QuestionnaireSubmit',
      data: {
        action: 'status',
        reportOrderId: this.data.reportOrderId,
        outTradeNo: this.data.outTradeNo
      },
      success: (res) => {
        const result = (res.result || {}) as SubmitStatusResult
        wx.hideLoading()

        if (result.ok && result.submitted) {
          wx.removeStorageSync(getDraftStorageKey(this.data.reportOrderId, this.data.outTradeNo))
          wx.redirectTo({
            url: '/pages/9-9-survey-submit-success/9-9-survey-submit-success'
          })
          return
        }

        this.setData({ submitting: false })
        wx.showToast({ title: '提交失败，请重试', icon: 'none' })
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ submitting: false })
        wx.showToast({ title: '提交失败，请重试', icon: 'none' })
      }
    })
  }
})
