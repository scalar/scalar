import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Request as HarRequest } from 'har-format'
import type { SecuritySchemeObjectSecret } from '@/temp/helpers/secret-types'
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
export declare const operationToHar: ({
  includeDefaultHeaders,
  operation,
  contentType,
  method,
  path,
  server,
  example,
  securitySchemes,
  globalCookies,
}: OperationToHarProps) => HarRequest
//# sourceMappingURL=operation-to-har.d.ts.map
