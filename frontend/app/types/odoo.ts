// Odoo domain filter type: [field, operator, value]
export type OdooDomain = Array<string | number | boolean | (string | number | boolean)[]>

// JSON-2 API request structure
export interface OdooSearchReadRequest {
  domain?: OdooDomain
  fields?: string[]
  limit?: number
  offset?: number
  order?: string
  context?: Record<string, any>
}

// Generic Odoo API response
export interface OdooApiResponse<T = any> {
  jsonrpc: '2.0'
  id: number | string
  result?: T
  error?: OdooApiError
}

// Odoo API error structure
export interface OdooApiError {
  code: number
  message: string
  data?: {
    name: string
    debug: string
    message: string
    arguments: any[]
    exception_type: string
  }
}

// Search read result
export interface OdooSearchReadResult<T> {
  records: T[]
  length: number
}
