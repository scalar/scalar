import { z } from 'zod'

import { ApiReferencePluginSchema } from '@/api-reference/api-reference-plugin.ts'
import { migrateThemeVariables } from '@/api-reference/helpers/migrate-theme-variables.ts'
import type { TargetId } from '@/snippetz/index.ts'
import type { AuthenticationConfiguration } from './authentication-configuration.ts'

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
  'laserwave',
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
    'svelte',
    'vue',
  ])
  .nullable()

/** Configuration for the OpenAPI/Swagger specification */
export const specConfigurationSchema = z.object({
  /**
   * URL to an OpenAPI/Swagger document
   *
   * @deprecated Please move `url` to the top level and remove the `spec` prefix.
   *
   * @example
   * ```ts
   * const oldConfiguration = {
   *   spec: {
   *     url: 'https://example.com/openapi.json',
   *   },
   * }
   *
   * const newConfiguration = {
   *   url: 'https://example.com/openapi.json',
   * }
   * ```
   **/
  url: z.string().optional(),
  /**
   * Directly embed the OpenAPI document.
   * Can be a string, object, function returning an object, or null.
   *
   * @remarks It's recommended to pass a URL instead of content.
   *
   * @deprecated Please move `content` to the top level and remove the `spec` prefix.
   *
   * @example
   * ```ts
   * const oldConfiguration = {
   *   spec: {
   *     content: '…',
   *   },
   * }
   *
   * const newConfiguration = {
   *   content: '…',
   * }
   * ```
   **/
  content: z.union([z.string(), z.record(z.any()), z.function().returns(z.record(z.any())), z.null()]).optional(),
  /**
   * The title of the OpenAPI document.
   *
   * @example 'Scalar Galaxy'
   *
   * @deprecated Please move `title` to the top level and remove the `spec` prefix.
   */
  title: z.string().optional(),
  /**
   * The slug of the OpenAPI document used in the URL.
   *
   * If none is passed, the title will be used.
   *
   * If no title is used, it'll just use the index.
   *
   * @example 'scalar-galaxy'
   *
   * @deprecated Please move `slug` to the top level and remove the `spec` prefix.
   */
  slug: z.string().optional(),
})
export type SpecConfiguration = z.infer<typeof specConfigurationSchema>

/** Configuration for path-based routing */
const pathRoutingSchema = z.object({
  /** Base path for the API reference */
  basePath: z.string(),
})

/** Configuration for the Api Client */
export const apiClientConfigurationSchema = z.object({
  /**
   * URL to an OpenAPI/Swagger document
   **/
  url: z.string().optional(),
  /**
   * Directly embed the OpenAPI document.
   * Can be a string, object, function returning an object, or null.
   *
   * @remarks It's recommended to pass a URL instead of content.
   **/
  content: z.union([z.string(), z.record(z.any()), z.function().returns(z.record(z.any())), z.null()]).optional(),
  /**
   * The title of the OpenAPI document.
   *
   * @example 'Scalar Galaxy'
   */
  title: z.string().optional(),
  /**
   * The slug of the OpenAPI document used in the URL.
   *
   * If none is passed, the title will be used.
   *
   * If no title is used, it'll just use the index.
   *
   * @example 'scalar-galaxy'
   */
  slug: z.string().optional(),
  /**
   * The OpenAPI/Swagger document to render
   *
   * @deprecated Use `url` and `content` on the top level instead.
   **/
  spec: specConfigurationSchema.optional(),
  /** Prefill authentication */
  authentication: z.any().optional(), // Temp until we bring in the new auth
  /** Base URL for the API server */
  baseServerURL: z.string().optional(),
  /**
   * Whether to hide the client button
   * @default false
   */
  hideClientButton: z.boolean().optional().default(false).catch(false),
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
  /** A string to use one of the color presets */
  theme: themeIdEnum.optional().default('default').catch('default'),
  /** Integration type identifier */
  _integration: integrationEnum.optional(),
  /** onRequestSent is fired when a request is sent */
  onRequestSent: z.function().args(z.string()).returns(z.void()).optional(),
})

export type ApiClientConfiguration = z.infer<typeof apiClientConfigurationSchema>

/** Configuration for the Api Client without the transform since it cannot be merged */
const _apiReferenceConfigurationSchema = apiClientConfigurationSchema.merge(
  z.object({
    /**
     * The layout to use for the references
     * @default 'modern'
     */
    layout: z.enum(['modern', 'classic']).optional().default('modern').catch('modern'),
    /**
     * URL to a request proxy for the API client
     * @deprecated Use proxyUrl instead
     */
    proxy: z.string().optional(),
    /**
     * Plugins for the API reference
     */
    plugins: z.array(ApiReferencePluginSchema).optional(),
    /**
     * Whether the spec input should show
     * @default false
     */
    isEditable: z.boolean().optional().default(false).catch(false),
    /**
     * Controls whether the references show a loading state in the intro
     * @default false
     */
    isLoading: z.boolean().optional().default(false).catch(false),
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
    /**
     * Whether to show the dark mode toggle
     * @default false
     */
    hideDarkModeToggle: z.boolean().optional().default(false).catch(false),
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
    hiddenClients: z
      .union([z.record(z.union([z.boolean(), z.array(z.string())])), z.array(z.string()), z.literal(true)])
      .optional(),
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
    onSpecUpdate: z.function().args(z.string()).returns(z.void()).optional(),
    /** onServerChange is fired on selected server change */
    onServerChange: z.function().args(z.string()).returns(z.void()).optional(),
    /** onDocumentSelect is fired when the config is selected */
    onDocumentSelect: z.function().returns(z.void().or(z.void().promise())).optional(),
    /** Callback fired when the reference is fully loaded */
    onLoaded: z.function().returns(z.void().or(z.void().promise())).optional(),
    /**
     * onShowMore is fired when the user clicks the "Show more" button on the references
     * @param tagId - The ID of the tag that was clicked
     */
    onShowMore: z.function().args(z.string()).returns(z.void().or(z.void().promise())).optional(),
    /**
     * onSidebarClick is fired when the user clicks on a sidebar item
     * @param href - The href of the sidebar item that was clicked
     */
    onSidebarClick: z.function().args(z.string()).returns(z.void().or(z.void().promise())).optional(),
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
    generateHeadingSlug: z
      .function()
      .args(
        z.object({
          slug: z.string().default('headingSlug'),
        }),
      )
      .returns(z.string())
      .optional(),
    /**
     * Customize the model portion of the hash
     * @param model - The model object with a name property
     * @returns A string ID used to generate the URL hash
     * @default (model) => slug(model.name)
     */
    generateModelSlug: z
      .function()
      .args(
        z.object({
          name: z.string().default('modelName'),
        }),
      )
      .returns(z.string())
      .optional(),
    /**
     * Customize the tag portion of the hash
     * @param tag - The tag object
     * @returns A string ID used to generate the URL hash
     * @default (tag) => slug(tag.name)
     */
    generateTagSlug: z
      .function()
      .args(
        z.object({
          name: z.string().default('tagName'),
        }),
      )
      .returns(z.string())
      .optional(),
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
    /**
     * Whether to include default fonts
     * @default true
     */
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

const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
const NEW_PROXY_URL = 'https://proxy.scalar.com'

/** Migrate the configuration through a transform */
const migrateConfiguration = <T extends z.infer<typeof _apiReferenceConfigurationSchema>>(_configuration: T): T => {
  const configuration = { ..._configuration }

  // Remove the spec prefix
  if (configuration.spec?.url) {
    console.warn(
      `[DEPRECATED] You're using the deprecated 'spec.url' attribute. Remove the spec prefix and move the 'url' attribute to the top level.`,
    )

    configuration.url = configuration.spec.url
    delete configuration.spec
  }

  if (configuration.spec?.content) {
    console.warn(
      `[DEPRECATED] You're using the deprecated 'spec.content' attribute. Remove the spec prefix and move the 'content' attribute to the top level.`,
    )

    configuration.content = configuration.spec.content
    delete configuration.spec
  }

  // Migrate legacy theme variables
  if (configuration.customCss) {
    configuration.customCss = migrateThemeVariables(configuration.customCss)
  }

  // Migrate proxy URL
  if (configuration.proxy) {
    console.warn(
      `[DEPRECATED] You're using the deprecated 'proxy' attribute, rename it to 'proxyUrl' or update the package.`,
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
}

/** Configuration for the Api Reference */
export const apiReferenceConfigurationSchema = _apiReferenceConfigurationSchema.transform(migrateConfiguration)

/** Configuration after parsing, this is the main type */
export type ApiReferenceConfiguration = Omit<
  z.infer<typeof _apiReferenceConfigurationSchema>,
  // Remove deprecated attributes
  'proxy' | 'spec' | 'authentication'
> & {
  authentication?: AuthenticationConfiguration
}

/** Api Config which includes the default config */
type ApiReferenceConfigurationWithDefault = ApiReferenceConfiguration & {
  /** Whether to use this config as the default one */
  default?: boolean
}

/** Configuration for a single config with sources */
export type ApiReferenceConfigurationWithSources = Omit<ApiReferenceConfigurationWithDefault, 'default'> & {
  sources: (SpecConfiguration & { default?: boolean })[]
}

/** Configuration for multiple Api References */
export type AnyApiReferenceConfiguration =
  | Partial<ApiReferenceConfiguration>
  | Partial<ApiReferenceConfigurationWithSources>
  | Partial<ApiReferenceConfigurationWithDefault>[]
  | Partial<ApiReferenceConfigurationWithSources>[]

/** Typeguard to check to narrow the configs to the one with sources */
export const isConfigurationWithSources = (
  config: AnyApiReferenceConfiguration,
): config is Partial<ApiReferenceConfigurationWithSources> =>
  Boolean(!Array.isArray(config) && config && 'sources' in config && Array.isArray(config.sources))
