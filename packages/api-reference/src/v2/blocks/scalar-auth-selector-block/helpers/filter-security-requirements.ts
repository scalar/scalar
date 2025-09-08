import type { Collection, SecurityScheme } from '@scalar/oas-utils/entities/spec'

/**
 * Takes in selected security and filters it with the requirements
 */
export const filterSecurityRequirements = (
  securityRequirements: Collection['security'],
  selectedSecuritySchemeUids: Collection['selectedSecuritySchemeUids'] = [],
  securitySchemes: Record<string, SecurityScheme> = {},
): SecurityScheme[] => {
  // Return empty array if no security requirements exist
  if (!securityRequirements || securityRequirements.length === 0) {
    return []
  }

  // Filter out optional security requirements (empty objects)
  const nonOptionalRequirements = securityRequirements.filter((requirement) => Object.keys(requirement).length > 0)

  // Return empty array if only optional security requirements exist
  if (nonOptionalRequirements.length === 0) {
    return []
  }

  // If no security schemes are selected, return the first available security scheme
  if (selectedSecuritySchemeUids.length === 0) {
    const firstRequirement = nonOptionalRequirements[0]
    const firstSchemeNameKey = firstRequirement ? Object.keys(firstRequirement)[0] : undefined

    // Find the security scheme that matches the first requirement
    const matchingScheme = Object.values(securitySchemes).find((scheme) => scheme.nameKey === firstSchemeNameKey)

    return matchingScheme ? [matchingScheme] : []
  }

  // Create a Set of required security combinations for fast lookup
  const requiredCombinations = new Set(
    nonOptionalRequirements.map((requirement) => Object.keys(requirement).sort().join(',')),
  )

  const result: SecurityScheme[] = []

  for (const uids of selectedSecuritySchemeUids) {
    // Handle both single uid and array of uids
    const schemeUids = Array.isArray(uids) ? uids : [uids]

    // Get valid schemes and their name keys in one pass
    const validSchemes: SecurityScheme[] = []
    const nameKeys: string[] = []

    for (const uid of schemeUids) {
      const scheme = securitySchemes[uid]
      if (scheme?.nameKey) {
        validSchemes.push(scheme)
        nameKeys.push(scheme.nameKey)
      }
    }

    // Check if this combination is required
    if (nameKeys.length > 0) {
      const key = nameKeys.sort().join(',')
      if (requiredCombinations.has(key)) {
        result.push(...validSchemes)
      }
    }
  }

  return result
}
