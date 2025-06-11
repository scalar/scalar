import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { HarRequest } from '@scalar/snippetz'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import { processServerUrl } from './process-server-url'
import { processParameters } from './process-parameters'

type Props = {
  /** OpenAPI Operation object */
  operation: OpenAPIV3_1.OperationObject
  /** HTTP method of the operation */
  method: HttpMethod
  /**
   * Content type of the request
   *
   * @defaults to the first content type in the operation.requestBody.content
   */
  contentType?: string
  /** Path of the operation */
  path: string
  /** OpenAPI Server object */
  server?: OpenAPIV3_1.ServerObject
  /** OpenAPI SecurityScheme objects */
  securitySchemes?: OpenAPIV3_1.SecuritySchemeObject[]
  /** requestBody.example to use for the request */
  example?: unknown
}

/**
 * Converts an OpenAPI Operation to a HarRequest so we can create a snippet for it using the snippetz package
 *
 * @see https://w3c.github.io/web-performance/specs/HAR/Overview.html
 * */
export const operationToHar = ({
  operation,
  contentType,
  method,
  path,
  server,
  securitySchemes,
  example,
}: Props): HarRequest => {
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
    const { url, headers, queryString } = processParameters(harRequest, operation.parameters, example)
    harRequest.url = url
    harRequest.headers = headers
    harRequest.queryString = queryString
  }

  // Handle request body
  if (operation.requestBody?.content && example) {
    const _contentType = contentType || Object.keys(operation.requestBody.content)[0]

    const text = JSON.stringify(example)
    harRequest.postData = {
      mimeType: _contentType,
      text,
    }

    // Update body size
    harRequest.bodySize = text.length
  }

  // Handle security schemes
  // if (securitySchemes) {
  //   for (const scheme of securitySchemes) {
  //     if (scheme.type === 'apiKey' && scheme.name) {
  //     }
  //   }
  // }

  // Calculate headers size
  const headerText = harRequest.headers.map((h) => `${h.name}: ${h.value}`).join('\r\n')
  harRequest.headersSize = headerText.length

  return harRequest
}
