import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
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
 * Generates a list of default headers for an OpenAPI operation and HTTP method.
 *
 * This function intelligently adds standard HTTP headers based on the request context:
 * - Content-Type: Added only if the HTTP method supports a request body (POST, PUT, PATCH, etc.).
 *   Uses the selected content type from the operation or defaults to "application/json".
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
export declare const getDefaultHeaders: ({
  method,
  operation,
  exampleKey,
  hideDisabledHeaders,
}: {
  method: HttpMethod
  operation: OperationObject
  exampleKey: string
  hideDisabledHeaders?: boolean
}) => DefaultHeader[]
export {}
//# sourceMappingURL=get-default-headers.d.ts.map
