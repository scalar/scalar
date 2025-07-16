import type { Collection, SecurityScheme } from '@scalar/oas-utils/entities/spec'
import { isDefined } from '@scalar/oas-utils/helpers'

/**
 * Takes in selected security and filters it with the requirements
 */
export const filterSecurityRequirements = (
  securityRequirements: Collection['security'],
  selectedSecuritySchemeUids: Collection['selectedSecuritySchemeUids'] = [],
  securitySchemes: Record<string, SecurityScheme> = {},
): SecurityScheme[] => {
  // Create a Set of required security combinations for O(1) lookup
  const requiredCombinations = new Set(
    securityRequirements?.map((requirement) => Object.keys(requirement).sort().join(',')) ?? [],
  )

  // Process all schemes in a single pass
  return selectedSecuritySchemeUids.reduce<SecurityScheme[]>((acc, uids) => {
    // Handle both single uid and array of uids
    const schemeUids = Array.isArray(uids) ? uids : [uids]
    const key = schemeUids
      .map((scheme) => securitySchemes[scheme]?.nameKey)
      .sort()
      .join(',')

    // Only add schemes if their combination is required
    if (requiredCombinations.has(key)) {
      acc.push(...schemeUids.map((scheme) => securitySchemes[scheme]).filter(isDefined))
    }

    return acc
  }, [])
}
