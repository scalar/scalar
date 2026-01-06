import { getSecuritySchemes } from '@scalar/api-client/v2/blocks/operation-block'
import type { MergedSecuritySchemes } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import { getSelectedSecurity } from '@scalar/api-client/v2/features/operation'
import type {
  OpenApiDocument,
  OperationObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Builds a quick cache key from the sorted object keys */
const getKey = (requirement: SecurityRequirementObject) => Object.keys(requirement).sort().join(',')

/**
 * Find the intersection between which security is selected on the document and what this operation requires
 */
export const filterSelectedSecurity = (
  document: OpenApiDocument,
  operation: OperationObject | null,
  securitySchemes: MergedSecuritySchemes = {},
): SecuritySchemeObject[] => {
  const securityRequirements = operation?.security ?? document.security ?? []

  /** The selected security keys for the document */
  const selectedSecurity = getSelectedSecurity(
    document?.['x-scalar-selected-security'],
    operation?.['x-scalar-selected-security'],
  )

  if (!securityRequirements.length || !selectedSecurity.selectedSchemes.length) {
    return []
  }

  /** Build a set for O(1) lookup */
  const requirementSet = new Set(securityRequirements.map((r) => getKey(r)))

  // Lets check the selectedIndex first
  const selectedRequirement = selectedSecurity.selectedSchemes[selectedSecurity.selectedIndex]
  if (selectedRequirement && requirementSet.has(getKey(selectedRequirement))) {
    return getSecuritySchemes(securitySchemes, [selectedRequirement])
  }

  // Otherwise lets loop over all selected
  for (const selected of selectedSecurity.selectedSchemes) {
    if (requirementSet.has(getKey(selected))) {
      return getSecuritySchemes(securitySchemes, [selected])
    }
  }

  return []
}
