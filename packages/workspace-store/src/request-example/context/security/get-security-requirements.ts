import type { OpenApiDocument, OperationObject } from '@scalar/types/openapi/3.1'

/**
 * Compute what the security requirements should be for a request
 *
 * If an operation has only one optional security requirement,
 * use the document security and ensure it includes an optional object.
 *
 * Otherwise we generally go operation -> document security.
 */
export const getSecurityRequirements = (
  documentSecurity: OpenApiDocument['security'],
  operationSecurity?: OperationObject['security'],
) => {
  // If the operation security is optional, use the document security and ensure it includes an optional object
  if (JSON.stringify(operationSecurity) === '[{}]' && documentSecurity?.length) {
    const documentHasOptional = Boolean(documentSecurity.find((s) => JSON.stringify(s) === '{}'))
    return documentHasOptional ? documentSecurity : [...documentSecurity, {}]
  }

  return operationSecurity ?? documentSecurity ?? []
}
