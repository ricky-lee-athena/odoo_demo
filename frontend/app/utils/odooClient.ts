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
  const config = useRuntimeConfig()
  const apiKey = config.public.odooApiKey
  const baseUrl = config.public.odooBaseUrl
  const database = config.public.odooDatabase

  if (!apiKey) {
    throw new OdooClientError('Odoo API key not configured')
  }

  const url = `${baseUrl}/json/2/${model}/${method}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `bearer ${apiKey}`
  }

  // Add database header if configured (for multi-database setups)
  if (database) {
    headers['X-Odoo-Database'] = database
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new OdooClientError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      )
    }

    const data: OdooApiResponse<T> = await response.json()

    if (data.error) {
      throw new OdooClientError(
        data.error.data?.message || data.error.message,
        data.error.code,
        data.error
      )
    }

    return data.result as T
  }
  catch (error) {
    if (error instanceof OdooClientError) {
      throw error
    }
    throw new OdooClientError(
      `Failed to connect to Odoo: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
