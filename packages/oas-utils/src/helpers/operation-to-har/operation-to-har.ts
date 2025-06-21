import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Request as HarRequest } from 'har-format'

import { processServerUrl } from './process-server-url'
import { processParameters } from './process-parameters'
import { processBody } from './process-body'
import { processSecuritySchemes } from './process-security-schemes'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import { isReference, type Dereference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'

export type OperationToHarProps = {
  /** OpenAPI Operation object */
  operation: Dereference<OperationObject>
  /** HTTP method of the operation */
  method: HttpMethod
  /** Path of the operation */
  path: string
  /**
   * requestBody.content[contentType].example to use for the request, it should be pre-selected and discriminated
   */
  example?: unknown
  /**
   * Content type of the request
   *
   * @defaults to the first content type in the operation.requestBody.content
   */
  contentType?: string
  /** OpenAPI Server object */
  server?: ServerObject | undefined
  /** OpenAPI SecurityScheme objects which are applicable to the operation */
  securitySchemes?: SecuritySchemeObject[]
}

/**
 * Converts an OpenAPI Operation to a HarRequest format for generating HTTP request snippets.
 *
 * This function transforms OpenAPI 3.1 operation objects into HAR (HTTP Archive) format requests,
 * which can be used to generate code snippets for various programming languages and HTTP clients.
 *
 * The conversion handles:
 * - Server URL processing and path parameter substitution
 * - Query parameter formatting based on OpenAPI parameter styles
 * - Request body processing with content type handling
 * - Security scheme integration (API keys, etc.)
 *
 * The resulting HarRequest object follows the HAR specification and includes:
 * - HTTP method and URL
 * - Headers and query parameters
 * - Request body (if present)
 * - Cookie information
 * - Size calculations for headers and body
 *
 * @see https://w3c.github.io/web-performance/specs/HAR/Overview.html
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 */
export const operationToHar = ({
  operation,
  contentType,
  method,
  path,
  server,
  securitySchemes,
  example,
}: OperationToHarProps): HarRequest => {
  // Initialize the HAR request with basic properties
  const harRequest: HarRequest = {
    method,
    url: path,
    headers: [],
    queryString: [],
    postData: undefined,
    httpVersion: 'HTTP/1.1',
    cookies: [],
    headersSize: -1,
    bodySize: -1,
  }

  // Server URL
  if (server?.url) {
    harRequest.url = processServerUrl(server, path)
  }

  // Handle parameters
  if (operation.parameters) {
    const { url, headers, queryString, cookies } = processParameters(harRequest, operation.parameters, example)
    harRequest.url = url
    harRequest.headers = headers
    harRequest.queryString = queryString
    harRequest.cookies = cookies
  }

  // Handle request body
  if (!isReference(operation.requestBody) && operation.requestBody?.content) {
    const postData = processBody({ operation, contentType, example })
    harRequest.postData = postData
    harRequest.bodySize = postData.text?.length ?? -1

    // Add Content-Type header if not already present
    if (postData.mimeType && !harRequest.headers.some((header) => header.name.toLowerCase() === 'content-type')) {
      harRequest.headers.push({
        name: 'Content-Type',
        value: postData.mimeType,
      })
    }
  }

  // Handle security schemes
  if (securitySchemes) {
    const { headers, queryString, cookies } = processSecuritySchemes(securitySchemes)
    harRequest.headers.push(...headers)
    harRequest.queryString.push(...queryString)
    harRequest.cookies.push(...cookies)
  }

  // Calculate headers size
  const headerText = harRequest.headers.map((h) => `${h.name}: ${h.value}`).join('\r\n')
  harRequest.headersSize = headerText.length

  return harRequest
}
