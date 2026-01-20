import { getHtmlDocument } from '@scalar/core/libs/html-rendering'
import { normalize, toYaml } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import type { FastifyBaseLogger, FastifyTypeProviderDefault, RawServerDefault } from 'fastify'
import fp from 'fastify-plugin'
import { slug } from 'github-slugger'

import fastifyTheme from './assets/theme.css?raw'
import type { ApiReferenceConfiguration, FastifyApiReferenceHooksOptions, FastifyApiReferenceOptions } from './types'
import { getJavaScriptFile } from './utils/get-javascript-file'

/**
 * Path to the bundled Scalar JavaScript file
 */
const RELATIVE_JAVASCRIPT_PATH = 'js/scalar.js'

/**
 * This Schema is used to hide the route from the documentation.
 *
 * We don't know whether `@fastify/swagger` is registered, but it doesn't hurt to add a schema anyway.
 *
 * @see https://github.com/fastify/fastify-swagger#hide-a-route
 */
const schemaToHideRoute = {
  hide: true,
}

const getRoutePrefix = (routePrefix?: string) => {
  const prefix = routePrefix ?? '/reference'

  // Remove trailing slash if present
  return prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
}

/**
 * Get the endpoints for the OpenAPI document.
 */
const getDocumentUrls = (openApiDocumentEndpoints: FastifyApiReferenceOptions['openApiDocumentEndpoints']) => {
  const { json = '/openapi.json', yaml = '/openapi.yaml' } = openApiDocumentEndpoints ?? {}

  return { json, yaml }
}

/**
 * Get the URL for the Scalar JavaScript file.
 */
const getJavaScriptUrl = (routePrefix?: string) =>
  `${getRoutePrefix(routePrefix)}/${RELATIVE_JAVASCRIPT_PATH}`.replace(/\/\//g, '/')

/**
 * The default configuration for Fastify
 */
const DEFAULT_CONFIGURATION: Partial<ApiReferenceConfiguration> = {
  _integration: 'fastify',
}

const fastifyApiReference = fp<
  FastifyApiReferenceOptions,
  RawServerDefault,
  FastifyTypeProviderDefault,
  FastifyBaseLogger
>(
  (fastify, options, next) => {
    const { configuration: givenConfiguration } = options

    // Merge the defaults
    let configuration = {
      ...DEFAULT_CONFIGURATION,
      ...givenConfiguration,
    }

    const source = (() => {
      const { content, url } = configuration ?? {}
      if (content) {
        return {
          type: 'content' as const,
          get: () => {
            if (typeof content === 'function') {
              return content()
            }
            return content
          },
        }
      }
      if (url) {
        return {
          type: 'url' as const,
          get: () => url,
        }
      }

      // Even if @fastify/swagger is loaded, when the `decorator` option is set, the `swagger` function is not available.
      if (fastify.hasPlugin('@fastify/swagger') && typeof fastify.swagger === 'function') {
        return {
          type: 'swagger' as const,
          get: () => fastify.swagger(),
        }
      }

      return void 0
    })()

    // If no OpenAPI document is passed and @fastify/swagger isn't loaded, show a warning.
    if (!source && !configuration.sources) {
      fastify.log.warn(
        "[@scalar/fastify-api-reference] You didn't provide a `content`, `url`, `sources` or @fastify/swagger could not be found. Please provide one of these options to render the API Reference.",
      )

      return next()
    }

    // Read the JavaScript file once.
    const fileContent = getJavaScriptFile()

    const hooks: FastifyApiReferenceHooksOptions = {}
    if (options.hooks) {
      const additionalHooks: (keyof FastifyApiReferenceHooksOptions)[] = ['onRequest', 'preHandler']

      for (const hook of additionalHooks) {
        if (options.hooks[hook]) {
          hooks[hook] = options.hooks[hook]
        }
      }
    }

    const getFilename = (document: OpenAPI.Document): string => {
      // Same GitHub Slugger and default file name as in `@scalar/api-reference`, when generating the download
      return slug(document?.specification?.info?.title ?? 'openapi')
    }

    // Only expose the endpoints if source is available
    if (source) {
      const { json } = getDocumentUrls(options.openApiDocumentEndpoints)
      const documentUrlJson = `${getRoutePrefix(options.routePrefix)}${json}`

      fastify.route({
        method: 'GET',
        url: documentUrlJson,
        schema: schemaToHideRoute,
        ...hooks,
        ...(options.logLevel && { logLevel: options.logLevel }),
        handler(_, reply) {
          const document = normalize(source.get())
          const filename = getFilename(document)

          return reply
            .header('Content-Type', 'application/json')
            .header('Content-Disposition', `filename=${filename}.json`)
            .header('Access-Control-Allow-Origin', '*')
            .header('Access-Control-Allow-Methods', '*')
            .send(document)
        },
      })

      const { yaml } = getDocumentUrls(options.openApiDocumentEndpoints)
      const documentUrlYaml = `${getRoutePrefix(options.routePrefix)}${yaml}`

      fastify.route({
        method: 'GET',
        url: documentUrlYaml,
        schema: schemaToHideRoute,
        ...hooks,
        ...(options.logLevel && { logLevel: options.logLevel }),
        handler(_, reply) {
          const document = normalize(source.get())
          const filename = getFilename(document)
          const yaml = toYaml(document)

          return reply
            .header('Content-Type', 'application/yaml')
            .header('Content-Disposition', `filename=${filename}.yaml`)
            .header('Access-Control-Allow-Origin', '*')
            .header('Access-Control-Allow-Methods', '*')
            .send(yaml)
        },
      })
    }

    // Redirect route without a trailing slash to force a trailing slash:
    // We need this so the request to the JS file is relative.

    // With ignoreTrailingSlash: true, fastify responds to both routes anyway.
    const ignoreTrailingSlash =
      // @ts-expect-error We're still on Fastify 4, this is introduced in Fastify 5
      fastify.initialConfig?.routerOptions?.ignoreTrailingSlash === true ||
      fastify.initialConfig?.ignoreTrailingSlash === true

    if (!ignoreTrailingSlash && getRoutePrefix(options.routePrefix)) {
      fastify.route({
        method: 'GET',
        url: getRoutePrefix(options.routePrefix),
        schema: schemaToHideRoute,
        ...hooks,
        ...(options.logLevel && { logLevel: options.logLevel }),
        handler(request, reply) {
          // we are in a route without a trailing slash so redirect directly to the one with a trailing slash
          const currentUrl = new URL(request.url, `${request.protocol}://${request.hostname}`)

          return reply.redirect(`${currentUrl.pathname}/`, 301)
        },
      })
    }

    // If no theme is passed, use the default theme.
    fastify.route({
      method: 'GET',
      url: `${getRoutePrefix(options.routePrefix)}/`,
      // We don't know whether @fastify/swagger is registered, but it doesn't hurt to add a schema anyway.
      schema: schemaToHideRoute,
      ...hooks,
      ...(options.logLevel && { logLevel: options.logLevel }),
      handler(request, reply) {
        // Redirect if it's the route without a slash
        const currentUrl = new URL(request.url, `${request.protocol}://${request.hostname}`)
        if (!currentUrl.pathname.endsWith('/')) {
          return reply.redirect(`${currentUrl.pathname}/`, 301)
        }

        /**
         * Regardless of where we source the spec from, provide it as a URL, to have the
         * download button point to the exposed endpoint.
         * If the URL is explicitly passed, defer to that URL instead.
         */
        if (source && source.type !== 'url') {
          configuration = {
            ...configuration,
            // Use a relative URL in case we're proxied
            url: `.${getDocumentUrls(options.openApiDocumentEndpoints).json}`,
          }
        }

        // Respond with the HTML document
        return reply.header('Content-Type', 'text/html; charset=utf-8').send(
          getHtmlDocument(
            {
              // We're using the bundled JS here by default, but the user can pass a CDN URL.
              cdn: RELATIVE_JAVASCRIPT_PATH,
              ...configuration,
            },
            fastifyTheme,
          ),
        )
      },
    })

    fastify.route({
      method: 'GET',
      url: getJavaScriptUrl(options.routePrefix),
      // We don't know whether @fastify/swagger is registered, but it doesn't hurt to add a schema anyway.
      schema: schemaToHideRoute,
      ...hooks,
      ...(options.logLevel && { logLevel: options.logLevel }),
      handler(_, reply) {
        return reply.header('Content-Type', 'application/javascript; charset=utf-8').send(fileContent)
      },
    })

    next()
  },
  {
    name: '@scalar/fastify-api-reference',
  },
)

export default fastifyApiReference
