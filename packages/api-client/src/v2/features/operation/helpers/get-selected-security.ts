import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isAuthOptional } from '@/v2/blocks/scalar-auth-selector-block/helpers/is-auth-optional'

/**
 * Resolves which security selection to use for an operation.
 * Priority: operation-level selection, then document-level selection, then a default.
 * When neither level has a selection, returns the first security requirement unless
 * authentication is optional or there are no requirements, in which case returns no selection.
 */
export const getSelectedSecurity = (
  documentSelectedSecurity: SelectedSecurity | undefined,
  operationSelectedSecurity: SelectedSecurity | undefined,
  securityRequirements: NonNullable<OpenApiDocument['security']> = [],
): SelectedSecurity => {
  // Operation level security
  if (operationSelectedSecurity) {
    return operationSelectedSecurity
  }
  // Document level security
  if (documentSelectedSecurity) {
    return documentSelectedSecurity
  }

  const isOptional = isAuthOptional(securityRequirements)
  const firstRequirement = securityRequirements[0]

  // No need to default if auth is optional
  if (isOptional || !firstRequirement) {
    return {
      selectedIndex: -1,
      selectedSchemes: [],
    }
  }

  // Default to the first requirement
  return {
    selectedIndex: 0,
    selectedSchemes: [firstRequirement],
  }
}
