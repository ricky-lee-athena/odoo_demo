// CRM Team (from crm.team model)
export interface CrmTeam {
  id: number
  name: string
  user_id: [number, string] // [id, name] - team leader
  active: boolean
}

// Salesperson (from crm.team.member model)
export interface Salesperson {
  id: number
  name: string
  user_id: [number, string] // [id, name]
  crm_team_id: [number, string] | false // [id, team_name]
  email: string | false
  phone: string | false
  mobile: string | false
  active: boolean

  // Performance metrics
  lead_month_count: number
  lead_day_count: number

  // Assignment configuration
  assignment_max: number
  assignment_optout: boolean

  // Avatar images
  image_128: string | false // base64 encoded image
  image_1920: string | false // base64 encoded image
}

// Search/filter parameters
export interface SalespersonSearchParams {
  searchQuery?: string
  teamId?: number
  activeStatus?: boolean | null // null = all, true = active only, false = inactive only
  limit?: number
  offset?: number
}

// UI state for filters
export interface SalespersonFilters {
  searchQuery: string
  selectedTeam: number | null
  activeStatus: 'all' | 'active' | 'inactive'
}
