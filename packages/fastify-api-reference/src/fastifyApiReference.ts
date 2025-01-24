import { openapi } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import type { OpenAPI } from '@scalar/types/legacy'
import type {
  FastifyBaseLogger,
  FastifyTypeProviderDefault,
  RawServerDefault,
} from 'fastify'
import fp from 'fastify-plugin'
import { slug } from 'github-slugger'

import type {
  FastifyApiReferenceHooksOptions,
  FastifyApiReferenceOptions,
} from './types.ts'
import { getJavaScriptFile } from './utils/getJavaScriptFile.ts'

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
const getOpenApiDocumentEndpoints = (
  openApiDocumentEndpoints: FastifyApiReferenceOptions['openApiDocumentEndpoints'],
) => {
  const { json = '/openapi.json', yaml = '/openapi.yaml' } =
    openApiDocumentEndpoints ?? {}
  return { json, yaml }
}

const RELATIVE_JAVASCRIPT_PATH = 'js/scalar.js'

const getJavaScriptUrl = (routePrefix?: string) =>
  `${getRoutePrefix(routePrefix)}/${RELATIVE_JAVASCRIPT_PATH}`.replace(
    /\/\//g,
    '/',
  )

/**
 * The Fastify custom theme CSS
 */
export const defaultCss = `
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
 * The HTML to load the @scalar/api-reference JavaScript package.
 */
export const javascript = (options: FastifyApiReferenceOptions) => {
  const { configuration } = options

  return `
    <script
      id="api-reference"
      type="application/json"
      data-configuration="${JSON.stringify(configuration ?? {})
        .split('"')
        .join('&quot;')}">${
        configuration?.spec?.content
          ? typeof configuration?.spec?.content === 'function'
            ? JSON.stringify(configuration?.spec?.content())
            : JSON.stringify(configuration?.spec?.content)
          : ''
      }</script>
      <script src="${RELATIVE_JAVASCRIPT_PATH}"></script>
  `
}

/**
 * The HTML template to render the API Reference.
 */
export function htmlDocument(options: FastifyApiReferenceOptions) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    ${javascript(options)}
  </body>
</html>
`
}

const fastifyApiReference = fp<
  FastifyApiReferenceOptions,
  RawServerDefault,
  FastifyTypeProviderDefault,
  FastifyBaseLogger
>(
  async (fastify, options) => {
    let { configuration } = options

    // Add _integration: 'fastify' to the configuration
    configuration = {
      _integration: 'fastify',
      ...configuration,
    }

    const specSource = (() => {
      const { content, url } = configuration?.spec ?? {}
      if (content)
        return {
          type: 'content' as const,
          get: () => {
            if (typeof content === 'function') return content()
            return content
          },
        }
      if (url)
        return {
          type: 'url' as const,
          get: () => url,
        }

      if (fastify.hasPlugin('@fastify/swagger')) {
        return {
          type: 'swagger' as const,
          get: () => {
            // @ts-ignore We know that @fastify/swagger is loaded.
            return fastify.swagger() as OpenAPI.Document
          },
        }
      }
      return void 0
    })()

    // If no OpenAPI specification is passed and @fastify/swagger isn’t loaded, show a warning.
    if (!specSource) {
      fastify.log.warn(
        '[@scalar/fastify-api-reference] You didn’t provide a spec.content or spec.url, and @fastify/swagger could not be found. Please provide one of these options.',
      )

      return
    }

    // Read the JavaScript file once.
    const fileContent = getJavaScriptFile()

    const hooks: FastifyApiReferenceHooksOptions = {}
    if (options.hooks) {
      const additionalHooks: (keyof FastifyApiReferenceHooksOptions)[] = [
        'onRequest',
        'preHandler',
      ]

      for (const hook of additionalHooks) {
        hooks[hook] = options.hooks[hook]
      }
    }

    const getLoadedSpecIfAvailable = () => {
      return openapi().load(specSource.get(), { plugins: [fetchUrls()] })
    }
    const getSpecFilenameSlug = async (
      loadedSpec: ReturnType<typeof getLoadedSpecIfAvailable>,
    ) => {
      const spec = await loadedSpec?.get()
      // Same GitHub Slugger and default file name as in `@scalar/api-reference`, when generating the download
      return slug(spec?.specification?.info?.title ?? 'spec')
    }

    const openApiSpecUrlJson = `${getRoutePrefix(options.routePrefix)}${getOpenApiDocumentEndpoints(options.openApiDocumentEndpoints).json}`
    fastify.route({
      method: 'GET',
      url: openApiSpecUrlJson,
      // @ts-ignore We don’t know whether @fastify/swagger is loaded.
      schema: schemaToHideRoute,
      ...hooks,
      async handler(_, reply) {
        const spec = getLoadedSpecIfAvailable()
        const filename: string = await getSpecFilenameSlug(spec)
        const json = JSON.parse(await spec.toJson()) // parsing minifies the JSON
        return reply
          .header('Content-Type', `application/json`)
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
      // @ts-ignore We don’t know whether @fastify/swagger is loaded.
      schema: schemaToHideRoute,
      ...hooks,
      async handler(_, reply) {
        const spec = getLoadedSpecIfAvailable()
        const filename: string = await getSpecFilenameSlug(spec)
        const yaml = await spec.toYaml()
        return reply
          .header('Content-Type', `application/yaml`)
          .header('Content-Disposition', `filename=${filename}.yaml`)
          .header('Access-Control-Allow-Origin', '*')
          .header('Access-Control-Allow-Methods', '*')
          .send(yaml)
      },
    })

    // Redirect route without a trailing slash to force a trailing slash:
    // We need this so the request to the JS file is relative.

    // With ignoreTrailingSlash, fastify registeres both routes anyway.
    const doesNotIgnoreTrailingSlash =
      fastify.initialConfig.ignoreTrailingSlash !== true

    if (doesNotIgnoreTrailingSlash && getRoutePrefix(options.routePrefix)) {
      fastify.route({
        method: 'GET',
        url: getRoutePrefix(options.routePrefix),
        // @ts-ignore We don't know whether @fastify/swagger is loaded.
        schema: schemaToHideRoute,
        ...hooks,
        handler(_, reply) {
          return reply.redirect(getRoutePrefix(options.routePrefix) + '/', 302)
        },
      })
    }

    // If no theme is passed, use the default theme.
    fastify.route({
      method: 'GET',
      url: `${getRoutePrefix(options.routePrefix)}/`,
      // We don’t know whether @fastify/swagger is registered, but it doesn’t hurt to add a schema anyway.
      // @ts-ignore We don’t know whether @fastify/swagger is loaded.
      schema: schemaToHideRoute,
      ...hooks,
      handler(_, reply) {
        // Redirect if it’s the route without a slash
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
            _integration: 'fastify',
            ...configuration,
            spec: {
              // Use a relative URL in case we're proxied
              url: `.${getOpenApiDocumentEndpoints(options.openApiDocumentEndpoints).json}`,
            },
          }
        }

        // Add the default CSS
        if (!configuration?.customCss && !configuration?.theme) {
          configuration = {
            _integration: 'fastify',
            ...configuration,
            customCss: defaultCss,
          }
        }

        return reply
          .header('Content-Type', 'text/html; charset=utf-8')
          .send(htmlDocument({ ...options, configuration }))
      },
    })

    fastify.route({
      method: 'GET',
      url: getJavaScriptUrl(options.routePrefix),
      // We don’t know whether @fastify/swagger is registered, but it doesn’t hurt to add a schema anyway.
      // @ts-ignore We don’t know whether @fastify/swagger is loaded.
      schema: schemaToHideRoute,
      ...hooks,
      handler(_, reply) {
        return reply
          .header('Content-Type', 'application/javascript; charset=utf-8')
          .send(fileContent)
      },
    })
  },
  {
    name: '@scalar/fastify-api-reference',
  },
)

export default fastifyApiReference
