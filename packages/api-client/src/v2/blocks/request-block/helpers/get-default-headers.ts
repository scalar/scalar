import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isElectron } from '@/libs/electron'

// eslint-disable-next-line no-undef
const APP_VERSION = PACKAGE_VERSION

/** Default Content-Type header value for requests with a body. */
const DEFAULT_CONTENT_TYPE = 'application/json'

/** Default Accept header value to accept all response types. */
const DEFAULT_ACCEPT = '*/*'

/**
 * Represents a default header with its value and override status.
 * Used to track headers that are automatically added to requests.
 */
type DefaultHeader = {
  /** The header name (e.g., "Content-Type", "Accept"). */
  name: string
  /** The default value for this header. */
  defaultValue: string
  /** Whether this header is explicitly defined in the OpenAPI operation parameters. */
  isOverridden: boolean
}

/**
 * Creates a default header object with the override status determined by existing headers.
 *
 * @param name The header name
 * @param defaultValue The header value
 * @param existingHeaders Set of existing header names (lowercase) from the operation
 * @returns A DefaultHeader object
 */
const createDefaultHeader = (name: string, defaultValue: string, existingHeaders: Set<string>): DefaultHeader => ({
  name,
  defaultValue,
  isOverridden: existingHeaders.has(name.toLowerCase()),
})

/**
 * Generates a list of default headers for an OpenAPI operation and HTTP method.
 *
 * This function intelligently adds standard HTTP headers based on the request context:
 * - Content-Type: Added only if the HTTP method supports a request body (POST, PUT, PATCH, etc.).
 *   Uses the selected content type from the operation or defaults to "application/json".
 * - Accept: Always added with a wildcard value to accept all response types.
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
  exampleKey,
  hideDisabledHeaders = false,
}: {
  method: HttpMethod
  operation: OperationObject
  exampleKey: string
  hideDisabledHeaders?: boolean
}): DefaultHeader[] => {
  const existingHeaders = new Set(
    operation.parameters
      ?.filter((param) => getResolvedRef(param).in === 'header')
      .map((param) => getResolvedRef(param).name.toLowerCase()) ?? [],
  )

  const disabledHeaders = operation['x-scalar-disable-parameters']?.['default-headers']?.[exampleKey] ?? {}
  const headers: DefaultHeader[] = []
  const requestBody = getResolvedRef(operation.requestBody)

  // Add Content-Type header only for methods that support a request body
  if (canMethodHaveBody(method)) {
    const contentType =
      requestBody?.['x-scalar-selected-content-type']?.[exampleKey] ??
      Object.keys(requestBody?.content ?? {})[0] ??
      DEFAULT_CONTENT_TYPE

    // We never want to add a content type of 'none'
    if (contentType !== 'none') {
      headers.push(createDefaultHeader('Content-Type', contentType, existingHeaders))
    }
  }

  // Always add Accept header to indicate we accept all response types
  headers.push(createDefaultHeader('Accept', DEFAULT_ACCEPT, existingHeaders))

  // Add User-Agent in Electron environments for client identification
  if (isElectron() && APP_VERSION) {
    headers.push(createDefaultHeader('User-Agent', `Scalar/${APP_VERSION}`, existingHeaders))
  }

  // Filter out disabled headers if requested
  if (hideDisabledHeaders) {
    return headers.filter((header) => disabledHeaders[header.name.toLowerCase()] !== true)
  }

  return headers
}
