import { getSecuritySchemes } from '@scalar/api-client/v2/blocks/operation-block'
import type { MergedSecuritySchemes } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import { getSelectedSecurity } from '@scalar/api-client/v2/features/operation'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type {
  OpenApiDocument,
  SecurityRequirementObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Builds a quick cache key from the sorted object keys */
const getKey = (requirement: SecurityRequirementObject) => Object.keys(requirement).sort().join(',')

/**
 * Find the intersection between which security is selected on the document and what this operation requires
 *
 * If there is no overlap, we return the first requirement
 */
export const filterSelectedSecurity = ({
  securityRequirements = [],
  path,
  method,
  documentSlug,
  authStore,
  securitySchemes = {},
  shouldSetOperationSecurity = false,
}: {
  securityRequirements: NonNullable<OpenApiDocument['security']>
  path: string
  method: HttpMethod
  documentSlug: string
  authStore: AuthStore
  securitySchemes: MergedSecuritySchemes
  shouldSetOperationSecurity?: boolean
}): { scheme: SecuritySchemeObject; name: string }[] => {
  /** The selected security keys for the document */
  const selectedSecurity = getSelectedSecurity(
    authStore.getAuthSelectedSchemas({ type: 'operation', documentName: documentSlug, path, method }),
    authStore.getAuthSelectedSchemas({ type: 'document', documentName: documentSlug }),
  )

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

  /**
   * If we are selected security on the document,
   * we should show the first requirement of the operation to show auth is required
   */
  if (shouldSetOperationSecurity) {
    return getSecuritySchemes(securitySchemes, securityRequirements.slice(0, 1))
  }

  return []
}
