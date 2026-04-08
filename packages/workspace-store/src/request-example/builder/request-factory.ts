import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import { replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import { getServerVariables } from '@/request-example/builder/helpers/get-server-variables'
import {
  type BuildRequestSecurityResult,
  buildRequestSecurity,
} from '@/request-example/builder/security/build-request-security'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import type { RequestExampleMeta } from '@/request-example/types'

import { type RequestBody, buildRequestBody } from './body/build-request-body'
import { buildRequestParameters } from './header/build-request-parameters'

/**
 * RequestFactory
 *
 * Describes the structure of a pre-built request "preview" object for an OpenAPI operation example.
 * This object contains all information about the request input state as currently assembled in the
 * UI or builder, ready to be displayed, edited, or further processed to produce an actual HTTP request.
 *
 * ---
 *
 * ⚠️ EXPERIMENTAL API
 *
 * This type is experimental and may have breaking changes in future releases.
 * Use at your own risk when building custom request handling logic.
 *
 * ---
 *
 * ⚠️ NOTE: Values in this object are NOT environment substituted yet.
 * This type carries raw, user-input or schema-derived values; variable and environment expansion
 * (e.g., turning `/users/{userId}` into `/users/1234`) has NOT been performed at this stage.
 * This allows environment switching and request previews to remain dynamic until just before send.
 *
 * All fields are designed to preserve editable state and display metadata.
 *
 * ---
 *
 * ## Usage
 *
 * You can use the `RequestFactory` object to modify the request before it is sent by the browser.
 * This is useful for custom authentication schemes, request transformations, or debugging.
 *
 * ### Disabling default security handling
 *
 * To apply custom security logic (e.g., custom token prefixes), disable the built-in security handling:
 *
 * ```ts
 * factory.options = { ...factory.options, disableSecurity: true }
 * ```
 *
 * ### Adding a custom prefix to bearer tokens
 *
 * After disabling security, you can iterate over security schemes and apply custom formatting:
 *
 * ```ts
 * factory.options = { ...factory.options, disableSecurity: true }
 *
 * for (const security of factory.security) {
 *   if (security.in === 'header' && security.format === 'bearer') {
 *     factory.headers.set(security.name, `Bearer CustomPrefix-${security.value}`)
 *   }
 * }
 * ```
 *
 * ### Modifying headers
 *
 * ```ts
 * factory.headers.set('X-Custom-Header', 'my-value')
 * factory.headers.delete('User-Agent')
 * ```
 *
 * ### Modifying query parameters
 *
 * ```ts
 * factory.query.set('debug', 'true')
 * factory.query.append('tags', 'foo')
 * ```
 */
export type RequestFactory = {
  /**
   * The base API server URL prior to environment or server variable substitution.
   * May still contain placeholders such as `{version}` or `{region}`.
   *
   * Example: "https://api.example.com/{version}"
   */
  baseUrl: string

  /**
   * Path-related properties for the request.
   */
  path: {
    /**
     * The variable names and their (unsubstituted) values for all path variables required in this operation.
     * These may still reference environment variables or placeholders if unresolved.
     *
     * Example: { "userId": "{env.USER_ID}" }
     */
    variables: Record<string, string>
    /**
     * The raw request path string, as entered by the user or read from the OpenAPI schema.
     * Placeholders are not yet substituted.
     *
     * Example: "/users/{userId}/settings"
     */
    raw: string
  }

  /**
   * The HTTP method to be used for the request (always uppercase).
   *
   * Example: "POST"
   */
  method: string

  /**
   * The current proxy URL source to use for this request. If used, this typically means the request
   * will be routed through a local dev proxy to support features such as cookie management, CORS, or special
   * authentication.
   * This value is unsubstituted and may reflect environment-driven data.
   */
  proxyUrl: string

  /**
   * The raw, (unsubstituted) query parameters for this request, including all from spec and user input.
   * The actual query string is assembled later, after variable and environment expansion.
   */
  query: URLSearchParams

  /**
   * Headers to be sent with this request, combining spec-provided defaults, user overrides,
   * and (potentially) security-related fields. All header values are unsubstituted at this stage.
   */
  headers: Headers

  /**
   * The body payload for the request, or null if not applicable.
   * This supports all body representations specified by OpenAPI (JSON, form, file, etc).
   * Body values are raw and not environment resolved.
   */
  body: RequestBody | null

  /**
   * The cookies to apply with this request.
   * This array may contain both global cookies and operation-specific cookies.
   * Values are still unsubstituted -- environment/template variables may be present.
   */
  cookies: XScalarCookie[]

  /**
   * The cache mode ("default", "reload", etc) to use for this request.
   * Passed to the fetch client or adapter.
   */
  cache: RequestCache

  /**
   * List of all security requirements for this request (e.g., API key, OAuth2, etc.)
   * Each entry reflects a selected Security Scheme.
   * Values (e.g., tokens, secrets) may still be unsubstituted at this point.
   */
  security: BuildRequestSecurityResult[]

  /**
   * (optional) A set of query parameter keys that should be preserved as-is for reserved/transparent passthrough.
   * This permits special cases where parameters (such as those starting with "_") are not to be validated or rewritten.
   */
  allowedReservedQueryParameters?: Set<string>

  /**
   * (optional) Advanced request options flag object.
   * These options allow downstream handling to detect and apply additional request context such as runtime type or custom security handling.
   */
  options?: Partial<{
    /**
     * If true, the request will be made in an Electron context (node-like).
     * This alters certain behaviors, such as file handling or header management.
     */
    isElectron: boolean
    /**
     * If true, disables request builder security handling (headers, cookies, etc) in favor of custom logic.
     * Used in cases where the consumer wants to inject security information themselves, possibly with extra prefixes or formatting.
     */
    disableSecurity: boolean
  }>
}

/**
 * Builds a request object fastory which can be used to build a request object.
 * @returns A request object factory
 */
export const requestFactory = ({
  exampleName,
  globalCookies,
  method,
  operation,
  path,
  proxyUrl,
  server,
  defaultHeaders,
  isElectron,
  selectedSecuritySchemes,
  requestBodyCompositionSelection,
}: RequestExampleMeta & {
  /** The operation object */
  operation: OperationObject
  /** For environment variables in the inputs */
  environment: XScalarEnvironment
  /** Workspace + document cookies */
  globalCookies: XScalarCookie[]
  /** The proxy URL for cookie domain determination */
  proxyUrl: string
  /** The server object */
  server: ServerObject | null
  /** Default headers */
  defaultHeaders: Record<string, string>
  /** Whether the request is being made from an Electron environment */
  isElectron: boolean
  /** The selected security schemes for the current operation */
  selectedSecuritySchemes: SecuritySchemeObjectSecret[]
  /** Selected anyOf/oneOf request-body variants keyed by schema path */
  requestBodyCompositionSelection?: Record<string, number>
}): {
  request: RequestFactory
} => {
  const requestBody = getResolvedRef(operation.requestBody)

  /** Build out the request parameters */
  const params = buildRequestParameters(operation.parameters ?? [], exampleName)
  const security = buildRequestSecurity(selectedSecuritySchemes)

  const headers = new Headers({ ...defaultHeaders, ...params.headers })

  // If the method can have a body, build the request body, otherwise set it to null
  const body = canMethodHaveBody(method)
    ? buildRequestBody(requestBody, exampleName, requestBodyCompositionSelection)
    : null

  // Delete the Content-Type header so the browser will set it automatically based on the request body
  if (body?.mode === 'formdata' || body?.mode === 'urlencoded') {
    headers.delete('Content-Type')
  }

  /** Combine the server url, path and url params into a single url */
  const serverVariables = getServerVariables(server)
  const baseUrl = replacePathVariables(server?.url ?? '', serverVariables)

  // If we are running in Electron, we need to add a custom header
  // that's then forwarded as a `User-Agent` header.
  const userAgentHeader = headers.get('User-Agent')
  if (isElectron && userAgentHeader) {
    headers.set('X-Scalar-User-Agent', userAgentHeader)
  }

  const globalCookieFilter = operation['x-scalar-disable-parameters']?.['global-cookies']?.[exampleName] ?? {}

  const cookiesList = [
    ...globalCookies.map((c) => ({
      ...c,
      isDisabled: (c.isDisabled || globalCookieFilter[c.name.toLowerCase()]) ?? false,
    })),
    ...params.cookies,
  ]

  const acceptHeader = headers.get('Accept')
  const isSseAcceptHeader = acceptHeader?.toLowerCase().includes('text/event-stream') ?? false
  const requestCacheMode: RequestCache = isSseAcceptHeader ? 'no-store' : 'default'

  if (isSseAcceptHeader) {
    headers.set('Cache-Control', 'no-cache')
    headers.set('Pragma', 'no-cache')
  }

  const request: RequestFactory = {
    baseUrl,
    proxyUrl,
    path: {
      variables: params.pathVariables,
      raw: path,
    },
    query: params.urlParams,
    method: method.toUpperCase(),
    headers,
    body,
    cookies: cookiesList,
    cache: requestCacheMode,
    security,
    options: {
      isElectron,
    },
    allowedReservedQueryParameters: params.allowReservedQueryParameters,
  }

  return {
    request,
  }
}
