import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Context } from 'hono'
import type { UpgradeWebSocket } from 'hono/ws'

import type { MessageDirection, MockTransport } from './transports/types'

/** Available HTTP methods for Hono routes */
export const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'patch'] as const

/**
 * Represents a partial object where at least one of the given properties is required.
 */
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

/** A sink for the informational log lines the mock servers print while starting up. */
export type MockServerLogger = (line: string) => void

/** What the `onResponse` callback receives for one request. */
export type MockServerResponseHookData = {
  /** The Hono context of the request, the same one `onRequest` receives */
  context: Context
  /**
   * The OpenAPI operation that answered the request, or `undefined` when the request matched no
   * operation: the `/openapi.json` and `/openapi.yaml` exports, the authentication routes, routes
   * added to the returned app, and requests answered with `404 Not Found`.
   */
  operation: OpenAPIV3_1.OperationObject | undefined
  /**
   * The response the mock server is about to send. Its body is left unread, so a streaming response
   * (`text/event-stream`, JSON Lines) is still streaming. Reading it consumes it, so a callback that
   * reads the body has to return a replacement — `response.clone()` gives it a copy to read instead.
   */
  response: Response
}

/**
 * Observe or replace the response the OpenAPI mock server sends for a request.
 *
 * It runs once per request, after the mock server has produced its response — including
 * authentication failures, `422` request validation responses, and `500` responses from the error
 * handler. CORS preflight requests are answered before it runs, so they never reach it.
 *
 * Return a `Response` to send it instead of the mock response. The CORS headers the server adds are
 * carried over onto it, unless it sets them itself. Return nothing to keep the mock response.
 *
 * An error thrown (or a promise rejected) by the callback is answered like any other failure while
 * mocking: a `500` response naming the matched operation, which does not reach the callback again.
 */
export type MockServerResponseHook = (data: MockServerResponseHookData) => Response | void | Promise<Response | void>

type BaseMockServerOptions = {
  /** Runtime adapter for AsyncAPI WebSocket channels. It must invoke onOpen after accepting a connection. */
  upgradeWebSocket?: UpgradeWebSocket

  /** Additional AsyncAPI transports, tried after the built-in WebSocket and SSE transports. */
  transports?: MockTransport[]

  /** Observe messages flowing through AsyncAPI channels. */
  onMessage?: (event: { channel: string; direction: MessageDirection; payload: unknown }) => void

  /** Source file path or URL used to resolve relative references in an already loaded document. */
  origin?: string

  /**
   * The OpenAPI or AsyncAPI document to use for mocking.
   * Can be an object, inline JSON/YAML, a URL, or a file path.
   *
   * @deprecated Use `document` instead
   */
  specification?: string | Record<string, any>

  /**
   * The OpenAPI or AsyncAPI document to use for mocking.
   * Can be an object, inline JSON/YAML, a URL, or a file path.
   */
  document?: string | Record<string, any>

  /**
   * Callback function called before each OpenAPI request is processed.
   */
  onRequest?: (data: { context: Context; operation: OpenAPIV3_1.OperationObject }) => void

  /**
   * Callback function called once per OpenAPI request, after the mock server has produced its
   * response and before it is sent. Return a `Response` (or a promise of one) to send that instead,
   * or nothing to keep the mock response.
   *
   * See {@link MockServerResponseHook} for what reaches it.
   */
  onResponse?: MockServerResponseHook

  /**
   * Validate the incoming OpenAPI request against the matched operation's schema. When the request
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
   * Control the informational output the server prints while starting up, which is currently the
   * authentication instructions for OpenAPI and transport lifecycle lines for AsyncAPI.
   * Defaults to console logging for OpenAPI and silence for AsyncAPI.
   *
   * Pass `false` to silence it — handy when the mock server runs inside a test harness or another
   * program, where the instructions are noise — or a `(line) => void` sink to route the lines
   * somewhere other than the console.
   *
   * Diagnostics are not affected: warnings and errors about security schemes the mock server cannot
   * handle, request validator compilation errors, and `x-seed` errors are printed either way.
   */
  logger?: boolean | MockServerLogger
}

export type MockServerOptions = RequireAtLeastOne<BaseMockServerOptions, 'specification' | 'document'>
