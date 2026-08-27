import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Context } from 'hono'

/** Available HTTP methods for Hono routes */
export const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'patch'] as const

/** Valid HTTP method */
export type HttpMethod = (typeof httpMethods)[number]

/**
 * Represents a partial object where at least one of the given properties is required.
 */
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

type BaseMockServerOptions = {
  /**
   * The OpenAPI document to use for mocking.
   * Can be a string (URL or file path) or an object.
   *
   * @deprecated Use `document` instead
   */
  specification?: string | Record<string, any>

  /**
   * The OpenAPI document to use for mocking.
   * Can be a string (URL or file path) or an object.
   */
  document?: string | Record<string, any>

  /**
   * Callback function to be called before each request is processed.
   */
  onRequest?: (data: { context: Context; operation: OpenAPIV3_1.OperationObject }) => void

  /**
   * Validate the incoming request against the matched operation's schema. When the request
   * violates the contract, the server responds with `422` and a `application/problem+json`
   * body describing the violations, instead of returning a mock response.
   *
   * Validates path/query parameters and the `application/json` request body.
   *
   * @default true
   *
   * Enabled by default for Prism-style contract enforcement. Set to `false` to opt out and
   * always return a mock response regardless of whether the request matches the contract.
   */
  validateRequest?: boolean

  /**
   * Suppress the informational output the server prints while starting up, which is currently the
   * authentication instructions for the security schemes of the document.
   *
   * Diagnostics are not affected: warnings and errors about security schemes the mock server cannot handle,
   * request validator compilation errors, and `x-seed` errors are printed either way.
   *
   * @default false
   *
   * The instructions are helpful in a terminal, but they are noise when the mock server runs inside
   * a test harness or another program. Set this to `true` to keep them out of the output without
   * having to replace the global console.
   */
  quiet?: boolean
}

export type MockServerOptions = RequireAtLeastOne<BaseMockServerOptions, 'specification' | 'document'>
