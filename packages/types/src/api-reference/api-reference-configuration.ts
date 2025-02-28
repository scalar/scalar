import { z } from 'zod'

import type { TargetId } from '../external/index.ts'
import { migrateThemeVariables } from './helpers/migrate-theme-variables.ts'

/** Available theme presets for the API reference */
const themeIdEnum = z.enum([
  'alternate',
  'default',
  'moon',
  'purple',
  'solarized',
  'bluePlanet',
  'deepSpace',
  'saturn',
  'kepler',
  'elysiajs',
  'fastify',
  'mars',
  'none',
])

/** Valid keys that can be used with CTRL/CMD to open the search modal */
const searchHotKeyEnum = z.enum([
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
])

/** Supported integration types */
const integrationEnum = z
  .enum([
    'adonisjs',
    'docusaurus',
    'dotnet',
    'elysiajs',
    'express',
    'fastapi',
    'fastify',
    'go',
    'hono',
    'html',
    'laravel',
    'litestar',
    'nestjs',
    'nextjs',
    'nitro',
    'nuxt',
    'platformatic',
    'react',
    'rust',
    'vue',
  ])
  .nullable()

/** Configuration for the OpenAPI/Swagger specification */
const specConfigurationSchema = z.object({
  /** URL to an OpenAPI/Swagger document */
  url: z.string().optional(),
  /**
   * Directly embed the OpenAPI document.
   * Can be a string, object, function returning an object, or null.
   * @remarks It's recommended to pass a URL instead of content.
   */
  content: z.union([z.string(), z.record(z.any()), z.function().returns(z.record(z.any())), z.null()]).optional(),
})

/** Configuration for path-based routing */
const pathRoutingSchema = z.object({
  /** Base path for the API reference */
  basePath: z.string(),
})

/** Configuration for the Api Client */
export const apiClientConfigurationSchema = z.object({
  /** Prefill authentication */
  authentication: z.any().optional(), // Temp until we bring in the new auth
  /** Base URL for the API server */
  baseServerURL: z.string().optional(),
  /** Whether to hide the client button */
  hideClientButton: z.boolean().optional(),
  /** URL to a request proxy for the API client */
  proxyUrl: z.string().optional(),
  /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey: searchHotKeyEnum.optional(),
  /** List of OpenAPI server objects */
  servers: z.array(z.any()).optional(), // Using any for OpenAPIV3_1.ServerObject
  /**
   * Whether to show the sidebar
   * @default true
   */
  showSidebar: z.boolean().optional().default(true).catch(true),
  /** The Swagger/OpenAPI spec to render */
  spec: specConfigurationSchema.optional(),
  /** A string to use one of the color presets */
  theme: themeIdEnum.optional().default('default').catch('default'),
  /** Integration type identifier */
  _integration: integrationEnum.optional(),
})

export type ApiClientConfiguration = z.infer<typeof apiClientConfigurationSchema>

const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
const NEW_PROXY_URL = 'https://proxy.scalar.com'

/** Configuration for the Api Reference */
export const apiReferenceConfigurationSchema = apiClientConfigurationSchema
  .merge(
    z.object({
      /** The layout to use for the references */
      layout: z.enum(['modern', 'classic']).optional().default('modern').catch('modern'),
      /*s
       * URL to a request proxy for the API client
       * @deprecated Use proxyUrl instead
       */
      proxy: z.string().optional(),
      /**
       * Whether the spec input should show
       * @default false
       */
      isEditable: z.boolean().optional().default(false).catch(false),
      /**
       * Whether to show models in the sidebar, search, and content.
       * @default false
       */
      hideModels: z.boolean().optional().default(false).catch(false),
      /**
       * Whether to show the "Download OpenAPI Document" button
       * @default false
       */
      hideDownloadButton: z.boolean().optional().default(false).catch(false),
      /**
       * Whether to show the "Test Request" button
       * @default false
       */
      hideTestRequestButton: z.boolean().optional().default(false).catch(false),
      /**
       * Whether to show the sidebar search bar
       * @default false
       */
      hideSearch: z.boolean().optional().default(false).catch(false),
      /** Whether dark mode is on or off initially (light mode) */
      darkMode: z.boolean().optional(),
      /** forceDarkModeState makes it always this state no matter what */
      forceDarkModeState: z.enum(['dark', 'light']).optional(),
      /** Whether to show the dark mode toggle */
      hideDarkModeToggle: z.boolean().optional(),
      /**
       * If used, passed data will be added to the HTML header
       * @see https://unhead.unjs.io/usage/composables/use-seo-meta
       */
      metaData: z.any().optional(), // Using any for UseSeoMetaInput since it's an external type
      /**
       * Path to a favicon image
       * @default undefined
       * @example '/favicon.svg'
       */
      favicon: z.string().optional(),
      /**
       * List of httpsnippet clients to hide from the clients menu
       * By default hides Unirest, pass `[]` to show all clients
       */
      hiddenClients: z.union([z.record(z.union([z.boolean(), z.array(z.string())])), z.array(z.string())]).optional(),
      /** Determine the HTTP client that's selected by default */
      defaultHttpClient: z
        .object({
          targetKey: z.custom<TargetId>(),
          clientKey: z.string(),
        })
        .optional(),
      /** Custom CSS to be added to the page */
      customCss: z.string().optional(),
      /** onSpecUpdate is fired on spec/swagger content change */
      onSpecUpdate: z.function().returns(z.void()).optional(),
      /**
       * Route using paths instead of hashes, your server MUST support this
       * @example '/standalone-api-reference/:custom(.*)?'
       * @experimental
       * @default undefined
       */
      pathRouting: pathRoutingSchema.optional(),
      /**
       * Customize the heading portion of the hash
       * @param heading - The heading object
       * @returns A string ID used to generate the URL hash
       * @default (heading) => `#description/${heading.slug}`
       */
      generateHeadingSlug: z.function().args(z.any()).returns(z.string()).optional(),
      /**
       * Customize the model portion of the hash
       * @param model - The model object with a name property
       * @returns A string ID used to generate the URL hash
       * @default (model) => slug(model.name)
       */
      generateModelSlug: z
        .function()
        .args(z.object({ name: z.string() }))
        .returns(z.string())
        .optional(),
      /**
       * Customize the tag portion of the hash
       * @param tag - The tag object
       * @returns A string ID used to generate the URL hash
       * @default (tag) => slug(tag.name)
       */
      generateTagSlug: z.function().args(z.any()).returns(z.string()).optional(),
      /**
       * Customize the operation portion of the hash
       * @param operation - The operation object
       * @returns A string ID used to generate the URL hash
       * @default (operation) => `${operation.method}${operation.path}`
       */
      generateOperationSlug: z
        .function()
        .args(
          z.object({
            path: z.string(),
            operationId: z.string().optional(),
            method: z.string(),
            summary: z.string().optional(),
          }),
        )
        .returns(z.string())
        .optional(),
      /**
       * Customize the webhook portion of the hash
       * @param webhook - The webhook object
       * @returns A string ID used to generate the URL hash
       * @default (webhook) => slug(webhook.name)
       */
      generateWebhookSlug: z
        .function()
        .args(
          z.object({
            name: z.string(),
            method: z.string().optional(),
          }),
        )
        .returns(z.string())
        .optional(),
      /** Callback fired when the reference is fully loaded */
      onLoaded: z.union([z.function().returns(z.void()), z.undefined()]).optional(),
      /**
       * To handle redirects, pass a function that will recieve:
       * - The current path with hash if pathRouting is enabled
       * - The current hash if hashRouting (default)
       * And then passes that to history.replaceState
       *
       * @example hashRouting (default)
       * ```ts
       * redirect: (hash: string) => hash.replace('#v1/old-path', '#v2/new-path')
       * ```
       * @example pathRouting
       * ```ts
       * redirect: (pathWithHash: string) => {
       *   if (pathWithHash.includes('#')) {
       *     return pathWithHash.replace('/v1/tags/user#operation/get-user', '/v1/tags/user/operation/get-user')
       *   }
       *   return null
       * }
       * ```
       */
      redirect: z.function().args(z.string()).returns(z.string().nullable().optional()).optional(),
      /** Whether to include default fonts */
      withDefaultFonts: z.boolean().optional().default(true).catch(true),
      /** Whether to expand all tags by default */
      defaultOpenAllTags: z.boolean().optional(),
      /**
       * Function to sort tags
       * @default 'alpha' for alphabetical sorting
       */
      tagsSorter: z.union([z.literal('alpha'), z.function().args(z.any(), z.any()).returns(z.number())]).optional(),
      /**
       * Function to sort operations
       * @default 'alpha' for alphabetical sorting
       */
      operationsSorter: z
        .union([z.literal('alpha'), z.literal('method'), z.function().args(z.any(), z.any()).returns(z.number())])
        .optional(),
    }),
  )
  .transform((_configuration) => {
    const configuration = { ..._configuration }

    // Migrate legacy theme variables
    if (configuration.customCss) {
      configuration.customCss = migrateThemeVariables(configuration.customCss)
    }

    // Migrate proxy URL
    if (configuration.proxy) {
      console.warn(
        `[DEPRECATED] You’re using the deprecated 'proxy' attribute, rename it to 'proxyUrl' or update the package.`,
      )

      if (!configuration.proxyUrl) {
        configuration.proxyUrl = configuration.proxy
      }

      delete configuration.proxy
    }

    if (configuration.proxyUrl === OLD_PROXY_URL) {
      console.warn(`[DEPRECATED] Warning: configuration.proxyUrl points to our old proxy (${OLD_PROXY_URL}).`)
      console.warn(`[DEPRECATED] We are overwriting the value and use the new proxy URL (${NEW_PROXY_URL}) instead.`)
      console.warn(
        `[DEPRECATED] Action Required: You should manually update your configuration to use the new URL (${NEW_PROXY_URL}). Read more: https://github.com/scalar/scalar`,
      )

      configuration.proxyUrl = NEW_PROXY_URL
    }

    return configuration
  })

/** Configuration after parsing, this is the main type */
export type ApiReferenceConfiguration = Omit<
  z.infer<typeof apiReferenceConfigurationSchema>,
  // Remove deprecated attributes
  'proxy'
>
