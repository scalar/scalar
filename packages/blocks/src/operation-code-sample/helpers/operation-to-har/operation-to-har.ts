import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Request as HarRequest } from 'har-format'

import { filterGlobalCookie } from '@/v2/blocks/operation-block/helpers/filter-global-cookies'
import { getDefaultHeaders } from '@/v2/blocks/request-block/helpers/get-default-headers'
import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

import { processBody } from './process-body'
import { processParameters } from './process-parameters'
import { processSecuritySchemes } from './process-security-schemes'
import { processServerUrl } from './process-server-url'

export type OperationToHarProps = {
  /** OpenAPI Operation object */
  operation: OperationObject
  /** HTTP method of the operation */
  method: HttpMethod
  /** Path of the operation */
  path: string
  /**
   * Name of the currently selected operation example
   *
   * Applies to both the body and the parameters
   */
  example?: string
  /**
   * Content type of the operation
   *
   * Applies to both the body and the parameters (if applicable)
   * @defaults to the first content type in the MediaTypeObject
   */
  contentType?: string
  /** OpenAPI Server object */
  server?: ServerObject | null
  /** OpenAPI SecurityScheme objects which are applicable to the operation */
  securitySchemes?: SecuritySchemeObjectSecret[]
  /** Workspace + document cookies */
  globalCookies?: XScalarCookie[]
  /**
   * Whether to include default headers (e.g., Accept, Content-Type) automatically.
   * If false, default headers will be omitted from the HAR request.
   * @default true
   */
  includeDefaultHeaders?: boolean
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
  includeDefaultHeaders = false,
  operation,
  contentType,
  method,
  path,
  server = null,
  example,
  securitySchemes,
  globalCookies,
}: OperationToHarProps): HarRequest => {
  const defaultHeaders = includeDefaultHeaders
    ? getDefaultHeaders({
        method,
        operation,
        exampleKey: example ?? 'default',
        hideDisabledHeaders: true,
      }).filter((header) => !header.isOverridden)
    : []

  const disabledGlobalCookies =
    operation['x-scalar-disable-parameters']?.['global-cookies']?.[example ?? 'default'] ?? {}

  const serverUrl = processServerUrl(server, path)

  // Initialize the HAR request with basic properties
  const harRequest: HarRequest = {
    method,
    url: serverUrl,
    headers: defaultHeaders.map((header) => ({ name: header.name, value: header.defaultValue })),
    queryString: [],
    postData: undefined,
    httpVersion: 'HTTP/1.1',
    cookies: [],
    headersSize: -1,
    bodySize: -1,
  }

  // Handle parameters
  if (operation.parameters) {
    const { url, headers, queryString, cookies } = processParameters({
      harRequest,
      parameters: operation.parameters,
      example,
    })

    // Correctly filter the global cookies by the processed url
    const filteredGlobalCookies =
      globalCookies
        ?.filter((cookie) => filterGlobalCookie({ cookie, url, disabledGlobalCookies }))
        ?.map((cookie) => ({ name: cookie.name, value: cookie.value })) ?? []

    harRequest.url = url
    harRequest.headers = headers
    harRequest.queryString = queryString
    harRequest.cookies = [...filteredGlobalCookies, ...cookies]
  }

  const body = getResolvedRef(operation.requestBody)

  // Handle request body
  if (body?.content) {
    const postData = processBody({ requestBody: body, contentType, example })

    if (postData) {
      harRequest.postData = postData
      harRequest.bodySize = postData.text?.length ?? -1

      // Add or update Content-Type header
      if (postData.mimeType) {
        const existingContentTypeHeader = harRequest.headers.find(
          (header) => header.name.toLowerCase() === 'content-type',
        )
        // Update existing header if it has an empty value
        if (existingContentTypeHeader && !existingContentTypeHeader.value) {
          existingContentTypeHeader.value = postData.mimeType
        }
        // Add new header if none exists
        else if (!existingContentTypeHeader) {
          harRequest.headers.push({
            name: 'Content-Type',
            value: postData.mimeType,
          })
        }
      }
    }
  }

  // Handle security schemes
  if (securitySchemes) {
    const { headers, queryString, cookies } = processSecuritySchemes(securitySchemes)
    harRequest.headers.push(...headers)
    harRequest.queryString.push(...queryString)
    harRequest.cookies.push(...cookies)
  }

  // Calculate headers size without allocating a large joined string
  let headersSize = 0
  for (const h of harRequest.headers) {
    // name + ": " + value + "\r\n"
    headersSize += (h.name?.length ?? 0) + 2 + (h.value?.length ?? 0) + 2
  }
  harRequest.headersSize = headersSize

  return harRequest
}
