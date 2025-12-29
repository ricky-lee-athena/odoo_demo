import type { OdooApiResponse, OdooApiError } from '~/types/odoo'

export class OdooClientError extends Error {
  constructor(
    message: string,
    public code?: number,
    public odooError?: OdooApiError
  ) {
    super(message)
    this.name = 'OdooClientError'
  }
}

export async function odooRequest<T = any>(
  model: string,
  method: string,
  params: Record<string, any> = {}
): Promise<T> {
  try {
    // 呼叫 Nuxt Server API 代理（不再直接呼叫 Odoo）
    const response = await $fetch<T>('/api/odoo', {
      method: 'POST',
      body: {
        model,
        method,
        params
      }
    })

    return response
  }
  catch (error: any) {
    // 處理來自 server route 的錯誤
    if (error.statusCode) {
      throw new OdooClientError(
        error.statusMessage || error.message,
        error.statusCode,
        error.data
      )
    }

    throw new OdooClientError(
      `Failed to connect to Odoo: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
