import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isElectron } from '@/libs/electron'

// eslint-disable-next-line no-undef
const APP_VERSION = PACKAGE_VERSION

/**
 * Generates a list of default headers for an OpenAPI operation and HTTP method.
 *
 * - Adds "Content-Type" if the HTTP method supports a body (e.g., POST, PUT, PATCH).
 *   -- Uses the selected content type from the operation, or defaults to "application/json".
 * - Always adds "Accept: \*\/\*".
 * - Adds "User-Agent: Scalar/{version}" in Electron environments.
 * - Respects disabled headers for the current example if `hideDisabledHeaders` is true.
 *
 * @param method The HTTP method of the operation (GET, POST, etc.)
 * @param operation The OpenAPI OperationObject describing the endpoint
 * @param exampleKey The current request example key
 * @param hideDisabledHeaders If true, hides headers marked as disabled for this example
 * @returns Array of default header objects ({ name, defaultValue })
 */
export const getdefaultHeaders = ({
  method,
  operation,
  exampleKey,
  hideDisabledHeaders = false,
}: {
  method: HttpMethod
  operation: OperationObject
  exampleKey: string
  hideDisabledHeaders?: boolean
}) => {
  // Determine any disabled default-headers for this example
  const disableParameters = operation['x-scalar-disable-parameters']?.['default-headers']?.[exampleKey] ?? {}
  const result: { name: string; defaultValue: string }[] = []

  // Only add Content-Type if the method can have a body
  if (canMethodHaveBody(method)) {
    result.push({
      name: 'Content-Type',
      defaultValue:
        getResolvedRef(operation.requestBody)?.['x-scalar-selected-content-type']?.[exampleKey] ?? 'application/json',
    })
  }

  // Always add Accept header
  result.push({
    name: 'Accept',
    defaultValue: '*/*',
  })

  // Add User-Agent if running in Electron (used by proxy and desktop app)
  if (isElectron() && APP_VERSION) {
    result.push({
      name: 'User-Agent',
      defaultValue: `Scalar/${APP_VERSION}`,
    })
  }

  // If requested, filter out headers that are disabled for this example
  if (hideDisabledHeaders) {
    return result.filter((header) => disableParameters[header.name.toLowerCase()] !== true)
  }

  return result
}
