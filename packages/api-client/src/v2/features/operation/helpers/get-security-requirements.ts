import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

/**
 * Compute what the security requirements should be for a request
 *
 * If an operation has only one optional security requirement,
 * use the document security and ensure it includes an optional object.
 *
 * Otherwise we generally go operation -> document security.
 */
export const getSecurityRequirements = (document: OpenApiDocument | null, operation?: OperationObject) => {
  if (!document) {
    return []
  }

  // If the operation security is optional, use the document security and ensure it includes an optional object
  if (JSON.stringify(operation?.security) === '[{}]' && document.security?.length) {
    const documentHasOptional = Boolean(document.security.find((s) => JSON.stringify(s) === '{}'))
    return documentHasOptional ? document.security : [...document.security, {}]
  }

  return operation?.security ?? document.security ?? []
}
