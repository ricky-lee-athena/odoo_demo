export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // 從請求中取得 model 和 method
  const { model, method, params } = body

  if (!model || !method) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing model or method'
    })
  }

  const apiKey = config.odooApiKey
  const baseUrl = config.public.odooBaseUrl
  const database = config.public.odooDatabase

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Odoo API key not configured on server'
    })
  }

  // 建構 Odoo API URL
  const url = `${baseUrl}/json/2/${model}/${method}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `bearer ${apiKey}`
  }

  // 加入資料庫標頭（如果有配置）
  if (database) {
    headers['X-Odoo-Database'] = database
  }

  try {
    // 代理請求到 Odoo
    const response = await $fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params || {})
    })

    return response
  }
  catch (error: any) {
    // 處理錯誤並傳回給客戶端
    console.error('Odoo API Error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to connect to Odoo',
      data: error.data
    })
  }
})
