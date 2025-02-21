import type { OpenAPI } from '@scalar/openapi-types'
import type { Context } from 'hono'

/** Available HTTP methods for Hono routes */
export const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'patch'] as const

/** Valid HTTP method */
export type HttpMethod = (typeof httpMethods)[number]

export type MockServerOptions = {
  /**
   * The OpenAPI specification to use for mocking.
   * Can be a string (URL or file path) or an object.
   */
  specification: string | Record<string, any>

  /**
   * Callback function to be called before each request is processed.
   */
  onRequest?: (data: { context: Context; operation: OpenAPI.Operation }) => void
}
