import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'

/**
 * In-memory cache of operation example id → { response, request }.
 * Restores the last response when navigating back to an operation until
 * the user refreshes the page or makes a new request.
 */
export const responseCache = new Map<string, { response: ResponseInstance; request: Request }>()

/**
 * Constructs a unique cache key for a specific operation/example.
 * The key is composed of the HTTP method, request path, and the example key,
 * delimited by "|", e.g. "GET|/pets|123".
 *
 * @param method - HTTP method (e.g., "GET", "POST")
 * @param path - The request path (e.g., "/pets")
 * @param exampleKey - A unique key identifying the example/request variant
 * @returns The constructed cache key string
 */
export function getOperationExampleKey(method: string, path: string, exampleKey: string): string {
  return `${method}|${path}|${exampleKey}`
}

/**
 * Determines if a response is a streaming response (e.g., server-sent events).
 * Assumes streaming responses include a 'reader' property.
 *
 * @param response - The response instance to check
 * @returns True if response is streaming, otherwise false
 */
export function isStreamingResponse(response: ResponseInstance): boolean {
  return 'reader' in response
}
