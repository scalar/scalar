import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Default Accept header value to accept all response types. */
const DEFAULT_ACCEPT = '*/*'

/**
 * Generates a list of default headers for an OpenAPI operation and HTTP method.
 *
 * This function intelligently adds standard HTTP headers based on the request context:
 * - Content-Type: Added only if the HTTP method supports a request body and the OpenAPI operation
 *   defines a request body content type. Uses the selected content type from the operation or the
 *   first defined request body content type.
 * - Accept: Derived from the 2xx response content types in the spec (joined as a comma-separated list), falling back to a wildcard.
 * - User-Agent: Added in Electron environments (desktop app or proxy) to identify the client.
 *
 * The function respects OpenAPI operation parameters and marks headers as overridden
 * if they are explicitly defined in the operation. It also supports hiding disabled
 * headers for specific request examples using x-scalar-disable-parameters.
 *
 * @param method The HTTP method of the operation (GET, POST, etc.)
 * @param operation The OpenAPI OperationObject describing the endpoint
 * @param exampleKey The current request example key
 * @param hideDisabledHeaders If true, filters out headers marked as disabled for this example
 * @returns Array of default header objects with their values and override status
 */
export const getDefaultHeaders = ({
  method,
  operation,
  exampleName,
  hideDisabledHeaders = false,
  options = {
    isElectron: false,
    appVersion: '0.0.0',
  },
}: {
  method: HttpMethod
  operation: OperationObject
  exampleName: string
  hideDisabledHeaders?: boolean
  options?: {
    appVersion: string
    isElectron: boolean
  }
}): Record<string, string> => {
  const disabledHeaders = operation['x-scalar-disable-parameters']?.['default-headers']?.[exampleName] ?? {}
  const headers = new Headers()
  const requestBody = getResolvedRef(operation.requestBody)

  // Add Content-Type header only for methods that support a request body
  if (canMethodHaveBody(method) && requestBody) {
    const contentType =
      requestBody['x-scalar-selected-content-type']?.[exampleName] ?? Object.keys(requestBody.content ?? {})[0]

    // We never want to add a content type of 'none' or invent one when the schema defines no body.
    if (contentType && contentType !== 'none') {
      headers.set('Content-Type', contentType)
    }
  }

  // Derive Accept from the 2xx response content types so the server can pick the best match.
  const successResponseKey = Object.keys(operation.responses ?? {}).find((k) => k.startsWith('2'))
  const successResponse = successResponseKey ? getResolvedRef(operation.responses![successResponseKey]) : null
  const acceptValue = Object.keys(successResponse?.content ?? {}).join(', ') || DEFAULT_ACCEPT

  headers.set('Accept', acceptValue)

  // Add User-Agent in Electron environments for client identification
  if (options.isElectron && options.appVersion) {
    headers.set('User-Agent', `Scalar/${options.appVersion}`)
  }

  // Filter out disabled headers if requested
  if (hideDisabledHeaders) {
    return Object.fromEntries(
      Array.from(headers.entries()).filter(([headerName]) => disabledHeaders[headerName.toLowerCase()] !== true),
    )
  }

  return Object.fromEntries(headers.entries())
}
