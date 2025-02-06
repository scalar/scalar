import type {
  Collection,
  SecurityScheme,
} from '@scalar/oas-utils/entities/spec'

/**
 * Takes in selected security and filters it with the requirements
 *
 * TODOPERF: Pass in a dictionary to reduce the number of loops
 */
export const filterSecurityRequirements = (
  securityRequirements: Collection['security'],
  selectedSecuritySchemeUids: string[] = [],
  securitySchemes: Record<string, SecurityScheme> = {},
): SecurityScheme[] => {
  // We join the arrays with a comma to make it easier to compare
  const flatNames = securityRequirements.map((requirement) =>
    Object.keys(requirement).join(','),
  )

  // Return a list of security schemes which are in the requirements
  const selectedSecurityNames = selectedSecuritySchemeUids.flatMap((uids) => {
    const key = Array.isArray(uids)
      ? uids.map((scheme) => securitySchemes[scheme].nameKey).join(',')
      : securitySchemes[uids].nameKey

    return flatNames.includes(key) ? [securitySchemes[uids]] : []
  })

  return selectedSecurityNames
}
