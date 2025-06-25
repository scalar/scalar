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
export const customTheme = `
.light-mode {
  color-scheme: light;
  --scalar-color-1: #1c1e21;
  --scalar-color-2: #757575;
  --scalar-color-3: #8e8e8e;
  --scalar-color-disabled: #b4b1b1;
  --scalar-color-ghost: #a7a7a7;
  --scalar-color-accent: #2f8555;
  --scalar-background-1: #fff;
  --scalar-background-2: #f5f5f5;
  --scalar-background-3: #ededed;
  --scalar-background-4: rgba(0, 0, 0, 0.06);
  --scalar-background-accent: #2f85551f;

  --scalar-border-color: rgba(0, 0, 0, 0.1);
  --scalar-scrollbar-color: rgba(0, 0, 0, 0.18);
  --scalar-scrollbar-color-active: rgba(0, 0, 0, 0.36);
  --scalar-lifted-brightness: 1;
  --scalar-backdrop-brightness: 1;

  --scalar-shadow-1: 0 1px 3px 0 rgba(0, 0, 0, 0.11);
  --scalar-shadow-2: rgba(0, 0, 0, 0.08) 0px 13px 20px 0px,
    rgba(0, 0, 0, 0.08) 0px 3px 8px 0px, #eeeeed 0px 0 0 1px;

  --scalar-button-1: rgb(49 53 56);
  --scalar-button-1-color: #fff;
  --scalar-button-1-hover: rgb(28 31 33);

  --scalar-color-green: #007300;
  --scalar-color-red: #af272b;
  --scalar-color-yellow: #b38200;
  --scalar-color-blue: #3b8ba5;
  --scalar-color-orange: #fb892c;
  --scalar-color-purple: #5203d1;
}

.dark-mode {
  color-scheme: dark;
  --scalar-color-1: rgba(255, 255, 255, 0.9);
  --scalar-color-2: rgba(255, 255, 255, 0.62);
  --scalar-color-3: rgba(255, 255, 255, 0.44);
  --scalar-color-disabled: rgba(255, 255, 255, 0.34);
  --scalar-color-ghost: rgba(255, 255, 255, 0.26);
  --scalar-color-accent: #27c2a0;
  --scalar-background-1: #1b1b1d;
  --scalar-background-2: #242526;
  --scalar-background-3: #3b3b3b;
  --scalar-background-4: rgba(255, 255, 255, 0.06);
  --scalar-background-accent: #27c2a01f;

  --scalar-border-color: rgba(255, 255, 255, 0.1);
  --scalar-scrollbar-color: rgba(255, 255, 255, 0.24);
  --scalar-scrollbar-color-active: rgba(255, 255, 255, 0.48);
  --scalar-lifted-brightness: 1.45;
  --scalar-backdrop-brightness: 0.5;

  --scalar-shadow-1: 0 1px 3px 0 rgb(0, 0, 0, 0.1);
  --scalar-shadow-2: rgba(15, 15, 15, 0.2) 0px 3px 6px,
    rgba(15, 15, 15, 0.4) 0px 9px 24px, 0 0 0 1px rgba(255, 255, 255, 0.1);

  --scalar-button-1: #f6f6f6;
  --scalar-button-1-color: #000;
  --scalar-button-1-hover: #e7e7e7;

  --scalar-color-green: #26b226;
  --scalar-color-red: #fb565b;
  --scalar-color-yellow: #ffc426;
  --scalar-color-blue: #6ecfef;
  --scalar-color-orange: #ff8d4d;
  --scalar-color-purple: #b191f9;
}
`

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

      if (fastify.hasPlugin('@fastify/swagger')) {
        return {
          type: 'swagger' as const,
          // @ts-ignore We know that @fastify/swagger is loaded.
          get: () => fastify.swagger() as OpenAPI.Document,
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
