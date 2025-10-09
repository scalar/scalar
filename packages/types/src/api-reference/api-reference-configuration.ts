import { type ZodType, z } from 'zod'

import type { TargetId } from '../snippetz'
import { apiReferencePluginSchema } from './api-reference-plugin'
import type { AuthenticationConfiguration } from './authentication-configuration'
import { NEW_PROXY_URL, OLD_PROXY_URL, baseConfigurationSchema } from './base-configuration'
import { type SourceConfiguration, sourceConfigurationSchema } from './source-configuration'

// Zod Schemas don't work well with async functions, so we use a custom type instead.
const fetchLikeSchema = z.custom<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>()

/**
 * Standard configuration for the Api Reference.
 *
 * This is used internally to the configure the applications and does not include the sources.
 *
 * Sources should only be specified in the user facing configurations.
 *
 * In the the future it is likely sources will be removed completely from the configuration and instead
 * specified through a separate addDocument interface.
 */
export const apiReferenceConfigurationSchema = baseConfigurationSchema.extend({
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
   * Custom fetch function for custom logic
   *
   * Can be used to add custom headers, handle auth, etc.
   */
  fetch: fetchLikeSchema.optional(),
  /**
   * Plugins for the API reference
   */
  plugins: z.array(apiReferencePluginSchema).optional(),
  /**
   * Allows the user to inject an editor for the spec
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
   * Sets the file type of the document to download, set to `none` to hide the download button
   * @default 'both'
   */
  documentDownloadType: z.enum(['yaml', 'json', 'both', 'direct', 'none']).optional().default('both').catch('both'),
  /**
   * Whether to show the "Download OpenAPI Document" button
   * @default false
   * @deprecated Use `documentDownloadType: 'none'` instead
   */
  hideDownloadButton: z.boolean().optional(),
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
  /**
   * Whether to show the operationId
   *
   * @default false
   */
  showOperationId: z.boolean().optional().default(false).catch(false),
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
    .union([z.record(z.string(), z.union([z.boolean(), z.array(z.string())])), z.array(z.string()), z.literal(true)])
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
  onSpecUpdate: z
    .function({
      input: [z.string()],
      output: z.void(),
    })
    .optional(),
  /** onServerChange is fired on selected server change */
  onServerChange: z
    .function({
      input: [z.string()],
      output: z.void(),
    })
    .optional(),
  /** onDocumentSelect is fired when the config is selected */
  onDocumentSelect: z
    .function({
      input: [],
      // Why no output? https://github.com/scalar/scalar/pull/7047
      // output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional() as z.ZodType<(() => Promise<void> | void) | undefined>,
  /** Callback fired when the reference is fully loaded */
  onLoaded: z
    .function({
      input: [],
      // Why no output? https://github.com/scalar/scalar/pull/7047
      // output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional() as z.ZodType<(() => Promise<void> | void) | undefined>,
  /** onBeforeRequest is fired before the request is sent. You can modify the request here. */
  onBeforeRequest: z
    .function({
      input: [z.object({ request: z.instanceof(Request) })],
      // Why no output? https://github.com/scalar/scalar/pull/7047
      // output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional() as z.ZodType<((a: { request: Request }) => Promise<void> | void) | undefined>,
  /**
   * onShowMore is fired when the user clicks the "Show more" button on the references
   * @param tagId - The ID of the tag that was clicked
   */
  onShowMore: z
    .function({
      input: [z.string()],
      // Why no output? https://github.com/scalar/scalar/pull/7047
      // output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional() as z.ZodType<((a: string) => Promise<void> | void) | undefined>,
  /**
   * onSidebarClick is fired when the user clicks on a sidebar item
   * @param href - The href of the sidebar item that was clicked
   */
  onSidebarClick: z
    .function({
      input: [z.string()],
      // Why no output? https://github.com/scalar/scalar/pull/7047
      // output: z.union([z.void(), z.promise(z.void())]),
    })
    .optional() as z.ZodType<((a: string) => Promise<void> | void) | undefined>,
  /**
   * Route using paths instead of hashes, your server MUST support this
   * @example '/standalone-api-reference/:custom(.*)?'
   * @experimental
   * @default undefined
   */
  pathRouting: z
    .object({
      basePath: z.string(),
    })
    .optional(),
  /**
   * Customize the heading portion of the hash
   * @param heading - The heading object
   * @returns A string ID used to generate the URL hash
   * @default (heading) => `#description/${heading.slug}`
   */
  generateHeadingSlug: z
    .function({
      input: [z.object({ slug: z.string().default('headingSlug') })],
      output: z.string(),
    })
    .optional(),
  /**
   * Customize the model portion of the hash
   * @param model - The model object with a name property
   * @returns A string ID used to generate the URL hash
   * @default (model) => slug(model.name)
   */
  generateModelSlug: z
    .function({
      input: [z.object({ name: z.string().default('modelName') })],
      output: z.string(),
    })
    .optional(),
  /**
   * Customize the tag portion of the hash
   * @param tag - The tag object
   * @returns A string ID used to generate the URL hash
   * @default (tag) => slug(tag.name)
   */
  generateTagSlug: z
    .function({
      input: [z.object({ name: z.string().default('tagName') })],
      output: z.string(),
    })
    .optional(),
  /**
   * Customize the operation portion of the hash
   * @param operation - The operation object
   * @returns A string ID used to generate the URL hash
   * @default (operation) => `${operation.method}${operation.path}`
   */
  generateOperationSlug: z
    .function({
      input: [
        z.object({
          path: z.string(),
          operationId: z.string().optional(),
          method: z.string(),
          summary: z.string().optional(),
        }),
      ],
      output: z.string(),
    })
    .optional(),
  /**
   * Customize the webhook portion of the hash
   * @param webhook - The webhook object
   * @returns A string ID used to generate the URL hash
   * @default (webhook) => slug(webhook.name)
   */
  generateWebhookSlug: z
    .function({
      input: [
        z.object({
          name: z.string(),
          method: z.string().optional(),
        }),
      ],
      output: z.string(),
    })
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
  redirect: z
    .function({
      input: [z.string()],
      output: z.string().nullable().optional(),
    })
    .optional(),
  /**
   * Whether to include default fonts
   * @default true
   */
  withDefaultFonts: z.boolean().optional().default(true).catch(true),
  /**
   * Whether to expand all tags by default
   *
   * Warning this can cause performance issues on big documents
   * @default false
   */
  defaultOpenAllTags: z.boolean().optional().default(false).catch(false),
  /**
   * Whether to expand all models by default
   *
   * Warning this can cause performance issues on big documents
   * @default false
   */
  expandAllModelSections: z.boolean().optional().default(false).catch(false),
  /**
   * Whether to expand all responses by default
   *
   * Warning this can cause performance issues on big documents
   * @default false
   */
  expandAllResponses: z.boolean().optional().default(false).catch(false),
  /**
   * Function to sort tags
   * @default 'alpha' for alphabetical sorting
   */
  tagsSorter: z
    .union([
      z.literal('alpha'),
      z.function({
        input: [z.any(), z.any()],
        output: z.number(),
      }),
    ])
    .optional(),
  /**
   * Function to sort operations
   * @default 'alpha' for alphabetical sorting
   */
  operationsSorter: z
    .union([
      z.literal('alpha'),
      z.literal('method'),
      z.function({
        input: [z.any(), z.any()],
        output: z.number(),
      }),
    ])
    .optional(),
  /**
   * Order the schema properties by
   * @default 'alpha' for alphabetical sorting
   */
  orderSchemaPropertiesBy: z
    .union([z.literal('alpha'), z.literal('preserve')])
    .optional()
    .default('alpha')
    .catch('alpha'),
  /**
   * Sort the schema properties by required ones first
   * @default true
   */
  orderRequiredPropertiesFirst: z.boolean().optional().default(true).catch(true),
})

/**
 * Configuration for the Scalar Api Reference integrations
 *
 * See the type `ApiReferenceConfigurationWithSource` or `AnyApiReferenceConfiguration`\
 * for the configuration that includes the sources for you OpenAPI documents
 */
export type ApiReferenceConfiguration = Omit<
  z.infer<typeof apiReferenceConfigurationSchema>, // Remove deprecated attributes
  'proxy' | 'spec' | 'authentication'
> & {
  authentication?: AuthenticationConfiguration
} & {
  /** @deprecated
   * This type now refers to the base configuration that does not include the sources.
   * Use the type `ApiReferenceConfigurationWithSource` instead.
   */
  url?: SourceConfiguration['url']
  /** @deprecated
   * This type now refers to the base configuration that does not include the sources.
   * Use the type `ApiReferenceConfigurationWithSource` instead.
   */
  content?: SourceConfiguration['content']
}

/** Migrate the configuration through a transform */
// const migrateConfiguration = <T extends z.infer<typeof _apiReferenceConfigurationSchema>>

/** Configuration for the Api Reference */
export const apiReferenceConfigurationWithSourceSchema: ZodType<
  Omit<ApiReferenceConfiguration, 'url' | 'content'> & SourceConfiguration
> = apiReferenceConfigurationSchema.extend(sourceConfigurationSchema.shape).transform((configuration) => {
  // Migrate hideDownloadButton to documentDownloadType
  if (configuration.hideDownloadButton) {
    console.warn(
      `[DEPRECATED] You're using the deprecated 'hideDownloadButton' attribute. Use 'documentDownloadType: 'none'' instead.`,
    )

    configuration.documentDownloadType = 'none'
  }

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
})

/**
 * User facing configuration that includes the document source configuration
 */
export type ApiReferenceConfigurationWithSource = Omit<
  z.infer<typeof apiReferenceConfigurationWithSourceSchema>,
  // Remove deprecated attributes
  'proxy' | 'spec' | 'authentication'
> & {
  authentication?: AuthenticationConfiguration
}

/**
 * When providing an array of configurations we extend with the default attribute
 * which indicates which configuration should be used as the default one
 */
export type ApiReferenceConfigurationWithDefault = ApiReferenceConfigurationWithSource & {
  /** Whether to use this config as the default one */
  default?: boolean
}

/**
 * Configuration for a single config with multiple sources
 * The configuration will be shared between the documents
 */
export type ApiReferenceConfigurationWithMultipleSources = ApiReferenceConfigurationWithSource & {
  sources: (SourceConfiguration & { default?: boolean })[]
}

/** Configuration for multiple Api References */
export type AnyApiReferenceConfiguration =
  | Partial<ApiReferenceConfigurationWithSource>
  | Partial<ApiReferenceConfigurationWithMultipleSources>
  | Partial<ApiReferenceConfigurationWithDefault>[]
  | Partial<ApiReferenceConfigurationWithMultipleSources>[]

/** Typeguard to check to narrow the configs to the one with sources */
export const isConfigurationWithSources = (
  config: AnyApiReferenceConfiguration,
): config is Partial<ApiReferenceConfigurationWithMultipleSources> =>
  Boolean(!Array.isArray(config) && config && 'sources' in config && Array.isArray(config.sources))
