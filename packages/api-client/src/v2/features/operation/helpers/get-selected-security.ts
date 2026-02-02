import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isAuthOptional } from '@/v2/blocks/scalar-auth-selector-block/helpers/is-auth-optional'

/**
 * Get the selected security for an operation or document,
 * Defaults to the first requirement if no selection is made and you pass in requirements
 */
export const getSelectedSecurity = (
  documentSelectedSecurity: SelectedSecurity | undefined,
  operationSelectedSecurity: SelectedSecurity | undefined,
  securityRequirements: NonNullable<OpenApiDocument['security']> = [],
  setOperationSecurity = false,
): SelectedSecurity => {
  // Operation level security
  if (setOperationSecurity) {
    if (operationSelectedSecurity) {
      return operationSelectedSecurity
    }
  }
  // Document level security
  else if (documentSelectedSecurity) {
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
