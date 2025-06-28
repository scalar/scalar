import type { onRequestHookHandler, preHandlerHookHandler } from 'fastify'

import type { HtmlRenderingConfiguration } from '@scalar/core/libs/html-rendering'

/**
 * The configuration for the Scalar API Reference for Fastify
 */
export type ApiReferenceConfiguration = HtmlRenderingConfiguration

export type FastifyApiReferenceOptions = {
  /**
   * If you're prefixing Fastify with a path, you can set it here.
   * It'll be added to the JavaScript URL and the route.
   *
   * Example: `${publicPath}${routePrefix}/js/scalar.js`
   * @deprecated We don't use this anymore.
   */
  publicPath?: string
  /**
   * Prefix the route with a path. This is where the API Reference will be available.
   *
   * @default '/reference'
   */
  routePrefix?: `/${string}`
  /**
   * Set where the OpenAPI specification is exposed under `${routePrefix}`.
   *
   * The specification is always available on these endpoints, parsed by `@scalar/openapi-parser`.
   *
   * The specification is sourced from, in order of precedence:
   * - `configuration.spec.content`
   * - `configuration.spec.url` – fetched via `@scalar/openapi-parser/plugins/fetch-urls`
   * - `@fastify/swagger` – if `configuration.spec` is not provided
   *
   * These endpoints can be used to fetch the OpenAPI specification for your own programmatic use.
   *
   * @default{ json: '/openapi.json', yaml: '/openapi.yaml' }
   */
  openApiDocumentEndpoints?: {
    /**
     * Set where the OpenAPI specification is exposed under `${routePrefix}`, in JSON format.
     *
     * With the default value, the endpoint is: `${publicPath}${routePrefix}/openapi.json`
     *
     * @default '/openapi.json'
     */
    json?: `/${string}`
    /**
     * Set where the OpenAPI specification is exposed under `${routePrefix}`, in YAML format.
     *
     * With the default value, the endpoint is: `${publicPath}${routePrefix}/openapi.yaml`
     *
     * @default '/openapi.yaml'
     */
    yaml?: `/${string}`
  }
  /**
   * The universal configuration object for @scalar/api-reference.
   *
   * Read more: https://github.com/scalar/scalar
   */
  configuration?: Partial<ApiReferenceConfiguration>
  /**
   * The hooks for the API Reference.
   */
  hooks?: FastifyApiReferenceHooksOptions
  /**
   * The log level for all routes registered by this plugin.
   * Set to 'silent' to disable logging for these routes.
   */
  logLevel?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'
}

export type FastifyApiReferenceHooksOptions = Partial<{
  onRequest?: onRequestHookHandler
  preHandler?: preHandlerHookHandler
}>
