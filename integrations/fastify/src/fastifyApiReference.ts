import type { OpenAPI } from '@scalar/openapi-types'
import type { FastifyBaseLogger, FastifyTypeProviderDefault, RawServerDefault } from 'fastify'
import fp from 'fastify-plugin'
import { slug } from 'github-slugger'

import type { FastifyApiReferenceHooksOptions, FastifyApiReferenceOptions } from './types'
import { getJavaScriptFile } from './utils/getJavaScriptFile'

import { getHtmlDocument } from '@scalar/core/libs/html-rendering'
import { normalize, toJson, toYaml } from '@scalar/openapi-parser'
import type { ApiReferenceConfiguration } from './types'

/**
 * Path to the bundled Scalar JavaScript file
 */
const RELATIVE_JAVASCRIPT_PATH = 'js/scalar.js'

// This Schema is used to hide the route from the documentation.
// https://github.com/fastify/fastify-swagger#hide-a-route
const schemaToHideRoute = {
  hide: true,
}

const getRoutePrefix = (routePrefix?: string) => {
  const prefix = routePrefix ?? '/reference'

  // Remove trailing slash if present
  return prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
}

/**
 * Get the endpoints for the OpenAPI specification.
 */
const getOpenApiDocumentEndpoints = (
  openApiDocumentEndpoints: FastifyApiReferenceOptions['openApiDocumentEndpoints'],
) => {
  const { json = '/openapi.json', yaml = '/openapi.yaml' } = openApiDocumentEndpoints ?? {}
  return { json, yaml }
}

/**
 * Get the URL for the Scalar JavaScript file.
 */
const getJavaScriptUrl = (routePrefix?: string) =>
  `${getRoutePrefix(routePrefix)}/${RELATIVE_JAVASCRIPT_PATH}`.replace(/\/\//g, '/')

/**
 * The custom theme for Fastify
 */
export const customTheme = ''

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
  async (fastify, options) => {
    const { configuration: givenConfiguration } = options

    // Merge the defaults
    let configuration = {
      ...DEFAULT_CONFIGURATION,
      ...givenConfiguration,
    }

    const specSource = (() => {
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

    // If no OpenAPI specification is passed and @fastify/swagger isn't loaded, show a warning.
    if (!specSource) {
      fastify.log.warn(
        "[@scalar/fastify-api-reference] You didn't provide a `content` or `url`, and @fastify/swagger could not be found. Please provide one of these options.",
      )

      return
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

    const getSpecFilenameSlug = async (spec: OpenAPI.Document) => {
      // Same GitHub Slugger and default file name as in `@scalar/api-reference`, when generating the download
      return slug(spec?.specification?.info?.title ?? 'spec')
    }

    const openApiSpecUrlJson = `${getRoutePrefix(options.routePrefix)}${getOpenApiDocumentEndpoints(options.openApiDocumentEndpoints).json}`
    fastify.route({
      method: 'GET',
      url: openApiSpecUrlJson,
      // @ts-ignore We don't know whether @fastify/swagger is loaded.
      schema: schemaToHideRoute,
      ...hooks,
      ...(options.logLevel && { logLevel: options.logLevel }),
      async handler(_, reply) {
        const spec = normalize(specSource.get())
        const filename: string = await getSpecFilenameSlug(spec)
        const json = JSON.parse(toJson(spec)) // parsing minifies the JSON

        return reply
          .header('Content-Type', 'application/json')
          .header('Content-Disposition', `filename=${filename}.json`)
          .header('Access-Control-Allow-Origin', '*')
          .header('Access-Control-Allow-Methods', '*')
          .send(json)
      },
    })

    const openApiSpecUrlYaml = `${getRoutePrefix(options.routePrefix)}${getOpenApiDocumentEndpoints(options.openApiDocumentEndpoints).yaml}`
    fastify.route({
      method: 'GET',
      url: openApiSpecUrlYaml,
      // @ts-ignore We don't know whether @fastify/swagger is loaded.
      schema: schemaToHideRoute,
      ...hooks,
      ...(options.logLevel && { logLevel: options.logLevel }),
      async handler(_, reply) {
        const spec = normalize(specSource.get())
        const filename: string = await getSpecFilenameSlug(spec)
        const yaml = toYaml(spec)
        return reply
          .header('Content-Type', 'application/yaml')
          .header('Content-Disposition', `filename=${filename}.yaml`)
          .header('Access-Control-Allow-Origin', '*')
          .header('Access-Control-Allow-Methods', '*')
          .send(yaml)
      },
    })

    // Redirect route without a trailing slash to force a trailing slash:
    // We need this so the request to the JS file is relative.

    // With ignoreTrailingSlash, fastify registeres both routes anyway.
    const doesNotIgnoreTrailingSlash = fastify.initialConfig.ignoreTrailingSlash !== true

    if (doesNotIgnoreTrailingSlash && getRoutePrefix(options.routePrefix)) {
      fastify.route({
        method: 'GET',
        url: getRoutePrefix(options.routePrefix),
        // @ts-ignore We don't know whether @fastify/swagger is loaded.
        schema: schemaToHideRoute,
        ...hooks,
        ...(options.logLevel && { logLevel: options.logLevel }),
        handler(_, reply) {
          return reply.redirect(getRoutePrefix(options.routePrefix) + '/', 302)
        },
      })
    }

    // If no theme is passed, use the default theme.
    fastify.route({
      method: 'GET',
      url: `${getRoutePrefix(options.routePrefix)}/`,
      // We don't know whether @fastify/swagger is registered, but it doesn't hurt to add a schema anyway.
      // @ts-ignore We don't know whether @fastify/swagger is loaded.
      schema: schemaToHideRoute,
      ...hooks,
      ...(options.logLevel && { logLevel: options.logLevel }),
      handler(_, reply) {
        // Redirect if it's the route without a slash
        const currentUrl = new URL(_.url, `${_.protocol}://${_.hostname}`)

        if (!currentUrl.pathname.endsWith('/')) {
          return reply.redirect(`${currentUrl.pathname}/`, 301)
        }

        /**
         * Regardless of where we source the spec from, provide it as a URL, to have the
         * download button point to the exposed endpoint.
         * If the URL is explicitly passed, defer to that URL instead.
         */
        if (specSource.type !== 'url') {
          configuration = {
            ...configuration,
            // Use a relative URL in case we're proxied
            url: `.${getOpenApiDocumentEndpoints(options.openApiDocumentEndpoints).json}`,
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
            customTheme,
          ),
        )
      },
    })

    fastify.route({
      method: 'GET',
      url: getJavaScriptUrl(options.routePrefix),
      // We don't know whether @fastify/swagger is registered, but it doesn't hurt to add a schema anyway.
      // @ts-ignore We don't know whether @fastify/swagger is loaded.
      schema: schemaToHideRoute,
      ...hooks,
      ...(options.logLevel && { logLevel: options.logLevel }),
      handler(_, reply) {
        return reply.header('Content-Type', 'application/javascript; charset=utf-8').send(fileContent)
      },
    })
  },
  {
    name: '@scalar/fastify-api-reference',
  },
)

export default fastifyApiReference
