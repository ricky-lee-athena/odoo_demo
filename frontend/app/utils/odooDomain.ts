import type { OdooDomain } from '~/types/odoo'

/**
 * Builds an Odoo domain for fuzzy name search
 */
export function buildNameSearchDomain(query: string): OdooDomain {
  if (!query.trim())
    return []
  return [['name', 'ilike', query]]
}

/**
 * Builds an Odoo domain for team filtering
 */
export function buildTeamFilterDomain(teamId: number | null): OdooDomain {
  if (!teamId)
    return []
  return [['crm_team_id', '=', teamId]]
}

/**
 * Builds an Odoo domain for active status filtering
 */
export function buildActiveFilterDomain(activeStatus: boolean | null): OdooDomain {
  if (activeStatus === null)
    return []
  return [['active', '=', activeStatus]]
}

/**
 * Combines multiple domain arrays with AND logic
 */
export function combineDomains(...domains: OdooDomain[]): OdooDomain {
  const filtered = domains.filter(d => d.length > 0)
  if (filtered.length === 0)
    return []
  if (filtered.length === 1)
    return filtered[0]

  // Combine with AND: ['&', domain1, domain2, ...]
  return filtered.reduce((acc, domain) => {
    if (acc.length === 0)
      return domain
    return ['&', ...acc, ...domain] as OdooDomain
  }, [] as OdooDomain)
}
