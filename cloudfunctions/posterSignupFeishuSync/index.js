const fs = require('fs')
const path = require('path')
const https = require('https')
const crypto = require('crypto')
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const orders = db.collection('poster_signup_orders')

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, '').slice(0, 11)
const toPositiveInteger = (value) => {
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) {
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
  const sourceUrl = normalizeText(process.env.FEISHU_BASE_URL || '') || normalizeText(env.FEISHU_BASE_URL || '')
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
    fieldParentInfo:
      normalizeText(process.env.FEISHU_FIELD_PARENT_INFO || '') ||
      normalizeText(env.FEISHU_FIELD_PARENT_INFO || '') ||
      '家长信息表',
    fieldPhone:
      normalizeText(process.env.FEISHU_FIELD_PHONE || '') ||
      normalizeText(env.FEISHU_FIELD_PHONE || '') ||
      '联系电话',
    fieldParentName:
      normalizeText(process.env.FEISHU_FIELD_PARENT_NAME || '') ||
      normalizeText(env.FEISHU_FIELD_PARENT_NAME || '') ||
      '家长姓名',
    fieldChildAge:
      normalizeText(process.env.FEISHU_FIELD_CHILD_AGE || '') ||
      normalizeText(env.FEISHU_FIELD_CHILD_AGE || '') ||
      '孩子年龄'
  }
}
const buildUuidV4 = (seed) => {
  const hex = crypto.createHash('md5').update(normalizeText(seed) || 'poster-signup').digest('hex')
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
const pickExactFieldName = (tableFields, targetName) => {
  const matched = tableFields.find((item) => item.field_name === targetName)
  return normalizeText(matched?.field_name || '')
}
const buildParentInfoText = (order) => {
  const parentName = normalizeText(order?.parentName || order?.signup?.parentName || '')
  const phone = normalizePhone(order?.phone || order?.signup?.phone || '')
  const childAge = toPositiveInteger(order?.childAge || order?.signup?.childAge)
  return [parentName, phone, childAge ? `${childAge}岁` : ''].filter(Boolean).join(' / ')
}
const buildFeishuFields = ({ config, order, tableFields }) => {
  const parentInfoField = pickExactFieldName(tableFields, config.fieldParentInfo)
  const phoneField = pickExactFieldName(tableFields, config.fieldPhone)
  const parentNameField = pickExactFieldName(tableFields, config.fieldParentName)
  const childAgeField = pickExactFieldName(tableFields, config.fieldChildAge)

  if (!parentInfoField || !phoneField || !parentNameField || !childAgeField) {
    throw new Error('飞书字段映射不完整，请检查海报报名表格列名')
  }

  const parentName = normalizeText(order?.parentName || order?.signup?.parentName || '')
  const phone = normalizePhone(order?.phone || order?.signup?.phone || '')
  const childAge = toPositiveInteger(order?.childAge || order?.signup?.childAge)
  const parentInfoText = buildParentInfoText(order)

  if (!parentInfoText || !parentName || !phone || !childAge) {
    throw new Error('订单报名信息不完整，无法同步到飞书')
  }

  return {
    [parentInfoField]: parentInfoText,
    [phoneField]: phone,
    [parentNameField]: parentName,
    [childAgeField]: childAge
  }
}
const syncPosterSignupToFeishu = async ({ config, order }) => {
  const tenantAccessToken = await getTenantAccessToken(config)
  const tableFields = await getFeishuTableFields({
    config,
    tenantAccessToken
  })
  const fields = buildFeishuFields({
    config,
    order,
    tableFields
  })

  const result = await requestJson({
    method: 'POST',
    url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(config.appToken)}/tables/${encodeURIComponent(config.tableId)}/records?client_token=${encodeURIComponent(buildUuidV4(`poster-signup:${order._id}`))}`,
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
const getOrderDoc = async (orderId, outTradeNo) => {
  if (orderId) {
    const doc = await orders.doc(orderId).get().catch(() => null)
    if (doc?.data) {
      return doc.data
    }
  }

  if (!outTradeNo) {
    return null
  }

  const res = await orders
    .where({
      outTradeNo
    })
    .limit(1)
    .get()

  return res.data?.[0] || null
}
const limitText = (value, maxLength = 120) => {
  const text = normalizeText(value)
  if (!text || text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}...`
}

exports.main = async (event) => {
  const orderId = normalizeText(event?.orderId || '')
  const outTradeNo = normalizeText(event?.outTradeNo || event?.out_trade_no || '')

  const order = await getOrderDoc(orderId, outTradeNo)
  if (!order) {
    return {
      ok: false,
      message: '未找到海报报名订单'
    }
  }

  if (order.status !== 'paid') {
    return {
      ok: false,
      skipped: true,
      message: '订单未支付，跳过飞书同步'
    }
  }

  if (order.feishuSyncStatus === 'synced' || normalizeText(order.feishuRecordId || '')) {
    return {
      ok: true,
      alreadySynced: true,
      orderId: order._id,
      recordId: normalizeText(order.feishuRecordId || ''),
      message: '海报报名已同步到飞书'
    }
  }

  const feishuConfig = resolveFeishuConfig()
  if (!feishuConfig.enabled) {
    await orders.doc(order._id).update({
      data: {
        feishuSyncStatus: 'skipped',
        feishuRecordId: '',
        feishuSyncErrorMessage: 'missing feishu config',
        feishuSyncTriedAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })

    return {
      ok: false,
      skipped: true,
      orderId: order._id,
      message: '飞书同步未启用'
    }
  }

  try {
    const feishuResult = await syncPosterSignupToFeishu({
      config: feishuConfig,
      order
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

    return {
      ok: true,
      orderId: order._id,
      recordId: feishuResult.recordId,
      message: '海报报名已同步到飞书'
    }
  } catch (err) {
    const errorMessage = limitText(err?.message || '飞书同步失败') || '飞书同步失败'

    await orders.doc(order._id).update({
      data: {
        feishuSyncStatus: 'failed',
        feishuRecordId: '',
        feishuSyncErrorMessage: errorMessage,
        feishuSyncTriedAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })

    return {
      ok: false,
      orderId: order._id,
      message: errorMessage
    }
  }
}
