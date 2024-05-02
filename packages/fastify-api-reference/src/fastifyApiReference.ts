import type { ReferenceConfiguration } from '@scalar/api-reference'
import type {
  FastifyBaseLogger,
  FastifyTypeProviderDefault,
  RawServerDefault,
} from 'fastify'
import fp from 'fastify-plugin'

import { getJavaScriptFile } from './utils'

export type FastifyApiReferenceOptions = {
  /**
   * If you’re prefixing Fastify with a path, you can set it here.
   * It’ll be added to the JavaScript URL and the route.
   *
   * Example: ${publicPath}${routePrefix}/@scalar/fastify-api-reference/js/browser.js
   */
  publicPath?: string
  /**
   * Prefix the route with a path. This is where the API Reference will be available.
   *
   * @default ''
   */
  routePrefix?: string
  /**
   * The universal configuration object for @scalar/api-reference.
   *
   * Read more: https://github.com/scalar/scalar
   */
  configuration?: ReferenceConfiguration
}

// This Schema is used to hide the route from the documentation.
// https://github.com/fastify/fastify-swagger#hide-a-route
const schemaToHideRoute = {
  hide: true,
}

const getJavaScriptUrl = (routePrefix?: string, publicPath?: string) =>
  `${publicPath ?? ''}${routePrefix ?? ''}/@scalar/fastify-api-reference/js/browser.js`.replace(
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
      <script src="${getJavaScriptUrl(options.routePrefix, options.publicPath)}"></script>
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
    const hasSwaggerPlugin = fastify.hasPlugin('@fastify/swagger')

    // If no OpenAPI specification is passed and @fastify/swagger isn’t loaded, show a warning.
    if (
      !configuration?.spec?.content &&
      !configuration?.spec?.url &&
      !hasSwaggerPlugin
    ) {
      fastify.log.warn(
        '[@scalar/fastify-api-reference] You didn’t provide a spec.content or spec.url, and @fastify/swagger could not be found. Please provide one of these options.',
      )

      return
    }

    // Read the JavaScript file once.
    const fileContent = getJavaScriptFile()

    // If no theme is passed, use the default theme.
    fastify.route({
      method: 'GET',
      url: options.routePrefix ?? '/',
      // We don’t know whether @fastify/swagger is registered, but it doesn’t hurt to add a schema anyway.
      // @ts-ignore
      schema: schemaToHideRoute,
      handler(_, reply) {
        // If nothing is passed, try to use @fastify/swagger
        if (
          !configuration?.spec?.content &&
          !configuration?.spec?.url &&
          hasSwaggerPlugin
        ) {
          configuration = {
            ...configuration,
            spec: {
              content: () => {
                // @ts-ignore
                return fastify.swagger()
              },
            },
          }
        }

        // Add the default CSS
        if (!configuration?.customCss && !configuration?.theme) {
          configuration = {
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
      // @ts-ignore
      schema: schemaToHideRoute,
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
