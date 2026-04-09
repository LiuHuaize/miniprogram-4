type SignupForm = {
  parentName: string
  phone: string
  childAge: string
}

type PaymentParams = {
  timeStamp?: string
  nonceStr?: string
  package?: string
  packageVal?: string
  paySign?: string
  signType?: string
}

type CreatePaymentResult = {
  ok?: boolean
  message?: string
  orderId?: string
  outTradeNo?: string
  totalFee?: number
  title?: string
  description?: string
}

type ConfirmPaymentResult = {
  ok?: boolean
  message?: string
  orderId?: string
  outTradeNo?: string
  totalFee?: number
}

type FormValidationResult =
  | {
      ok: true
      form: SignupForm
    }
  | {
      ok: false
      message: string
    }

const draftStorageKey = '2026_0425_activity_poster_signup_draft'
const defaultPosterSrc = '/assets/poster/activity-425-poster.jpg'
const paymentSource = '2026-0425-activity-poster'
const paymentTitle = 'AI时代少年创业力峰会'

const createDefaultForm = (): SignupForm => ({
  parentName: '',
  phone: '',
  childAge: ''
})

const decodeValue = (value?: string) => {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const getInputValue = (event: WechatMiniprogram.CustomEvent) => {
  const detail = event?.detail
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'value' in detail) {
    return String((detail as { value?: string | number }).value ?? '')
  }
  return ''
}

const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 11)
const normalizeAge = (value: string) => value.replace(/\D/g, '').slice(0, 2)

const validateForm = (form: SignupForm): FormValidationResult => {
  const parentName = form.parentName.trim()
  const phone = normalizePhone(form.phone)
  const childAge = normalizeAge(form.childAge)
  const ageNumber = Number(childAge)

  if (!parentName) {
    return {
      ok: false,
      message: '请填写家长真实姓名'
    }
  }

  if (!/^1\d{10}$/.test(phone)) {
    return {
      ok: false,
      message: '请填写正确的联系电话'
    }
  }

  if (!childAge || !Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 18) {
    return {
      ok: false,
      message: '请填写正确的孩子年龄'
    }
  }

  return {
    ok: true,
    form: {
      parentName,
      phone,
      childAge
    }
  }
}

Page({
  data: {
    paying: false,
    posterSrc: defaultPosterSrc,
    form: createDefaultForm()
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
    const storedDraft = wx.getStorageSync(draftStorageKey) || {}
    const posterSrc = decodeValue(options?.poster) || defaultPosterSrc

    this.setData({
      posterSrc,
      form: {
        parentName: typeof storedDraft.parentName === 'string' ? storedDraft.parentName : '',
        phone: typeof storedDraft.phone === 'string' ? storedDraft.phone : '',
        childAge: typeof storedDraft.childAge === 'string' ? storedDraft.childAge : ''
      }
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
  saveDraft(nextForm: SignupForm) {
    wx.setStorageSync(draftStorageKey, nextForm)
  },
  updateFormField(field: keyof SignupForm, rawValue: string) {
    const nextValue =
      field === 'phone' ? normalizePhone(rawValue) : field === 'childAge' ? normalizeAge(rawValue) : rawValue
    const nextForm = {
      ...this.data.form,
      [field]: nextValue
    }

    this.setData({
      form: nextForm
    })
    this.saveDraft(nextForm)
  },
  onParentNameChange(event: WechatMiniprogram.CustomEvent) {
    this.updateFormField('parentName', getInputValue(event))
  },
  onPhoneChange(event: WechatMiniprogram.CustomEvent) {
    this.updateFormField('phone', getInputValue(event))
  },
  onChildAgeChange(event: WechatMiniprogram.CustomEvent) {
    this.updateFormField('childAge', getInputValue(event))
  },
  onPosterError() {
    wx.showToast({
      title: '海报加载失败',
      icon: 'none'
    })
  },
  onPay() {
    if (!wx.cloud) {
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    if (this.data.paying) {
      return
    }

    const result = validateForm(this.data.form)
    if (!result.ok) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }

    this.setData({ paying: true })
    this.saveDraft(result.form)

    this.ensureLogin().then((loggedIn) => {
      if (!loggedIn) {
        this.setData({ paying: false })
        return
      }

      wx.showLoading({ title: '发起支付' })
      wx.cloud.callFunction({
        name: 'posterSignupPaymentCreate',
        data: {
          posterCode: paymentSource,
          parentName: result.form.parentName,
          phone: result.form.phone,
          childAge: Number(result.form.childAge),
          posterSrc: this.data.posterSrc
        },
        success: (createRes) => {
          const createResult = (createRes.result || {}) as CreatePaymentResult
          if (!createResult.ok || !createResult.orderId || !createResult.outTradeNo || !createResult.totalFee) {
            wx.hideLoading()
            wx.showToast({ title: createResult.message || '支付发起失败', icon: 'none' })
            this.setData({ paying: false })
            return
          }

          wx.cloud.callFunction({
            name: 'wxpayFunctions',
            data: {
              type: 'wxpay_order',
              outTradeNo: createResult.outTradeNo,
              totalFee: createResult.totalFee,
              description: createResult.description || paymentTitle
            },
            success: (payRes) => {
              const rawResult = (payRes.result || {}) as { errcode?: string; errmsg?: string }
              const errMsg = typeof rawResult.errmsg === 'string' ? rawResult.errmsg : ''
              if (rawResult.errcode || errMsg) {
                wx.hideLoading()
                wx.showToast({ title: errMsg || '支付发起失败', icon: 'none' })
                this.setData({ paying: false })
                return
              }

              const paymentResult =
                (typeof payRes.result === 'object' && payRes.result ? payRes.result : {}) as {
                  data?: PaymentParams
                }
              const payment = paymentResult.data || {}
              const packageValue = payment.packageVal || payment.package || ''

              if (!payment.timeStamp || !payment.nonceStr || !packageValue) {
                wx.hideLoading()
                wx.showToast({ title: '支付参数缺失', icon: 'none' })
                this.setData({ paying: false })
                return
              }

              wx.hideLoading()
              wx.requestPayment({
                timeStamp: payment.timeStamp,
                nonceStr: payment.nonceStr,
                package: packageValue,
                paySign: payment.paySign || '',
                signType: (payment.signType || 'RSA') as 'RSA' | 'MD5' | 'HMAC-SHA256',
                success: () => {
                  wx.showLoading({ title: '确认支付' })
                  wx.cloud.callFunction({
                    name: 'posterSignupPaymentConfirm',
                    data: {
                      orderId: createResult.orderId,
                      outTradeNo: createResult.outTradeNo
                    },
                    success: (confirmRes) => {
                      const confirmResult = (confirmRes.result || {}) as ConfirmPaymentResult
                      if (!confirmResult.ok) {
                        wx.hideLoading()
                        wx.showToast({ title: confirmResult.message || '支付确认失败', icon: 'none' })
                        this.setData({ paying: false })
                        return
                      }

                      wx.removeStorageSync(draftStorageKey)
                      wx.setStorageSync('last_payment_success_context', {
                        source: paymentSource,
                        outTradeNo: confirmResult.outTradeNo || createResult.outTradeNo,
                        totalFee: confirmResult.totalFee || createResult.totalFee,
                        activityTitle: createResult.title || paymentTitle,
                        posterSignupOrderId: confirmResult.orderId || createResult.orderId,
                        paidAt: Date.now()
                      })

                      const query = [
                        `source=${encodeURIComponent(paymentSource)}`,
                        `outTradeNo=${encodeURIComponent(confirmResult.outTradeNo || createResult.outTradeNo)}`,
                        `posterSignupOrderId=${encodeURIComponent(confirmResult.orderId || createResult.orderId)}`,
                        `activityTitle=${encodeURIComponent(createResult.title || paymentTitle)}`,
                        `totalFee=${encodeURIComponent(String(confirmResult.totalFee || createResult.totalFee))}`
                      ].join('&')

                      wx.hideLoading()
                      wx.redirectTo({
                        url: `/pages/registration-payment-success/registration-payment-success?${query}`
                      })
                    },
                    fail: () => {
                      wx.hideLoading()
                      wx.showToast({ title: '支付确认失败', icon: 'none' })
                      this.setData({ paying: false })
                    }
                  })
                },
                fail: (err) => {
                  const paymentErrMsg = err && typeof err === 'object' && 'errMsg' in err ? String(err.errMsg) : ''
                  if (paymentErrMsg.includes('cancel')) {
                    wx.showToast({ title: '已取消支付', icon: 'none' })
                  } else {
                    wx.showToast({ title: '支付失败', icon: 'none' })
                  }
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
    })
  }
})
