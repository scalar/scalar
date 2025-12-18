import type { OpenApiDocument, OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isAuthOptional } from '@/v2/blocks/scalar-auth-selector-block/helpers/is-auth-optional'

/** Get the selected security for an operation or document, with defaults to the requirements */
export const getSelectedSecurity = (
  document: OpenApiDocument | null,
  operation: OperationObject | null,
  securityRequirements: NonNullable<OpenApiDocument['security']>,
) => {
  const firstRequirement = securityRequirements[0]

  // Operation level security
  if (document?.['x-scalar-set-operation-security']) {
    if (operation?.['x-scalar-selected-security']) {
      return operation?.['x-scalar-selected-security']
    }
  }
  // Document level security
  else if (document?.['x-scalar-selected-security']) {
    return document?.['x-scalar-selected-security']
  }

  // No need to default if auth is optional
  const isOptional = isAuthOptional(securityRequirements)
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
