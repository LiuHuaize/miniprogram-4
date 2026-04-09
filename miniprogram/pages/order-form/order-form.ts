import { getActivitySummary } from '../../utils/activities'
import { getPosterFallbackUrls, loadPosterUrls } from '../../utils/cloud-assets'
import { alumniDiscountFeeYuan, alumniDiscountLabel, resolveAlumniPrice } from '../../utils/alumni-discount'

type ActivityPeriod = {
  id: string
  name: string
  date: string
  deadline: string
  quota: string
}

type PeriodSnapshot = {
  id: string
  name: string
  date: string
  deadline: string
  quota: string
}

type CamperItem = {
  id: string
  name: string
  idNoMask: string
  height: string
  weight: string
  allergies: string
  personality: string
}

type ScholarshipPriceInput = {
  applied: boolean
  discountAmount?: number
  label?: string
}

type PaymentSnapshot = {
  outTradeNo: string
  totalFee: number
  activityId: string
  periodId: string
  activityTitle: string
  submissionId: string
  scholarshipCode: string
  scholarshipDiscount: number
  scholarshipLabel: string
}

const defaultActivityId = 'ai-camp-2026'
const interviewFeeDiscountYuan = 500
const scholarshipLabel = '新学员奖学金兑换码'
const scholarshipEligibleActivityIdSet = new Set(['ai-camp-2026-copy'])

const defaultScholarshipState = {
  scholarshipCodeInput: '',
  scholarshipAppliedCode: '',
  scholarshipApplied: false,
  scholarshipDiscountAmount: 0,
  scholarshipLabel,
  scholarshipStatusText: '',
  scholarshipStatusType: '',
  scholarshipStatus: ''
}

const activityPeriodsMap: Record<string, ActivityPeriod[]> = {
  'ai-weekend-2026': [
    {
      id: 'sz-weekend-p1',
      name: '周末营 · AI解决学习痛点（深圳）',
      date: '01/17 13:30 - 17:30',
      deadline: '2026.01.16',
      quota: '名额情况：已结束'
    }
  ],
  'ai-weekend-2026-pm': [
    {
      id: 'sz-weekend-p2',
      name: '周末营 · AI产品经理（深圳）',
      date: '01/02 13:30 - 17:30',
      deadline: '2026.01.01',
      quota: '名额情况：已结束'
    }
  ],
  'ai-challenge-2025-hz': [
    {
      id: 'hz-p1',
      name: '第一期（杭州）',
      date: '07/21 - 07/26',
      deadline: '2025.07.20',
      quota: '名额情况：已结束'
    }
  ],
  'ai-camp-2026': [
    {
      id: 'sz-p1',
      name: '第一期（深圳）',
      date: '02/08 - 02/13',
      deadline: '2026.02.07',
      quota: '名额情况：已结束'
    }
  ],
  'ai-camp-2026-copy': [
    {
      id: 'sz-p1',
      name: '第一期（深圳）',
      date: '07/13 - 07/18',
      deadline: '2026.07.12',
      quota: '名额情况：招生中'
    },
    {
      id: 'hz-p2',
      name: '第二期（杭州）',
      date: '07/27 - 08/01',
      deadline: '2026.07.26',
      quota: '名额情况：招生中'
    },
    {
      id: 'bj-p3',
      name: '第三期（北京）',
      date: '08/10 - 08/15',
      deadline: '2026.08.09',
      quota: '名额情况：招生中'
    }
  ]
}

const getActivityPeriods = (activityId: string) => {
  const periods = activityPeriodsMap[activityId] || activityPeriodsMap[defaultActivityId]
  return periods.map((item) => ({ ...item }))
}

const decodeValue = (value?: string) => {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const buildPeriodSnapshot = (period?: ActivityPeriod): PeriodSnapshot => ({
  id: period?.id || '',
  name: period?.name || '',
  date: period?.date || '',
  deadline: period?.deadline || '',
  quota: period?.quota || ''
})

const createEmptyCamper = (): CamperItem => ({
  id: '',
  name: '',
  idNoMask: '',
  height: '',
  weight: '',
  allergies: '',
  personality: ''
})

const activityCoverMap: Record<string, string> = {
  'ai-weekend-2026': '/assets/poster/weekend-cover.png',
  'ai-weekend-2026-pm': '/assets/poster/weekend2-cover.png',
  'ai-challenge-2025-hz': '/assets/poster/future-unicorn-cover.png',
  'ai-camp-2026': '/assets/poster/01-cover.png',
  'ai-camp-2026-copy': '/assets/poster/youth-cover-detail.png'
}

const getActivityCoverPath = (activityId: string) => {
  return activityCoverMap[activityId] || activityCoverMap[defaultActivityId]
}

const activityFeeMapYuan: Record<string, number> = {
  'ai-weekend-2026': 498,
  'ai-weekend-2026-pm': 498,
  'ai-challenge-2025-hz': 18800,
  'ai-camp-2026': 18800,
  'ai-camp-2026-copy': 18800
}

const getActivityFeeYuan = (activityId: string) => {
  return activityFeeMapYuan[activityId] || activityFeeMapYuan[defaultActivityId]
}

const formatFeeText = (feeYuan: number) => `¥${feeYuan}`
const splitPriceLabel = (priceLabel: string) => {
  const match = priceLabel.match(/^([^\d]*)([\d.,]+)(.*)$/)
  if (!match) {
    return {
      displayPriceUnit: '',
      displayPriceValue: priceLabel
    }
  }
  return {
    displayPriceUnit: match[1] || '',
    displayPriceValue: match[2] || priceLabel
  }
}
const normalizeScholarshipCode = (value?: string) => (value ? value.toUpperCase().replace(/[^A-Z]/g, '') : '')
const isScholarshipActivity = (activityId: string) => scholarshipEligibleActivityIdSet.has(activityId)
const hasNamedCamper = (camper?: { name?: string }) => !!((camper?.name || '').trim())

const buildSavedScholarshipState = (code: string, status: string, discountAmount = 0, label = scholarshipLabel) => {
  if (!code) {
    return { ...defaultScholarshipState }
  }
  return {
    scholarshipCodeInput: code,
    scholarshipAppliedCode: code,
    scholarshipApplied: true,
    scholarshipDiscountAmount: Math.max(Number(discountAmount) || 0, 0),
    scholarshipLabel: label || scholarshipLabel,
    scholarshipStatus: status || 'pending',
    scholarshipStatusType: 'success',
    scholarshipStatusText:
      status === 'redeemed'
        ? `奖学金兑换码 ${code} 已核销`
        : `奖学金兑换码 ${code} 已保存`
  }
}

const buildPriceState = (
  activityId: string,
  campers: Array<{ name?: string }>,
  scholarshipInput: ScholarshipPriceInput = { applied: false }
) => {
  const regularFeeYuan = getActivityFeeYuan(activityId)
  const discountPerCamperYuan = Math.max(regularFeeYuan - alumniDiscountFeeYuan, 0)
  const selectedCampers = campers.filter((item) => hasNamedCamper(item))
  const pricingCampers = selectedCampers.length > 0 ? selectedCampers : campers
  const result = resolveAlumniPrice(
    pricingCampers.map((item) => item.name || ''),
    regularFeeYuan
  )
  const isAlumniDiscount = result.alumniCount > 0
  const scholarshipSupported = isScholarshipActivity(activityId)
  const scholarshipDiscountYuan = Math.max(Number(scholarshipInput.discountAmount) || 0, 0) / 100
  const interviewDiscountYuan = scholarshipDiscountYuan > 0
    ? Math.min(scholarshipDiscountYuan, interviewFeeDiscountYuan)
    : 0
  const scholarshipOnlyDiscountYuan = Math.max(scholarshipDiscountYuan - interviewDiscountYuan, 0)
  const selectedCampersResult = resolveAlumniPrice(
    selectedCampers.map((item) => item.name || ''),
    regularFeeYuan
  )
  const showScholarshipSection = scholarshipSupported && selectedCampersResult.regularCount > 0
  const hasScholarshipDiscount = showScholarshipSection && scholarshipInput.applied
  const totalFeeYuan = Math.max(result.totalFeeYuan - (hasScholarshipDiscount ? scholarshipDiscountYuan : 0), 0)
  const priceDetailParts = [
    result.alumniCount > 0 ? `老学员${result.alumniCount}人 × ¥${alumniDiscountFeeYuan}` : '',
    result.regularCount > 0 ? `新学员${result.regularCount}人 × ¥${regularFeeYuan}` : '',
    hasScholarshipDiscount && scholarshipOnlyDiscountYuan > 0 ? `奖学金兑换码 -¥${scholarshipOnlyDiscountYuan}` : '',
    hasScholarshipDiscount && interviewDiscountYuan > 0 ? `面试费抵扣 -¥${interviewDiscountYuan}` : ''
  ].filter(Boolean)
  const displayPrice = formatFeeText(totalFeeYuan)

  return {
    displayPrice,
    ...splitPriceLabel(displayPrice),
    priceDetailText: priceDetailParts.join('，'),
    totalFeeYuan,
    regularCount: result.regularCount,
    alumniCount: result.alumniCount,
    scholarshipSupported,
    showScholarshipSection,
    isAlumniDiscount,
    hasScholarshipDiscount,
    alumniDiscountTagText: isAlumniDiscount && discountPerCamperYuan > 0 ? `老学员优惠 -¥${discountPerCamperYuan}` : '',
    scholarshipDiscountTagText: '',
    alumniDiscountText: '',
    scholarshipDiscountText: '',
    matchedAlumniNames: result.matchedAlumniNames
  }
}

Component({
  data: {
    activityId: defaultActivityId,
    summary: getActivitySummary(defaultActivityId),
    summaryCoverPath: getActivityCoverPath(defaultActivityId),
    ...defaultScholarshipState,
    ...buildPriceState(defaultActivityId, [{ name: '' }]),
    posterUrls: getPosterFallbackUrls(),
    periods: getActivityPeriods(defaultActivityId),
    selectedPeriodIndex: 0,
    periodPopupVisible: false,
    guardian: {
      name: '',
      idNo: '',
      idNoMask: '',
      phone: '',
      wechat: ''
    },
    campers: [createEmptyCamper()],
    maxCampers: 6,
    submissionId: '',
    submissionStatus: '',
    loading: false,
    paying: false,
    loadedActivityId: '',
    loadedSubmissionId: '',
    loadedPeriodId: ''
  },
  pageLifetimes: {
    show() {
      this.loadPosterUrls()
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance<any, any> & {
        options?: Record<string, string>
      }
      const options = current?.options || {}
      const periodId = decodeValue(options.periodId)
      const periodName = decodeValue(options.periodName)
      const periodDate = decodeValue(options.periodDate)
      const activityId = decodeValue(options.activityId)
      const submissionId = decodeValue(options.submissionId)
      const nextActivityId = activityId || this.data.activityId
      const sameActivity = nextActivityId === this.data.activityId
      const periods = getActivityPeriods(nextActivityId)
      let selectedPeriodIndex = 0
      if (sameActivity && !periodId && !periodName) {
        selectedPeriodIndex = Math.max(0, Math.min(this.data.selectedPeriodIndex, periods.length - 1))
      }
      if (periodId) {
        const index = periods.findIndex((item) => item.id === periodId)
        if (index !== -1) {
          selectedPeriodIndex = index
        }
      } else if (periodName) {
        const index = periods.findIndex((item) => item.name === periodName)
        if (index !== -1) {
          selectedPeriodIndex = index
        }
      }
      const nextPeriods =
        periodDate && periods[selectedPeriodIndex] && periods[selectedPeriodIndex].date !== periodDate
          ? periods.map((item, index) => {
            if (index === selectedPeriodIndex) {
              return {
                ...item,
                date: periodDate
              }
            }
            return item
          })
          : periods
      const currentPeriodId = this.data.periods[this.data.selectedPeriodIndex]?.id || ''
      const nextPeriodId = nextPeriods[selectedPeriodIndex]?.id || ''
      const samePeriod = sameActivity && nextPeriodId === currentPeriodId
      const nextSubmissionId = submissionId || (samePeriod ? this.data.submissionId : '')
      const preserveScholarshipDraft = sameActivity && samePeriod
      const scholarshipState = preserveScholarshipDraft
        ? {
            scholarshipCodeInput: this.data.scholarshipCodeInput,
            scholarshipAppliedCode: this.data.scholarshipAppliedCode,
            scholarshipApplied: this.data.scholarshipApplied,
            scholarshipDiscountAmount: this.data.scholarshipDiscountAmount,
            scholarshipLabel: this.data.scholarshipLabel,
            scholarshipStatusText: this.data.scholarshipStatusText,
            scholarshipStatusType: this.data.scholarshipStatusType,
            scholarshipStatus: this.data.scholarshipStatus
          }
        : { ...defaultScholarshipState }

      this.setData(
        {
          submissionId: nextSubmissionId,
          submissionStatus: nextSubmissionId ? this.data.submissionStatus : '',
          activityId: nextActivityId,
          summary: getActivitySummary(nextActivityId),
          summaryCoverPath: getActivityCoverPath(nextActivityId),
          periods: nextPeriods,
          selectedPeriodIndex,
          ...scholarshipState,
          ...buildPriceState(nextActivityId, this.data.campers, {
            applied: scholarshipState.scholarshipApplied,
            discountAmount: scholarshipState.scholarshipDiscountAmount,
            label: scholarshipState.scholarshipLabel
          })
        },
        () => {
          if (
            nextActivityId &&
            (this.data.loadedActivityId !== nextActivityId ||
              this.data.loadedSubmissionId !== nextSubmissionId ||
              this.data.loadedPeriodId !== nextPeriodId)
          ) {
            this.setData({
              loadedActivityId: nextActivityId,
              loadedSubmissionId: nextSubmissionId,
              loadedPeriodId: nextPeriodId
            })
            if (nextSubmissionId) {
              this.ensureLogin().then(() => {
                this.loadSubmission(nextSubmissionId, nextPeriodId)
              })
            }
          }
        }
      )
    }
  },
  methods: {
    getSelectedPeriod() {
      return this.data.periods[this.data.selectedPeriodIndex]
    },
    getSelectedPeriodId() {
      return this.getSelectedPeriod()?.id || ''
    },
    getSubmissionScholarshipCode() {
      if (!this.data.showScholarshipSection || !this.data.scholarshipApplied) {
        return ''
      }
      return this.data.scholarshipAppliedCode || normalizeScholarshipCode(this.data.scholarshipCodeInput)
    },
    getPriceState(activityId?: string, campers?: CamperItem[], scholarshipApplied?: boolean) {
      return buildPriceState(
        activityId || this.data.activityId,
        campers || this.data.campers,
        {
          applied: scholarshipApplied !== undefined ? scholarshipApplied : this.data.scholarshipApplied,
          discountAmount: this.data.scholarshipDiscountAmount,
          label: this.data.scholarshipLabel
        }
      )
    },
    onImageError() {},
    loadPosterUrls() {
      loadPosterUrls().then((posterUrls) => {
        this.setData({ posterUrls })
      })
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
    loadSubmission(submissionId?: string, periodId?: string) {
      if (!wx.cloud) {
        return
      }
      const targetPeriodId = periodId || this.getSelectedPeriodId()
      this.setData({ loading: true })
      wx.cloud.callFunction({
        name: 'submissionGetByActivity',
        data: {
          activityId: this.data.activityId,
          periodId: targetPeriodId,
          submissionId: submissionId || this.data.submissionId
        },
        success: (res) => {
          const result = (res.result || {}) as {
            ok?: boolean
            data?: {
              id: string
              activityId?: string
              periodId?: string
              status: string
              scholarshipCode?: string
              scholarshipDiscountAmount?: number
              scholarshipStatus?: string
              scholarshipLabel?: string
              guardianSnapshot: {
                name: string
                phone: string
                wechat: string
                idNo: string
                idNoMask: string
              }
              childrenSnapshot: CamperItem[]
            } | null
          }
          if (!result.ok) {
            return
          }
          if (!result.data) {
            this.setData({ submissionId: '', submissionStatus: '', loadedSubmissionId: '' })
            return
          }
          const periodIdFromData = result.data.periodId || targetPeriodId
          const periodIndex = periodIdFromData
            ? this.data.periods.findIndex((item) => item.id === periodIdFromData)
            : -1
          const selectedPeriodIndex = periodIndex !== -1 ? periodIndex : this.data.selectedPeriodIndex
          const guardian = result.data.guardianSnapshot
          const campers = result.data.childrenSnapshot.length ? result.data.childrenSnapshot : [createEmptyCamper()]
          const scholarshipCode = normalizeScholarshipCode(result.data.scholarshipCode || '')
          const scholarshipState = buildSavedScholarshipState(
            scholarshipCode,
            result.data.scholarshipStatus || '',
            Number(result.data.scholarshipDiscountAmount) || 0,
            result.data.scholarshipLabel || scholarshipLabel
          )
          this.setData({
            submissionId: result.data.id || '',
            submissionStatus: result.data.status,
            selectedPeriodIndex,
            loadedSubmissionId: result.data.id || this.data.loadedSubmissionId,
            loadedPeriodId: periodIdFromData || this.data.loadedPeriodId,
            guardian: {
              name: guardian.name || '',
              phone: guardian.phone || '',
              wechat: guardian.wechat || '',
              idNo: guardian.idNo || '',
              idNoMask: guardian.idNoMask || ''
            },
            campers,
            ...scholarshipState,
            ...buildPriceState(this.data.activityId, campers, {
              applied: scholarshipState.scholarshipApplied,
              discountAmount: scholarshipState.scholarshipDiscountAmount,
              label: scholarshipState.scholarshipLabel
            })
          })
        },
        fail: () => {
          wx.showToast({ title: '加载失败', icon: 'none' })
        },
        complete: () => {
          this.setData({ loading: false })
        }
      })
    },
    releaseScholarshipHold(snapshot?: Partial<PaymentSnapshot>) {
      const scholarshipCode = normalizeScholarshipCode(snapshot?.scholarshipCode)
      const outTradeNo = snapshot?.outTradeNo || ''
      const submissionId = snapshot?.submissionId || this.data.submissionId
      const activityId = snapshot?.activityId || this.data.activityId
      if (!wx.cloud || !scholarshipCode || !outTradeNo || !submissionId) {
        return Promise.resolve(false)
      }
      return new Promise((resolve) => {
        wx.cloud.callFunction({
          name: 'scholarshipCodeManage',
          data: {
            action: 'release',
            code: scholarshipCode,
            activityId,
            submissionId,
            outTradeNo
          },
          success: () => {
            resolve(true)
          },
          fail: () => {
            resolve(false)
          }
        })
      })
    },
    onBack() {
      wx.navigateBack({
        delta: 1
      })
    },
    onChoosePeriod() {
      this.setData({
        periodPopupVisible: true
      })
    },
    onClosePeriods() {
      this.setData({
        periodPopupVisible: false
      })
    },
    onSelectPeriod(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset as { index?: number }
      if (index === undefined) {
        return
      }
      this.setData({
        selectedPeriodIndex: index
      })
    },
    onConfirmPeriod() {
      const periodId = this.getSelectedPeriodId()
      const shouldReload =
        periodId !== this.data.loadedPeriodId || this.data.loadedActivityId !== this.data.activityId
      this.setData({
        periodPopupVisible: false
      })
      if (!shouldReload) {
        return
      }
      this.setData({
        submissionId: '',
        submissionStatus: '',
        loadedActivityId: this.data.activityId,
        loadedSubmissionId: '',
        loadedPeriodId: periodId,
        ...defaultScholarshipState,
        ...this.getPriceState(this.data.activityId, this.data.campers, false)
      })
    },
    onChangeCount(event: WechatMiniprogram.BaseEvent) {
      const { type } = event.currentTarget.dataset as { type?: 'plus' | 'minus' }
      if (!type) {
        return
      }
      const current = this.data.campers.length
      let next = current + (type === 'plus' ? 1 : -1)
      next = Math.max(1, Math.min(this.data.maxCampers, next))
      if (next === current) {
        return
      }
      const campers = this.data.campers.slice(0, next)
      while (campers.length < next) {
        campers.push(createEmptyCamper())
      }
      this.setData({
        campers,
        ...this.getPriceState(this.data.activityId, campers)
      })
    },
    onGuardianNameChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        guardian: {
          ...this.data.guardian,
          name: e.detail.value
        }
      })
    },
    onGuardianIdChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        guardian: {
          ...this.data.guardian,
          idNo: e.detail.value,
          idNoMask: this.data.guardian.idNoMask
        }
      })
    },
    onGuardianPhoneChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        guardian: {
          ...this.data.guardian,
          phone: e.detail.value
        }
      })
    },
    onGuardianWechatChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        guardian: {
          ...this.data.guardian,
          wechat: e.detail.value
        }
      })
    },
    onScholarshipCodeChange(e: WechatMiniprogram.CustomEvent) {
      const nextCode = normalizeScholarshipCode(e.detail.value)
      const keepApplied = nextCode && nextCode === this.data.scholarshipAppliedCode && this.data.scholarshipApplied
      this.setData({
        scholarshipCodeInput: nextCode,
        scholarshipAppliedCode: keepApplied ? this.data.scholarshipAppliedCode : '',
        scholarshipApplied: !!keepApplied,
        scholarshipDiscountAmount: keepApplied ? this.data.scholarshipDiscountAmount : 0,
        scholarshipLabel: keepApplied ? this.data.scholarshipLabel : scholarshipLabel,
        scholarshipStatus: keepApplied ? this.data.scholarshipStatus : nextCode ? 'pending' : '',
        scholarshipStatusText: keepApplied ? this.data.scholarshipStatusText : '',
        scholarshipStatusType: keepApplied ? this.data.scholarshipStatusType : '',
        ...this.getPriceState(this.data.activityId, this.data.campers, !!keepApplied)
      })
    },
    onVerifyScholarshipCode() {
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }
      if (!this.data.showScholarshipSection) {
        wx.showToast({ title: '当前订单暂无可用的新学员名额', icon: 'none' })
        return
      }
      const code = normalizeScholarshipCode(this.data.scholarshipCodeInput)
      if (!code) {
        wx.showToast({ title: '请输入兑换码', icon: 'none' })
        return
      }
      wx.showLoading({ title: '验证中' })
      wx.cloud.callFunction({
        name: 'scholarshipCodeManage',
        data: {
          action: 'preview',
          code,
          activityId: this.data.activityId,
          submissionId: this.data.submissionId
        },
        success: (res) => {
          const result = (res.result || {}) as {
            ok?: boolean
            available?: boolean
            message?: string
            normalizedCode?: string
            discountAmount?: number
            label?: string
          }
          if (!result.ok || !result.available) {
            this.setData({
              scholarshipCodeInput: code,
              scholarshipAppliedCode: '',
              scholarshipApplied: false,
              scholarshipDiscountAmount: 0,
              scholarshipLabel,
              scholarshipStatus: '',
              scholarshipStatusText: result.message || '兑换码不可用',
              scholarshipStatusType: 'warning',
              ...this.getPriceState(this.data.activityId, this.data.campers, false)
            })
            return
          }
          const normalizedCode = result.normalizedCode || code
          const scholarshipDiscountAmount = Number(result.discountAmount) || 0
          this.setData({
            scholarshipCodeInput: normalizedCode,
            scholarshipAppliedCode: normalizedCode,
            scholarshipApplied: true,
            scholarshipDiscountAmount,
            scholarshipLabel: result.label || scholarshipLabel,
            scholarshipStatus: 'pending',
            scholarshipStatusText: '兑换码可用',
            scholarshipStatusType: 'success',
            ...buildPriceState(this.data.activityId, this.data.campers, {
              applied: true,
              discountAmount: scholarshipDiscountAmount,
              label: result.label || scholarshipLabel
            })
          })
        },
        fail: () => {
          wx.showToast({ title: '兑换码验证失败', icon: 'none' })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    },
    onOpenCamper(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset as { index?: number }
      if (index === undefined) {
        return
      }
      const targetIndex = Number(index)
      if (!Number.isFinite(targetIndex) || !this.data.campers[targetIndex]) {
        return
      }
      const camper = this.data.campers[targetIndex]
      const blockedIds = Array.from(
        new Set(
          this.data.campers
            .map((item, camperIndex) => (camperIndex === targetIndex ? '' : item.id || ''))
            .filter(Boolean)
        )
      )
      const blockedIdsParam = encodeURIComponent(JSON.stringify(blockedIds))
      wx.navigateTo({
        url: `/pages/camper-list/camper-list?index=${targetIndex}&selectedId=${encodeURIComponent(camper?.id || '')}&blockedIds=${blockedIdsParam}`,
        events: {
          selected: (payload: { camper?: CamperItem }) => {
            if (!payload?.camper) {
              return
            }
            const campers = [...this.data.campers]
            if (campers[targetIndex]) {
              campers[targetIndex] = {
                ...payload.camper,
                idNoMask: payload.camper.idNoMask || ''
              }
              this.setData({
                campers,
                ...this.getPriceState(this.data.activityId, campers)
              })
            }
          }
        },
        success: (res) => {
          res.eventChannel.emit('init', {
            index: targetIndex,
            selectedId: camper?.id || '',
            blockedIds
          })
        }
      })
    },
    validateForm() {
      if (!this.data.guardian.name) {
        wx.showToast({ title: '请填写监护人姓名', icon: 'none' })
        return false
      }
      if (!this.data.guardian.phone) {
        wx.showToast({ title: '请填写监护人手机号', icon: 'none' })
        return false
      }
      if (!this.data.guardian.idNo && !this.data.guardian.idNoMask) {
        wx.showToast({ title: '请填写监护人身份证明', icon: 'none' })
        return false
      }
      const missing = this.data.campers.find((item) => !item.id)
      if (missing) {
        wx.showToast({ title: '请先选择营员', icon: 'none' })
        return false
      }
      if (this.data.showScholarshipSection) {
        const code = normalizeScholarshipCode(this.data.scholarshipCodeInput)
        if (code && !this.data.scholarshipApplied) {
          wx.showToast({ title: '请先验证奖学金兑换码', icon: 'none' })
          return false
        }
      }
      return true
    },
    startPayment() {
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }
      if (this.data.paying) {
        return
      }
      const periodId = this.getSelectedPeriodId()
      this.setData({ paying: true })
      wx.showLoading({ title: '发起支付' })
      wx.cloud.callFunction({
        name: 'paymentPrepare',
        data: {
          activityId: this.data.activityId,
          periodId,
          submissionId: this.data.submissionId
        },
        success: (res) => {
          const result = (res.result || {}) as {
            ok?: boolean
            message?: string
            outTradeNo?: string
            totalFee?: number
            activityId?: string
            periodId?: string
            submissionId?: string
            scholarshipCode?: string
            scholarshipDiscount?: number
            scholarshipLabel?: string
          }
          if (!result.ok || !result.outTradeNo || !result.totalFee) {
            wx.hideLoading()
            wx.showToast({ title: result.message || '支付发起失败', icon: 'none' })
            this.setData({ paying: false })
            return
          }
          if (result.submissionId && result.submissionId !== this.data.submissionId) {
            this.setData({
              submissionId: result.submissionId,
              loadedSubmissionId: result.submissionId
            })
          }
          const paymentSnapshot: PaymentSnapshot = {
            outTradeNo: result.outTradeNo,
            totalFee: result.totalFee,
            activityId: result.activityId || this.data.activityId,
            periodId: result.periodId || periodId,
            activityTitle: this.data.summary.title || '活动报名',
            submissionId: result.submissionId || this.data.submissionId || '',
            scholarshipCode: normalizeScholarshipCode(result.scholarshipCode || ''),
            scholarshipDiscount: Number(result.scholarshipDiscount) || 0,
            scholarshipLabel: result.scholarshipLabel || this.data.scholarshipLabel || scholarshipLabel
          }
          wx.cloud.callFunction({
            name: 'wxpayFunctions',
            data: {
              type: 'wxpay_order',
              outTradeNo: paymentSnapshot.outTradeNo,
              totalFee: paymentSnapshot.totalFee,
              description: this.data.summary.title || '活动报名'
            },
            success: (callRes) => {
              const rawResult = (callRes.result || {}) as { errcode?: string; errmsg?: string }
              const errMsg = typeof rawResult.errmsg === 'string' ? rawResult.errmsg : ''
              if (rawResult.errcode || errMsg) {
                wx.hideLoading()
                if (errMsg.includes('ORDERPAID')) {
                  wx.showToast({ title: '订单已支付，可再次购买', icon: 'none' })
                  this.setData({ submissionStatus: 'paid', submissionId: '' })
                } else {
                  this.releaseScholarshipHold(paymentSnapshot)
                  wx.showToast({ title: '支付发起失败', icon: 'none' })
                }
                this.setData({ paying: false })
                return
              }
              const paymentResult =
                (typeof callRes.result === 'object' && callRes.result ? callRes.result : {}) as {
                  data?: {
                    timeStamp?: string
                    nonceStr?: string
                    package?: string
                    packageVal?: string
                    paySign?: string
                    signType?: string
                  }
                }
              const paymentData = paymentResult.data
              const packageValue = paymentData ? paymentData.packageVal || paymentData.package || '' : ''
              if (!paymentData || !paymentData.timeStamp || !paymentData.nonceStr || !packageValue) {
                wx.hideLoading()
                this.releaseScholarshipHold(paymentSnapshot)
                wx.showToast({ title: '支付参数缺失', icon: 'none' })
                this.setData({ paying: false })
                return
              }
              wx.hideLoading()
              wx.requestPayment({
                timeStamp: paymentData.timeStamp,
                nonceStr: paymentData.nonceStr,
                package: packageValue,
                paySign: paymentData.paySign || '',
                signType: (paymentData.signType || 'RSA') as 'RSA' | 'MD5' | 'HMAC-SHA256',
                success: () => {
                  this.setData({ submissionStatus: 'paid' })
                  wx.setStorageSync('last_payment_success_context', {
                    ...paymentSnapshot,
                    paidAt: Date.now()
                  })
                  const query = [
                    paymentSnapshot.outTradeNo
                      ? `outTradeNo=${encodeURIComponent(paymentSnapshot.outTradeNo)}`
                      : '',
                    paymentSnapshot.totalFee ? `totalFee=${encodeURIComponent(String(paymentSnapshot.totalFee))}` : '',
                    paymentSnapshot.activityId ? `activityId=${encodeURIComponent(paymentSnapshot.activityId)}` : '',
                    paymentSnapshot.periodId ? `periodId=${encodeURIComponent(paymentSnapshot.periodId)}` : '',
                    paymentSnapshot.activityTitle
                      ? `activityTitle=${encodeURIComponent(paymentSnapshot.activityTitle)}`
                      : '',
                    paymentSnapshot.submissionId
                      ? `submissionId=${encodeURIComponent(paymentSnapshot.submissionId)}`
                      : '',
                    paymentSnapshot.scholarshipCode
                      ? `scholarshipCode=${encodeURIComponent(paymentSnapshot.scholarshipCode)}`
                      : '',
                    paymentSnapshot.scholarshipDiscount
                      ? `scholarshipDiscount=${encodeURIComponent(String(paymentSnapshot.scholarshipDiscount))}`
                      : ''
                  ]
                    .filter(Boolean)
                    .join('&')
                  wx.redirectTo({
                    url: query
                      ? `/pages/registration-payment-success/registration-payment-success?${query}`
                      : '/pages/registration-payment-success/registration-payment-success'
                  })
                },
                fail: (err) => {
                  this.releaseScholarshipHold(paymentSnapshot)
                  const errMsg = err && typeof err === 'object' && 'errMsg' in err ? String(err.errMsg) : ''
                  if (errMsg.includes('cancel')) {
                    wx.showToast({ title: '已取消支付', icon: 'none' })
                  } else {
                    wx.showToast({ title: '支付失败', icon: 'none' })
                  }
                },
                complete: () => {
                  this.setData({ paying: false })
                }
              })
            },
            fail: () => {
              wx.hideLoading()
              this.releaseScholarshipHold(paymentSnapshot)
              wx.showToast({ title: '支付发起失败', icon: 'none' })
              this.setData({ paying: false })
            }
          })
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({ title: '支付发起失败', icon: 'none' })
          this.setData({ paying: false })
        }
      })
    },
    onSubmit() {
      if (!wx.cloud) {
        wx.showToast({ title: '云开发未初始化', icon: 'none' })
        return
      }
      if (this.data.paying) {
        return
      }
      if (!this.validateForm()) {
        return
      }
      const selectedPeriod = this.getSelectedPeriod()
      if (!selectedPeriod || !selectedPeriod.id) {
        wx.showToast({ title: '请选择期数', icon: 'none' })
        return
      }
      const childIds = this.data.campers.map((item) => item.id).filter(Boolean)
      const isUpdate = this.data.submissionStatus === 'submitted' && !!this.data.submissionId
      const functionName = isUpdate ? 'submissionUpdate' : 'submissionSubmit'
      const scholarshipCode = this.getSubmissionScholarshipCode()

      wx.showLoading({ title: '提交中' })
      wx.cloud.callFunction({
        name: functionName,
        data: {
          activityId: this.data.activityId,
          periodId: selectedPeriod.id,
          periodSnapshot: buildPeriodSnapshot(selectedPeriod),
          submissionId: isUpdate ? this.data.submissionId : '',
          guardian: {
            name: this.data.guardian.name,
            phone: this.data.guardian.phone,
            wechat: this.data.guardian.wechat,
            idNo: this.data.guardian.idNo
          },
          childIds,
          scholarshipCode
        },
        success: (res) => {
          const result = (res.result || {}) as { ok?: boolean; message?: string; submissionId?: string }
          if (!result.ok) {
            wx.showToast({ title: result.message || '提交失败', icon: 'none' })
            wx.hideLoading()
            return
          }
          this.setData({
            submissionStatus: 'submitted',
            submissionId: result.submissionId || this.data.submissionId,
            loadedSubmissionId: result.submissionId || this.data.loadedSubmissionId
          })
          wx.hideLoading()
          this.startPayment()
        },
        fail: () => {
          wx.showToast({ title: '提交失败', icon: 'none' })
          wx.hideLoading()
        }
      })
    }
  }
})
