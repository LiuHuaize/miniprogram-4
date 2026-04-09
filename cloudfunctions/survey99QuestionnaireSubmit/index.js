const fs = require('fs')
const path = require('path')
const https = require('https')
const crypto = require('crypto')
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const orders = db.collection('report_pay_orders')
const questionnaires = db.collection('report_questionnaires')

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeComparableText = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[\s\r\n\t`~!@#$%^&*()_+\-=\[\]{};'",.<>/?\\|，。、“”‘’：；（）【】《》…·]/g, '')
const toScore = (value) => {
  const num = Number(value)
  if (Number.isFinite(num) && num >= 1 && num <= 5) {
    return Math.floor(num)
  }
  return 0
}
const stripWrappingQuotes = (value) => {
  const text = normalizeText(value)
  if (!text) {
    return ''
  }

  const hasDoubleQuotes = text.startsWith('"') && text.endsWith('"')
  const hasSingleQuotes = text.startsWith("'") && text.endsWith("'")
  if (hasDoubleQuotes || hasSingleQuotes) {
    return text.slice(1, -1).trim()
  }

  return text
}
const parseEnvText = (text) => {
  return String(text || '')
    .split(/\r?\n/)
    .reduce((result, line) => {
      const trimmed = normalizeText(line)
      if (!trimmed || trimmed.startsWith('#')) {
        return result
      }

      const index = trimmed.indexOf('=')
      if (index <= 0) {
        return result
      }

      const key = normalizeText(trimmed.slice(0, index))
      if (!key) {
        return result
      }

      result[key] = stripWrappingQuotes(trimmed.slice(index + 1))
      return result
    }, {})
}
const readEnvFile = (filePath) => {
  try {
    return parseEnvText(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    return {}
  }
}
const envCache = {
  loaded: false,
  values: {}
}
const loadEnvValues = () => {
  if (envCache.loaded) {
    return envCache.values
  }

  const repoEnv = readEnvFile(path.resolve(__dirname, '../../.env'))
  const localEnv = readEnvFile(path.join(__dirname, 'local.env'))
  const dotEnv = readEnvFile(path.join(__dirname, '.env'))

  envCache.values = {
    ...repoEnv,
    ...localEnv,
    ...dotEnv
  }
  envCache.loaded = true

  return envCache.values
}
const resolveBitableTokenInfo = (sourceUrl) => {
  const url = normalizeText(sourceUrl)
  if (!url) {
    return {
      appToken: '',
      tableId: ''
    }
  }

  try {
    const parsed = new URL(url)
    const matched = parsed.pathname.match(/\/base\/([^/?#]+)/)
    return {
      appToken: matched ? normalizeText(matched[1]) : '',
      tableId: normalizeText(parsed.searchParams.get('table') || '')
    }
  } catch (err) {
    return {
      appToken: '',
      tableId: ''
    }
  }
}
const resolveFeishuConfig = () => {
  const env = loadEnvValues()
  const sourceUrl =
    normalizeText(process.env.FEISHU_BASE_URL || '') ||
    normalizeText(env.FEISHU_BASE_URL || '')
  const tokenInfo = resolveBitableTokenInfo(sourceUrl)

  const appId =
    normalizeText(process.env.APP_ID || '') ||
    normalizeText(process.env.FEISHU_APP_ID || '') ||
    normalizeText(env.APP_ID || '') ||
    normalizeText(env.App_ID || '') ||
    normalizeText(env.FEISHU_APP_ID || '')
  const appSecret =
    normalizeText(process.env.APP_SECRET || '') ||
    normalizeText(process.env.FEISHU_APP_SECRET || '') ||
    normalizeText(env.APP_SECRET || '') ||
    normalizeText(env.App_Secret || '') ||
    normalizeText(env.FEISHU_APP_SECRET || '')
  const appToken =
    normalizeText(process.env.FEISHU_APP_TOKEN || '') ||
    normalizeText(env.FEISHU_APP_TOKEN || '') ||
    tokenInfo.appToken
  const tableId =
    normalizeText(process.env.FEISHU_TABLE_ID || '') ||
    normalizeText(env.FEISHU_TABLE_ID || '') ||
    tokenInfo.tableId

  return {
    enabled: !!(appId && appSecret && appToken && tableId),
    appId,
    appSecret,
    appToken,
    tableId,
    fieldChildInfo:
      normalizeText(process.env.FEISHU_FIELD_CHILD_INFO || '') ||
      normalizeText(env.FEISHU_FIELD_CHILD_INFO || '') ||
      '孩子信息',
    fieldTotalScore:
      normalizeText(process.env.FEISHU_FIELD_TOTAL_SCORE || '') ||
      normalizeText(env.FEISHU_FIELD_TOTAL_SCORE || '') ||
      '总分',
    questionFieldPrefix:
      normalizeText(process.env.FEISHU_FIELD_PREFIX || '') ||
      normalizeText(env.FEISHU_FIELD_PREFIX || '') ||
      'Q'
  }
}
const buildUuidV4 = (seed) => {
  const hex = crypto.createHash('md5').update(normalizeText(seed) || '9-9-survey-questionnaire').digest('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32)
  ].join('-')
}
const requestJson = ({ method = 'GET', url, headers = {}, body }) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : ''
    const parsed = new URL(url)
    const request = https.request(
      {
        method,
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          ...headers,
          ...(payload
            ? {
                'Content-Length': Buffer.byteLength(payload)
              }
            : {})
        }
      },
      (response) => {
        let raw = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          raw += chunk
        })
        response.on('end', () => {
          const text = normalizeText(raw)
          if (!text) {
            resolve({})
            return
          }

          try {
            resolve(JSON.parse(text))
          } catch (err) {
            reject(new Error(`Invalid JSON response: ${text.slice(0, 120)}`))
          }
        })
      }
    )

    request.on('error', (err) => {
      reject(err)
    })

    request.setTimeout(10000, () => {
      request.destroy(new Error('Request timeout'))
    })

    if (payload) {
      request.write(payload)
    }

    request.end()
  })
}
const resolveFeishuApiMessage = (result, fallback) => {
  const message =
    normalizeText(result?.msg || '') ||
    normalizeText(result?.message || '') ||
    normalizeText(result?.errmsg || '')
  if (!message) {
    return fallback
  }

  const code = Number(result?.code)
  if (Number.isFinite(code) && code !== 0) {
    return `${message} (code: ${code})`
  }

  return message
}
const getTenantAccessToken = async (config) => {
  const result = await requestJson({
    method: 'POST',
    url: 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: {
      app_id: config.appId,
      app_secret: config.appSecret
    }
  })

  if (Number(result?.code) !== 0 || !normalizeText(result?.tenant_access_token || '')) {
    throw new Error(resolveFeishuApiMessage(result, '获取飞书 tenant_access_token 失败'))
  }

  return normalizeText(result.tenant_access_token)
}
const getFeishuTableFields = async ({ config, tenantAccessToken }) => {
  const result = await requestJson({
    method: 'GET',
    url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(config.appToken)}/tables/${encodeURIComponent(config.tableId)}/fields?page_size=200`,
    headers: {
      Authorization: `Bearer ${tenantAccessToken}`
    }
  })

  if (Number(result?.code) !== 0) {
    throw new Error(resolveFeishuApiMessage(result, '获取飞书表字段失败'))
  }

  return Array.isArray(result?.data?.items) ? result.data.items : []
}
const pickChildInfoFieldName = ({ config, tableFields }) => {
  const exactField = tableFields.find((item) => item.field_name === config.fieldChildInfo)
  if (exactField?.field_name) {
    return exactField.field_name
  }

  const fuzzyField = tableFields.find((item) => {
    const text = normalizeComparableText(item.field_name)
    return text.includes('孩子') && (text.includes('名字') || text.includes('年龄'))
  })
  if (fuzzyField?.field_name) {
    return fuzzyField.field_name
  }

  const firstTextField = tableFields.find((item) => item.ui_type === 'Text' || item.type === 1)
  return normalizeText(firstTextField?.field_name || '')
}
const pickTotalScoreFieldName = ({ config, tableFields }) => {
  const exactField = tableFields.find((item) => item.field_name === config.fieldTotalScore)
  if (exactField?.field_name) {
    return exactField.field_name
  }

  const fuzzyField = tableFields.find((item) => normalizeComparableText(item.field_name).includes('总分'))
  return normalizeText(fuzzyField?.field_name || '')
}
const pickQuestionFieldNames = ({ config, tableFields, normalizedAnswers }) => {
  const tableFieldNameSet = new Set(tableFields.map((item) => item.field_name))
  const qFields = normalizedAnswers.map((item) => `${config.questionFieldPrefix}${item.no}`)
  if (config.questionFieldPrefix && qFields.every((fieldName) => tableFieldNameSet.has(fieldName))) {
    return qFields
  }

  const ratingFields = tableFields.filter((item) => item.ui_type === 'Rating')
  if (ratingFields.length >= normalizedAnswers.length) {
    return ratingFields.slice(0, normalizedAnswers.length).map((item) => item.field_name)
  }

  return normalizedAnswers.map((answer) => {
    const matched = tableFields.find(
      (item) => normalizeComparableText(item.field_name) === normalizeComparableText(answer.title)
    )
    return normalizeText(matched?.field_name || '')
  })
}
const buildFeishuFields = ({ config, childNameAge, rawTotalScore, normalizedAnswers, tableFields }) => {
  const fields = {}
  const childFieldName = pickChildInfoFieldName({ config, tableFields })
  const totalScoreFieldName = pickTotalScoreFieldName({ config, tableFields })
  const questionFieldNames = pickQuestionFieldNames({
    config,
    tableFields,
    normalizedAnswers
  })

  if (childFieldName) {
    fields[childFieldName] = childNameAge
  }

  if (totalScoreFieldName) {
    fields[totalScoreFieldName] = rawTotalScore
  }

  normalizedAnswers.forEach((item, index) => {
    const fieldName = questionFieldNames[index]
    if (!fieldName) {
      return
    }

    fields[fieldName] = item.score
  })

  return fields
}
const syncQuestionnaireToFeishu = async ({ config, childNameAge, rawTotalScore, normalizedAnswers, clientToken }) => {
  const tenantAccessToken = await getTenantAccessToken(config)
  const tableFields = await getFeishuTableFields({
    config,
    tenantAccessToken
  })
  const fields = buildFeishuFields({
    config,
    childNameAge,
    rawTotalScore,
    normalizedAnswers,
    tableFields
  })

  if (Object.keys(fields).length < normalizedAnswers.length) {
    throw new Error('飞书字段映射不完整，请检查表格列结构')
  }

  const result = await requestJson({
    method: 'POST',
    url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(config.appToken)}/tables/${encodeURIComponent(config.tableId)}/records?client_token=${encodeURIComponent(clientToken)}`,
    headers: {
      Authorization: `Bearer ${tenantAccessToken}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: {
      fields
    }
  })

  if (Number(result?.code) !== 0) {
    throw new Error(resolveFeishuApiMessage(result, '飞书写入失败'))
  }

  const record = result?.data?.record || {}
  return {
    recordId: normalizeText(record.record_id || record.id || ''),
    fields
  }
}
const limitText = (value, maxLength = 80) => {
  const text = normalizeText(value)
  if (!text || text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}...`
}

const allowedQuestionNos = Array.from({ length: 20 }, (_, index) => index + 2)
const questionMetaList = [
  {
    id: 'critical-thinking-1',
    no: 2,
    dimensionKey: 'critical_thinking',
    dimensionLabel: '批判与逻辑'
  },
  {
    id: 'adaptability-1',
    no: 3,
    dimensionKey: 'adaptability_resilience',
    dimensionLabel: '适应与韧性'
  },
  {
    id: 'critical-thinking-2',
    no: 4,
    dimensionKey: 'critical_thinking',
    dimensionLabel: '批判与逻辑'
  },
  {
    id: 'initiative-1',
    no: 5,
    dimensionKey: 'initiative_execution',
    dimensionLabel: '主动与执行'
  },
  {
    id: 'collaboration-1',
    no: 6,
    dimensionKey: 'empathy_collaboration',
    dimensionLabel: '共情与协作'
  },
  {
    id: 'initiative-2',
    no: 7,
    dimensionKey: 'initiative_execution',
    dimensionLabel: '主动与执行'
  },
  {
    id: 'digital-1',
    no: 8,
    dimensionKey: 'digital_literacy_focus',
    dimensionLabel: '数字素养与专注'
  },
  {
    id: 'collaboration-2',
    no: 9,
    dimensionKey: 'empathy_collaboration',
    dimensionLabel: '共情与协作'
  },
  {
    id: 'critical-thinking-3',
    no: 10,
    dimensionKey: 'critical_thinking',
    dimensionLabel: '批判与逻辑'
  },
  {
    id: 'initiative-3',
    no: 11,
    dimensionKey: 'initiative_execution',
    dimensionLabel: '主动与执行'
  },
  {
    id: 'adaptability-2',
    no: 12,
    dimensionKey: 'adaptability_resilience',
    dimensionLabel: '适应与韧性'
  },
  {
    id: 'digital-2',
    no: 13,
    dimensionKey: 'digital_literacy_focus',
    dimensionLabel: '数字素养与专注'
  },
  {
    id: 'initiative-4',
    no: 14,
    dimensionKey: 'initiative_execution',
    dimensionLabel: '主动与执行'
  },
  {
    id: 'collaboration-3',
    no: 15,
    dimensionKey: 'empathy_collaboration',
    dimensionLabel: '共情与协作'
  },
  {
    id: 'critical-thinking-4',
    no: 16,
    dimensionKey: 'critical_thinking',
    dimensionLabel: '批判与逻辑'
  },
  {
    id: 'collaboration-4',
    no: 17,
    dimensionKey: 'empathy_collaboration',
    dimensionLabel: '共情与协作'
  },
  {
    id: 'digital-3',
    no: 18,
    dimensionKey: 'digital_literacy_focus',
    dimensionLabel: '数字素养与专注'
  },
  {
    id: 'adaptability-3',
    no: 19,
    dimensionKey: 'adaptability_resilience',
    dimensionLabel: '适应与韧性'
  },
  {
    id: 'digital-4',
    no: 20,
    dimensionKey: 'digital_literacy_focus',
    dimensionLabel: '数字素养与专注'
  },
  {
    id: 'adaptability-4',
    no: 21,
    dimensionKey: 'adaptability_resilience',
    dimensionLabel: '适应与韧性'
  }
]
const dimensionOrder = [
  'critical_thinking',
  'adaptability_resilience',
  'initiative_execution',
  'empathy_collaboration',
  'digital_literacy_focus'
]
const questionMetaByNo = questionMetaList.reduce((result, item) => {
  result[item.no] = item
  return result
}, {})
const buildPercent = (score, maxScore) => {
  if (!maxScore) {
    return 0
  }
  return Math.round((score / maxScore) * 100)
}
const round1 = (value) => Math.round(value * 10) / 10

const getOrderDoc = async (reportOrderId, outTradeNo, openid) => {
  if (reportOrderId) {
    const doc = await orders.doc(reportOrderId).get().catch(() => null)
    if (doc?.data) {
      return doc.data
    }
  }

  if (!outTradeNo) {
    return null
  }

  const res = await orders
    .where({
      ownerOpenid: openid,
      outTradeNo
    })
    .limit(1)
    .get()

  return res.data?.[0] || null
}
const getQuestionnaireDoc = async (order, openid) => {
  const directQuestionnaireId = normalizeText(order?.questionnaireId || '')
  if (directQuestionnaireId) {
    const doc = await questionnaires.doc(directQuestionnaireId).get().catch(() => null)
    if (doc?.data) {
      return doc.data
    }
  }

  const res = await questionnaires
    .where({
      ownerOpenid: openid,
      reportOrderId: order._id
    })
    .limit(1)
    .get()

  return res.data?.[0] || null
}
const buildQuestionnaireDocId = (order, existingQuestionnaire) => {
  return normalizeText(existingQuestionnaire?._id || '') || normalizeText(order?.questionnaireId || '') || order._id
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const action = normalizeText(event?.action || '')
  const reportOrderId = normalizeText(event?.reportOrderId || event?.orderId || '')
  const outTradeNo = normalizeText(event?.outTradeNo || event?.out_trade_no || '')

  if (!OPENID) {
    return {
      ok: false,
      message: 'openid is required'
    }
  }

  const order = await getOrderDoc(reportOrderId, outTradeNo, OPENID)
  if (!order || order.ownerOpenid !== OPENID) {
    return {
      ok: false,
      message: '未找到对应订单'
    }
  }

  const existingQuestionnaire = await getQuestionnaireDoc(order, OPENID)
  if (action === 'status') {
    const questionnaireId = buildQuestionnaireDocId(order, existingQuestionnaire)
    const submitted = order.questionnaireStatus === 'submitted' || !!existingQuestionnaire
    const feishuSynced =
      order.feishuSyncStatus === 'synced' || existingQuestionnaire?.feishuSyncStatus === 'synced'

    return {
      ok: true,
      submitted,
      feishuSynced,
      questionnaireId: submitted ? questionnaireId : '',
      message: submitted ? '问卷已提交' : '问卷未提交'
    }
  }

  const childNameAge = normalizeText(event?.childNameAge || '')
  const answers = Array.isArray(event?.answers) ? event.answers : []

  if (!childNameAge) {
    return {
      ok: false,
      message: '请填写孩子信息'
    }
  }

  if (answers.length !== allowedQuestionNos.length) {
    return {
      ok: false,
      message: '问卷题目不完整'
    }
  }

  const normalizedAnswers = answers.map((item) => ({
    id: normalizeText(item?.id || ''),
    no: Number(item?.no) || 0,
    title: normalizeText(item?.title || ''),
    score: toScore(item?.score),
    reverse: !!item?.reverse,
    dimensionKey: normalizeText(item?.dimensionKey || ''),
    dimensionLabel: normalizeText(item?.dimensionLabel || '')
  }))

  const invalidAnswer = normalizedAnswers.find((item, index) => {
    const meta = questionMetaByNo[item.no]
    return (
      item.no !== allowedQuestionNos[index] ||
      !item.score ||
      !item.title ||
      !meta ||
      item.id !== meta.id ||
      item.dimensionKey !== meta.dimensionKey ||
      item.dimensionLabel !== meta.dimensionLabel
    )
  })

  if (invalidAnswer) {
    return {
      ok: false,
      message: '问卷答案校验失败'
    }
  }

  if (order.status !== 'paid') {
    return {
      ok: false,
      message: '订单未支付'
    }
  }

  const structuredAnswers = normalizedAnswers.map((item) => {
    const adjustedScore = item.reverse ? 6 - item.score : item.score
    return {
      questionId: item.id,
      questionNo: item.no,
      title: item.title,
      dimensionKey: item.dimensionKey,
      dimensionLabel: item.dimensionLabel,
      reverse: item.reverse,
      rawScore: item.score,
      adjustedScore
    }
  })

  const rawTotalScore = structuredAnswers.reduce((sum, item) => sum + item.rawScore, 0)
  const adjustedTotalScore = structuredAnswers.reduce((sum, item) => sum + item.adjustedScore, 0)
  const dimensionMap = structuredAnswers.reduce((result, item) => {
    const current = result[item.dimensionKey] || {
      dimensionKey: item.dimensionKey,
      dimensionLabel: item.dimensionLabel,
      questionCount: 0,
      questionNos: [],
      rawScore: 0,
      adjustedScore: 0
    }
    current.questionCount += 1
    current.questionNos.push(item.questionNo)
    current.rawScore += item.rawScore
    current.adjustedScore += item.adjustedScore
    result[item.dimensionKey] = current
    return result
  }, {})
  const dimensionScores = dimensionOrder
    .map((dimensionKey) => dimensionMap[dimensionKey])
    .filter(Boolean)
    .map((item) => {
      const maxScore = item.questionCount * 5
      return {
        ...item,
        avgRawScore: round1(item.rawScore / item.questionCount),
        avgAdjustedScore: round1(item.adjustedScore / item.questionCount),
        percent: buildPercent(item.adjustedScore, maxScore),
        maxScore
      }
    })

  const data = {
    ownerOpenid: OPENID,
    reportOrderId: order._id,
    outTradeNo: order.outTradeNo || outTradeNo,
    source: '9-9-survey-payment',
    status: 'submitted',
    version: 'v1',
    respondent: {
      childNameAge
    },
    questionnaire: {
      title: '少年独角兽能力矩阵评估问卷',
      scaleLabels: ['1分: 从不', '2分: 很少', '3分: 有时', '4分: 经常', '5分: 总是'],
      questionCount: structuredAnswers.length,
      reverseQuestionNos: structuredAnswers.filter((item) => item.reverse).map((item) => item.questionNo)
    },
    answers: structuredAnswers,
    scoring: {
      rawTotalScore,
      adjustedTotalScore,
      maxScore: structuredAnswers.length * 5,
      percent: buildPercent(adjustedTotalScore, structuredAnswers.length * 5),
      dimensionScores
    },
    dimensionScores,
    submittedAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  const questionnaireId = buildQuestionnaireDocId(order, existingQuestionnaire)
  const questionnaireExists = await questionnaires.doc(questionnaireId).get().catch(() => null)

  if (questionnaireExists?.data) {
    await questionnaires.doc(questionnaireId).update({
      data
    })
  } else {
    await questionnaires.doc(questionnaireId).set({
      data: {
        ...data,
        createdAt: db.serverDate()
      }
    })
  }

  await orders.doc(order._id).update({
    data: {
      questionnaireStatus: 'submitted',
      questionnaireId,
      questionnaireSubmittedAt: db.serverDate(),
      questionnaire: {
        version: 'v1',
        status: 'submitted',
        questionCount: structuredAnswers.length,
        childNameAge,
        submittedAt: db.serverDate()
      },
      respondent: {
        childNameAge
      },
      latestScoring: {
        rawTotalScore,
        adjustedTotalScore,
        percent: buildPercent(adjustedTotalScore, structuredAnswers.length * 5),
        dimensionScores
      },
      updatedAt: db.serverDate()
    }
  })

  const feishuConfig = resolveFeishuConfig()
  const alreadyFeishuSynced =
    order.feishuSyncStatus === 'synced' ||
    existingQuestionnaire?.feishuSyncStatus === 'synced' ||
    !!normalizeText(order.feishuRecordId || '') ||
    !!normalizeText(existingQuestionnaire?.feishuRecordId || '')
  let feishuSynced = false
  let feishuMessage = '问卷已提交，我们会基于结果进入后续解读流程。'

  if (alreadyFeishuSynced) {
    feishuSynced = true
    feishuMessage = '问卷已提交，并已同步到飞书表格。'
  } else if (feishuConfig.enabled) {
    try {
      const feishuResult = await syncQuestionnaireToFeishu({
        config: feishuConfig,
        childNameAge,
        rawTotalScore,
        normalizedAnswers,
        clientToken: buildUuidV4(`9-9-survey-questionnaire:${order._id}`)
      })

      feishuSynced = true
      feishuMessage = '问卷已提交，并已同步到飞书表格。'

      await questionnaires.doc(questionnaireId).update({
        data: {
          feishuSyncStatus: 'synced',
          feishuRecordId: feishuResult.recordId,
          feishuErrorMessage: '',
          feishuSyncedAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })

      await orders.doc(order._id).update({
        data: {
          feishuSyncStatus: 'synced',
          feishuRecordId: feishuResult.recordId,
          feishuSyncErrorMessage: '',
          feishuSyncedAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    } catch (err) {
      const errorMessage = limitText(err?.message || '飞书同步失败', 120) || '飞书同步失败'
      feishuMessage = `问卷已提交，但飞书同步失败：${errorMessage}`

      await questionnaires.doc(questionnaireId).update({
        data: {
          feishuSyncStatus: 'failed',
          feishuRecordId: '',
          feishuErrorMessage: errorMessage,
          feishuSyncTriedAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })

      await orders.doc(order._id).update({
        data: {
          feishuSyncStatus: 'failed',
          feishuRecordId: '',
          feishuSyncErrorMessage: errorMessage,
          feishuSyncTriedAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }
  } else {
    feishuMessage = '问卷已提交，飞书同步未启用。'

    await questionnaires.doc(questionnaireId).update({
      data: {
        feishuSyncStatus: 'skipped',
        feishuRecordId: '',
        feishuErrorMessage: 'missing feishu config',
        feishuSyncTriedAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })

    await orders.doc(order._id).update({
      data: {
        feishuSyncStatus: 'skipped',
        feishuRecordId: '',
        feishuSyncErrorMessage: 'missing feishu config',
        feishuSyncTriedAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })
  }

  return {
    ok: true,
    questionnaireId,
    feishuSynced,
    message: feishuMessage
  }
}
