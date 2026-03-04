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

const defaultActivityId = 'ai-camp-2026'

const activityPeriodsMap: Record<string, ActivityPeriod[]> = {
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

const activityFeeMapYuan: Record<string, number> = {
  'ai-camp-2026': 18800,
  'ai-camp-2026-copy': 18800
}

const getActivityFeeYuan = (activityId: string) => {
  return activityFeeMapYuan[activityId] || activityFeeMapYuan[defaultActivityId]
}

const formatFeeText = (feeYuan: number) => `¥${feeYuan}`

const buildPriceState = (activityId: string, campers: Array<{ name?: string }>) => {
  const regularFeeYuan = getActivityFeeYuan(activityId)
  const result = resolveAlumniPrice(
    campers.map((item) => item.name || ''),
    regularFeeYuan
  )
  const isAlumniDiscount = result.alumniCount > 0
  const priceDetailParts = [
    result.alumniCount > 0 ? `老学员${result.alumniCount}人 × ¥${alumniDiscountFeeYuan}` : '',
    result.regularCount > 0 ? `新学员${result.regularCount}人 × ¥${regularFeeYuan}` : ''
  ].filter(Boolean)

  return {
    displayPrice: formatFeeText(result.totalFeeYuan),
    priceDetailText: priceDetailParts.join('，'),
    isAlumniDiscount,
    alumniDiscountText: isAlumniDiscount
      ? `${alumniDiscountLabel}（减免${result.alumniCount}人）`
      : '',
    matchedAlumniNames: result.matchedAlumniNames
  }
}

Component({
  data: {
    activityId: defaultActivityId,
    summary: getActivitySummary(defaultActivityId),
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
    campers: [
      {
        id: '',
        name: '',
        idNoMask: '',
        height: '',
        weight: '',
        allergies: '',
        personality: ''
      }
    ],
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
      const current = pages[pages.length - 1] as WechatMiniprogram.Page.Instance & {
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
      this.setData(
        {
          submissionId: nextSubmissionId,
          submissionStatus: nextSubmissionId ? this.data.submissionStatus : '',
          activityId: nextActivityId,
          summary: getActivitySummary(nextActivityId),
          periods: nextPeriods,
          selectedPeriodIndex
        },
        () => {
          this.refreshPriceState(nextActivityId, this.data.campers)
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
            this.ensureLogin().then(() => {
              this.loadSubmission(nextSubmissionId, nextPeriodId)
            })
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
    refreshPriceState(activityId?: string, campers?: Array<{ name?: string }>) {
      const priceState = buildPriceState(activityId || this.data.activityId, campers || this.data.campers)
      this.setData(priceState)
    },
    onImageError(event: WechatMiniprogram.ImageErrorEvent) {
      const dataset = event.currentTarget.dataset as { src?: string }
      console.warn('image-load-failed', dataset?.src || '', event.detail?.errMsg || '')
    },
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
              guardianSnapshot: {
                name: string
                phone: string
                wechat: string
                idNo: string
                idNoMask: string
              }
              childrenSnapshot: Array<{
                id: string
                name: string
                idNoMask: string
                height: string
                weight: string
                allergies: string
                personality: string
              }>
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
          console.info('order-form:loadSubmission', {
            activityId: this.data.activityId,
            periodId: periodIdFromData,
            status: result.data.status,
            campersCount: result.data.childrenSnapshot?.length || 0
          })
          const guardian = result.data.guardianSnapshot
          const campers = result.data.childrenSnapshot.length
            ? result.data.childrenSnapshot
            : [
                {
                  id: '',
                  name: '',
                  idNoMask: '',
                  height: '',
                  weight: '',
                  allergies: '',
                  personality: ''
                }
              ]
          this.setData(
            {
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
              campers
            },
            () => {
              this.refreshPriceState(this.data.activityId, campers)
            }
          )
        },
        fail: () => {
          wx.showToast({ title: '加载失败', icon: 'none' })
        },
        complete: () => {
          this.setData({ loading: false })
        }
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
        loadedPeriodId: periodId
      })
      this.ensureLogin().then(() => {
        this.loadSubmission('', periodId)
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
        campers.push({
          id: '',
          name: '',
          idNoMask: '',
          height: '',
          weight: '',
          allergies: '',
          personality: ''
        })
      }
      this.setData(
        {
          campers
        },
        () => {
          this.refreshPriceState(this.data.activityId, campers)
        }
      )
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
    onOpenCamper(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset as { index?: number }
      if (index === undefined) {
        return
      }
      const camper = this.data.campers[index]
      wx.navigateTo({
        url: `/pages/camper-list/camper-list?index=${index}&selectedId=${encodeURIComponent(camper.id || '')}`,
        events: {
          selected: (payload: { index: number; camper: { id: string; name: string; idNoMask?: string; height: string; weight: string; allergies: string; personality: string } }) => {
            const campers = [...this.data.campers]
            if (campers[payload.index]) {
              campers[payload.index] = {
                ...payload.camper,
                idNoMask: payload.camper.idNoMask || ''
              }
              this.setData({ campers }, () => {
                this.refreshPriceState(this.data.activityId, campers)
              })
            }
          }
        },
        success: () => {}
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
        wx.showToast({ title: '请填写监护人身份证号', icon: 'none' })
        return false
      }
      const missing = this.data.campers.find((item) => !item.id)
      if (missing) {
        wx.showToast({ title: '请先选择营员', icon: 'none' })
        return false
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
      console.info('order-form:startPayment', {
        activityId: this.data.activityId,
        periodId,
        submissionStatus: this.data.submissionStatus
      })
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
          }
          console.info('order-form:paymentPrepare:result', result)
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
          const paymentSnapshot = {
            outTradeNo: result.outTradeNo,
            totalFee: result.totalFee,
            activityId: result.activityId || this.data.activityId,
            periodId: result.periodId || periodId,
            activityTitle: this.data.summary.title || '活动报名',
            submissionId: result.submissionId || this.data.submissionId || ''
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
              console.info('order-form:wxpayFunctions:raw', callRes)
              const rawResult = (callRes.result || {}) as { errcode?: string; errmsg?: string }
              const errMsg = typeof rawResult.errmsg === 'string' ? rawResult.errmsg : ''
              if (rawResult.errcode || errMsg) {
                wx.hideLoading()
                if (errMsg.includes('ORDERPAID')) {
                  wx.showToast({ title: '订单已支付，可再次购买', icon: 'none' })
                  this.setData({ submissionStatus: 'paid', submissionId: '' })
                } else {
                  wx.showToast({ title: '支付发起失败', icon: 'none' })
                }
                this.setData({ paying: false })
                return
              }
              const paymentData = (callRes.result || {}).data as {
                timeStamp?: string
                nonceStr?: string
                package?: string
                packageVal?: string
                paySign?: string
                signType?: string
              }
              const packageValue = paymentData ? paymentData.packageVal || paymentData.package || '' : ''
              console.info('order-form:wxpayFunctions:parsed', {
                hasTimeStamp: !!paymentData?.timeStamp,
                hasNonceStr: !!paymentData?.nonceStr,
                hasPackage: !!packageValue,
                signType: paymentData?.signType || '',
                keys: paymentData ? Object.keys(paymentData) : []
              })
              if (!paymentData || !paymentData.timeStamp || !paymentData.nonceStr || !packageValue) {
                wx.hideLoading()
                console.warn('order-form:payment-missing', {
                  result: callRes?.result || null
                })
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
                signType: paymentData.signType || 'RSA',
                success: () => {
                  this.setData({ submissionStatus: 'paid' })
                  wx.setStorageSync('last_pay_success', {
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
                      : ''
                  ]
                    .filter(Boolean)
                    .join('&')
                  wx.redirectTo({
                    url: query ? `/pages/pay-success/pay-success?${query}` : '/pages/pay-success/pay-success'
                  })
                },
                fail: (err) => {
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

      console.info('order-form:submit', {
        activityId: this.data.activityId,
        periodId: selectedPeriod.id,
        submissionStatus: this.data.submissionStatus,
        campersCount: this.data.campers.length,
        childIdsCount: childIds.length,
        functionName
      })

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
          childIds
        },
        success: (res) => {
          const result = (res.result || {}) as { ok?: boolean; message?: string; submissionId?: string }
          console.info('order-form:submit:result', result)
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
