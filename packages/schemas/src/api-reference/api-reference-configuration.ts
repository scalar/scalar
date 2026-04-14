import { any, array, boolean, coerce, intersection, literal, object, optional, record, string, union, fn } from "@scalar/validation"
import { baseConfigurationSchema } from "./base-configuration"
import { sourceConfigurationSchema } from "./source-configuration"
import { apiReferencePluginSchema } from "@/api-reference/api-reference-plugin"

export const apiReferenceConfigurationSchema = intersection([
  baseConfigurationSchema,
  sourceConfigurationSchema,
  object({
    layout: optional(union([
      literal('modern'),
      literal('classic'),
    ])),
    proxy: optional(string()),
    fetch: optional(fn<typeof fetch>()),
    plugins: optional(array(apiReferencePluginSchema)),
    isEditable: optional(boolean()),
    isLoading: optional(boolean()),
    hideModels: optional(boolean()),
    documentDownloadType: optional(union([
      literal('both'),
      literal('json'),
      literal('yaml'),
      literal('direct'),
      literal('none'),
    ])),
    hideDownloadButton: optional(boolean()),
    hideTestRequestButton: optional(boolean()),
    hideSearch: optional(boolean()),
    showOperationId: optional(boolean()),
    darkMode: optional(boolean()),
    forceDarkModeState: optional(union([
      literal('dark'),
      literal('light'),
    ])),
    hideDarkModeToggle: optional(boolean()),
    metaData: optional(any()),
    favicon: optional(string()),
    hiddenClients: optional(union([
      record(string(), union([boolean(), array(string())])),
      array(string()),
      literal(true),
    ])),
    defaultHttpClient: optional(object({
      targetKey: string(),
      clientKey: string(),
    })),
    customCss: optional(string()),
    onSpecUpdate: optional(fn<(input: string) => void>()),
    onServerChange: optional(fn<(input: string) => void>()),
    onDocumentSelect: optional(fn<() => void>()),
    onLoaded: optional(fn<(slug: string) => Promise<void> | void>()),
    onBeforeRequest: optional(fn<(input: { request: Request; requestBuilder: unknown; envVariables: Record<string, string> }) => Promise<void> | void>()),
    onShowMore: optional(fn<(tagId: string) => Promise<void> | void>()),
    onSidebarClick: optional(fn<(href: string) => Promise<void> | void>()),
    pathRouting: optional(object({
      basePath: string(),
    })),
    mcp: optional(object({
      name: optional(string()),
      url: optional(string()),
      disabled: optional(boolean()),
    })),
    generateHeadingSlug: optional(fn<(input: { slug: string }) => string>()),
    generateModelSlug: optional(fn<(input: { name: string }) => string>()),
    generateTagSlug: optional(fn<(input: { name: string }) => string>()),
    generateOperationSlug: optional(fn<(input: { path: string; operationId?: string; method: string; summary?: string }) => string>()),
    generateWebhookSlug: optional(fn<(input: { name: string; method?: string }) => string>()),
    redirect: optional(fn<(input: string) => string | null | undefined>()),
    withDefaultFonts: optional(boolean()),
    defaultOpenFirstTag: optional(boolean()),
    defaultOpenAllTags: optional(boolean()),
    expandAllModelSections: optional(boolean()),
    expandAllResponses: optional(boolean()),
    tagsSorter: optional(union([
      literal('alpha'),
      fn<(a: any, b: any) => number>(),
    ])),
    operationsSorter: optional(union([
      literal('alpha'),
      literal('method'),
      fn<(a: any, b: any) => number>(),
    ])),
    orderSchemaPropertiesBy: optional(union([
      literal('alpha'),
      literal('preserve'),
    ])),
    orderRequiredPropertiesFirst: optional(boolean()),
  }),
])

export const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
const NEW_PROXY_URL = 'https://proxy.scalar.com'

export const apiReferenceConfigurationWithSourceSchema = (rawInput: unknown) => {
  const input = coerce(apiReferenceConfigurationSchema, rawInput)

  if (input.hideDownloadButton) {
    console.warn(
      `[DEPRECATED] You're using the deprecated 'hideDownloadButton' attribute. Use 'documentDownloadType: 'none'' instead.`,
    )

    input.documentDownloadType = 'none'
  }

  if (input.spec?.url) {
    console.warn(
      `[DEPRECATED] You're using the deprecated 'spec.url' attribute. Remove the spec prefix and move the 'url' attribute to the top level.`,
    )

    input.url = input.spec.url
    delete input.spec
  }
  
  if (input.spec?.content) {
    console.warn(
      `[DEPRECATED] You're using the deprecated 'spec.content' attribute. Remove the spec prefix and move the 'content' attribute to the top level.`,
    )

    input.content = input.spec.content
    delete input.spec
  }
  
  if (input.proxy) {
    console.warn(
      `[DEPRECATED] You're using the deprecated 'proxy' attribute. Use 'proxyUrl' instead.`,
    )

    input.proxyUrl = input.proxy
    delete input.proxy
  }

  if (input.proxyUrl === OLD_PROXY_URL) {
    console.warn(`[DEPRECATED] Warning: configuration.proxyUrl points to our old proxy (${OLD_PROXY_URL}).`)
    console.warn(`[DEPRECATED] We are overwriting the value and use the new proxy URL (${NEW_PROXY_URL}) instead.`)
    console.warn(
      `[DEPRECATED] Action Required: You should manually update your configuration to use the new URL (${NEW_PROXY_URL}). Read more: https://github.com/scalar/scalar`,
    )

    input.proxyUrl = NEW_PROXY_URL
  }

  if (input.showToolbar && input.showToolbar !== 'localhost') {
    console.warn(`[DEPRECATED] You're using the deprecated 'showToolbar' attribute. Use 'showDeveloperTools' instead.`)

    input.showDeveloperTools = input.showToolbar

    delete input.showToolbar
  }

  return input
}