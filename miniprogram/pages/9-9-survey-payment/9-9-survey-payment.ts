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

const paymentTitle = '能力测评'

Page({
  data: {
    paying: false,
    deliverables: [
      {
        title: '1份专属【能力雷达图】',
        desc: '从 5 大维度快速建立孩子当前能力画像'
      },
      {
        title: '1次精准的【痛点诊断】',
        desc: '帮助家长识别优势区与潜能区'
      },
      {
        title: '1场资深顾问【1对1深度解读】',
        desc: '结合真实情况给出更有针对性的建议'
      }
    ]
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
  onPay() {
    if (!wx.cloud) {
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    if (this.data.paying) {
      return
    }

    this.setData({ paying: true })

    this.ensureLogin().then((ok) => {
      if (!ok) {
        this.setData({ paying: false })
        return
      }

      wx.showLoading({ title: '发起支付' })
      wx.cloud.callFunction({
        name: 'survey99PaymentCreate',
        data: {
          description: paymentTitle
        },
        success: (res) => {
          const result = (res.result || {}) as CreatePaymentResult
          if (!result.ok || !result.orderId || !result.outTradeNo || !result.totalFee) {
            wx.hideLoading()
            wx.showToast({ title: result.message || '支付发起失败', icon: 'none' })
            this.setData({ paying: false })
            return
          }

          wx.cloud.callFunction({
            name: 'wxpayFunctions',
            data: {
              type: 'wxpay_order',
              outTradeNo: result.outTradeNo,
              totalFee: result.totalFee,
              description: result.description || paymentTitle
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
                    name: 'survey99PaymentConfirm',
                    data: {
                      orderId: result.orderId,
                      outTradeNo: result.outTradeNo
                    },
                    success: (confirmRes) => {
                      const confirmResult = (confirmRes.result || {}) as ConfirmPaymentResult
                      if (!confirmResult.ok) {
                        wx.hideLoading()
                        wx.showToast({ title: confirmResult.message || '支付确认失败', icon: 'none' })
                        this.setData({ paying: false })
                        return
                      }

                      wx.setStorageSync('last_payment_success_context', {
                        source: '9-9-survey-payment',
                        outTradeNo: confirmResult.outTradeNo || result.outTradeNo,
                        totalFee: confirmResult.totalFee || result.totalFee,
                        activityTitle: result.title || paymentTitle,
                        reportOrderId: confirmResult.orderId || result.orderId,
                        paidAt: Date.now()
                      })

                      const query = [
                        `outTradeNo=${encodeURIComponent(confirmResult.outTradeNo || result.outTradeNo)}`,
                        `reportOrderId=${encodeURIComponent(confirmResult.orderId || result.orderId)}`
                      ].join('&')

                      wx.hideLoading()
                      wx.redirectTo({
                        url: `/pages/9-9-survey-questionnaire/9-9-survey-questionnaire?${query}`
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
    })
  }
})
