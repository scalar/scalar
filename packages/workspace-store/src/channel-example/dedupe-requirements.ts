import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'

/**
 * Remove duplicate security requirements, comparing by their JSON shape.
 *
 * Shared by the channel-connection and document-wide requirement builders, which both union
 * requirements from several sources (servers, operations) and need to collapse identical entries.
 */
export const dedupeRequirements = (requirements: SecurityRequirementObject[]): SecurityRequirementObject[] => {
  const seen = new Set<string>()

  return requirements.filter((requirement) => {
    const key = JSON.stringify(requirement)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
