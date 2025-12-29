import type { Salesperson, SalespersonSearchParams, CrmTeam } from '~/types/salesperson'
import type { OdooDomain } from '~/types/odoo'
import { OdooClientError } from '~/utils/odooClient'

export function useSalespersons() {
  const { searchRead } = useOdooApi()

  // Reactive state
  const salespersons = ref<Salesperson[]>([])
  const teams = ref<CrmTeam[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fields to fetch from crm.team.member
  const SALESPERSON_FIELDS = [
    'id',
    'name',
    'user_id',
    'crm_team_id',
    'email',
    'phone',
    'active',
    'image_128',
    'image_1920'
  ]

  // Fields to fetch from crm.team
  const TEAM_FIELDS = ['id', 'name', 'user_id', 'active']

  /**
   * Fetches salespersons with search/filter parameters
   */
  async function fetchSalespersons(params: SalespersonSearchParams = {}) {
    loading.value = true
    error.value = null

    try {
      // Build domain filters
      const domains: OdooDomain[] = []

      if (params.searchQuery) {
        domains.push(buildNameSearchDomain(params.searchQuery))
      }

      if (params.teamId) {
        domains.push(buildTeamFilterDomain(params.teamId))
      }

      if (params.activeStatus !== null && params.activeStatus !== undefined) {
        domains.push(buildActiveFilterDomain(params.activeStatus))
      }

      const domain = combineDomains(...domains)

      // Execute search_read
      const result = await searchRead<Salesperson>('crm.team.member', {
        domain,
        fields: SALESPERSON_FIELDS,
        limit: params.limit || 100,
        offset: params.offset || 0,
        order: 'id ASC'  // 使用 id 排序（或移除 order 參數）
      })

      salespersons.value = result
      return result
    }
    catch (e) {
      if (e instanceof OdooClientError) {
        // Handle specific Odoo errors
        switch (e.code) {
          case 401:
            error.value = 'Authentication failed. Please check your API key in .env file.'
            break
          case 403:
            error.value = 'Access denied. Your Odoo user may not have permission to view salespersons.'
            break
          case 404:
            error.value = 'Odoo endpoint not found. Please verify your Odoo server is running.'
            break
          default:
            error.value = e.message
        }
      }
      else {
        error.value = 'An unexpected error occurred. Please try again.'
      }
      console.error('Error fetching salespersons:', e)
      throw e
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetches all active sales teams for filter dropdown
   */
  async function fetchTeams() {
    try {
      const result = await searchRead<CrmTeam>('crm.team', {
        domain: [['active', '=', true]],
        fields: TEAM_FIELDS,
        order: 'name ASC'
      })

      teams.value = result
      return result
    }
    catch (e) {
      console.error('Error fetching teams:', e)
      throw e
    }
  }

  /**
   * Helper to get avatar URL from base64 image data
   */
  function getAvatarUrl(salesperson: Salesperson): string | null {
    const imageData = salesperson.image_128 || salesperson.image_1920
    if (!imageData)
      return null
    return `data:image/png;base64,${imageData}`
  }

  return {
    // State
    salespersons: readonly(salespersons),
    teams: readonly(teams),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    fetchSalespersons,
    fetchTeams,
    getAvatarUrl
  }
}
