import { z } from 'zod'

import type { TargetId } from '../external/index.ts'
import { migrateProxyUrl } from './helpers/migrate-proxy-url.ts'
import { migrateThemeVariables } from './helpers/migrate-theme-variables.ts'

/** Available theme presets for the API reference */
const ThemeIdEnum = z.enum([
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
const SearchHotKeyEnum = z.enum([
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
const IntegrationEnum = z
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
const SpecConfigurationSchema = z.object({
  /** URL to an OpenAPI/Swagger document */
  url: z.string().url().optional(),
  /**
   * Directly embed the OpenAPI document.
   * Can be a string, object, function returning an object, or null.
   * @remarks It's recommended to pass a URL instead of content.
   */
  content: z.union([z.string(), z.record(z.any()), z.function().returns(z.record(z.any())), z.null()]).optional(),
})

/** Configuration for path-based routing */
const PathRoutingSchema = z.object({
  /** Base path for the API reference */
  basePath: z.string(),
})

export const ApiReferenceConfigurationSchema = z
  .object({
    /** A string to use one of the color presets */
    theme: ThemeIdEnum.optional().catch('default'),
    /** The layout to use for the references */
    layout: z.enum(['modern', 'classic']).optional().default('modern').catch('modern'),
    /** The Swagger/OpenAPI spec to render */
    spec: SpecConfigurationSchema.optional(),
    /**
     * URL to a request proxy for the API client
     * @deprecated Use proxyUrl instead
     */
    proxy: z.string().optional(),
    /** URL to a request proxy for the API client */
    proxyUrl: z.string().optional(),
    /**
    Whether the spec input should show
    @default false
  */
    isEditable: z.boolean().optional().default(false).catch(false),
    /**
    Whether to show the sidebar
    @default true
  */
    showSidebar: z.boolean().optional().default(true).catch(true),
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
    /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
    searchHotKey: SearchHotKeyEnum.optional(),
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
    /** Prefill authentication */
    authentication: z.any().optional(), // Using any for Partial<AuthenticationState>
    /**
     * Route using paths instead of hashes, your server MUST support this
     * @example '/standalone-api-reference/:custom(.*)?'
     * @experimental
     * @default undefined
     */
    pathRouting: PathRoutingSchema.optional(),
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
    /** Base URL for the API server */
    baseServerURL: z.string().optional(),
    /** List of OpenAPI server objects */
    servers: z.array(z.any()).optional(), // Using any for OpenAPIV3_1.ServerObject
    /** Whether to include default fonts */
    withDefaultFonts: z.boolean().optional(),
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
    /** Integration type identifier */
    _integration: IntegrationEnum.optional(),
    /** Whether to hide the client button */
    hideClientButton: z.boolean().optional(),
  })
  .transform((originalConfiguration) => {
    const configuration = originalConfiguration

    // Migrate legacy theme variables
    if (configuration.customCss) {
      configuration.customCss = migrateThemeVariables(configuration.customCss)
    }

    // Migrate proxy URL
    if (configuration.proxy) {
      migrateProxyUrl(configuration)
    }

    return configuration
  })

/** Configuration (after parsing, internal) */
export type ApiReferenceConfigurationSchema = z.infer<typeof ApiReferenceConfigurationSchema>
/** Configuration (before parsing, for users) */
export type ApiReferenceConfiguration = z.input<typeof ApiReferenceConfigurationSchema>
