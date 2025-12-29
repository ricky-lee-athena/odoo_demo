import type { OdooSearchReadRequest } from '~/types/odoo'

export function useOdooApi() {
  /**
   * Executes a search_read operation on an Odoo model
   */
  async function searchRead<T = any>(
    model: string,
    params: OdooSearchReadRequest = {}
  ): Promise<T[]> {
    const result = await odooRequest<T[]>(model, 'search_read', params)
    return result || []
  }

  /**
   * Fetches a single record by ID
   */
  async function read<T = any>(
    model: string,
    id: number,
    fields?: string[]
  ): Promise<T | null> {
    const params: any = { ids: [id] }
    if (fields) {
      params.fields = fields
    }

    const result = await odooRequest<T[]>(model, 'read', params)
    return result && result.length > 0 ? result[0] : null
  }

  /**
   * Searches for record IDs matching domain
   */
  async function search(
    model: string,
    domain: any[] = [],
    limit?: number,
    offset?: number
  ): Promise<number[]> {
    const params: any = { domain }
    if (limit !== undefined)
      params.limit = limit
    if (offset !== undefined)
      params.offset = offset

    return await odooRequest<number[]>(model, 'search', params)
  }

  return {
    searchRead,
    read,
    search
  }
}
