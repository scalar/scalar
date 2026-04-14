import { any, array, boolean, coerce, intersection, literal, object, optional, record, string, union, fn } from "@scalar/validation"
import { baseConfigurationSchema } from "./base-configuration"
import { sourceConfigurationSchema } from "./source-configuration"
import { apiReferencePluginSchema } from "@/api-reference/api-reference-plugin"

export const apiReferenceConfigurationSchema = intersection([
  baseConfigurationSchema,
  sourceConfigurationSchema,
  object({
    layout: union([
      literal('modern'),
      literal('classic'),
    ], {
      typeComment: 'The layout to use for the references',
    }),
    proxy: optional(string(), {
      typeComment: '@deprecated Use proxyUrl instead',
    }),
    fetch: optional(fn<typeof fetch>(), {
      typeComment: 'Custom fetch function for custom logic. Can be used to add custom headers, handle auth, etc.',
    }),
    plugins: optional(array(apiReferencePluginSchema), {
      typeComment: 'Plugins for the API reference',
    }),
    isEditable: boolean({
      default: false,
      typeComment: 'Allows the user to inject an editor for the spec',
    }),
    isLoading: boolean({
      default: false,
      typeComment: 'Controls whether the references show a loading state in the intro',
    }),
    hideModels: boolean({
      default: false,
      typeComment: 'Whether to show models in the sidebar, search, and content.',
    }),
    documentDownloadType: union([
      literal('both'),
      literal('yaml'),
      literal('json'),
      literal('direct'),
      literal('none'),
    ], {
      typeComment: 'Sets the file type of the document to download, set to `none` to hide the download button',
    }),
    hideDownloadButton: optional(boolean(), {
      typeComment: '@deprecated Use `documentDownloadType: \'none\'` instead',
    }),
    hideTestRequestButton: boolean({
      default: false,
      typeComment: 'Whether to show the "Test Request" button',
    }),
    hideSearch: boolean({
      default: false,
      typeComment: 'Whether to show the sidebar search bar',
    }),
    showOperationId: boolean({
      default: false,
      typeComment: 'Whether to show the operationId',
    }),
    darkMode: optional(boolean(), {
      typeComment: 'Whether dark mode is on or off initially (light mode)',
    }),
    forceDarkModeState: optional(union([
      literal('dark'),
      literal('light'),
    ]), {
      typeComment: 'forceDarkModeState makes it always this state no matter what',
    }),
    hideDarkModeToggle: boolean({
      default: false,
      typeComment: 'Whether to show the dark mode toggle',
    }),
    metaData: optional(any(), {
      typeComment: 'If used, passed data will be added to the HTML header. @see https://unhead.unjs.io/usage/composables/use-seo-meta',
    }),
    favicon: optional(string(), {
      typeComment: 'Path to a favicon image',
    }),
    hiddenClients: optional(union([
      record(string(), union([boolean(), array(string())])),
      array(string()),
      literal(true),
    ]), {
      typeComment: 'List of httpsnippet clients to hide from the clients menu. By default hides Unirest, pass `[]` to show all clients',
    }),
    defaultHttpClient: optional(object({
      targetKey: string(),
      clientKey: string(),
    }), {
      typeComment: 'Determine the HTTP client that is selected by default',
    }),
    customCss: optional(string(), {
      typeComment: 'Custom CSS to be added to the page',
    }),
    onSpecUpdate: optional(fn<(input: string) => void>(), {
      typeComment: 'onSpecUpdate is fired on spec/swagger content change',
    }),
    onServerChange: optional(fn<(input: string) => void>(), {
      typeComment: 'onServerChange is fired on selected server change',
    }),
    onDocumentSelect: optional(fn<() => void>(), {
      typeComment: 'onDocumentSelect is fired when the config is selected',
    }),
    onLoaded: optional(fn<(slug: string) => Promise<void> | void>(), {
      typeComment: 'Callback fired when the reference is fully loaded',
    }),
    onBeforeRequest: optional(fn<(input: { request: Request; requestBuilder: unknown; envVariables: Record<string, string> }) => Promise<void> | void>(), {
      typeComment: 'Fired before the outbound request is built; callback receives a mutable request builder. Experimental API.',
    }),
    onShowMore: optional(fn<(tagId: string) => Promise<void> | void>(), {
      typeComment: 'onShowMore is fired when the user clicks the "Show more" button on the references',
    }),
    onSidebarClick: optional(fn<(href: string) => Promise<void> | void>(), {
      typeComment: 'onSidebarClick is fired when the user clicks on a sidebar item',
    }),
    pathRouting: optional(object({
      basePath: string(),
    }), {
      typeComment: 'Route using paths instead of hashes, your server MUST support this. @experimental',
    }),
    mcp: optional(object({
      name: optional(string(), {
        typeComment: 'Display name for the MCP server',
      }),
      url: optional(string(), {
        typeComment: 'URL of the MCP server',
      }),
      disabled: optional(boolean(), {
        typeComment: 'When true, disables the MCP integration',
      }),
    }), {
      typeComment: 'MCP (Model Context Protocol) configuration. When provided, enables MCP integration with the given name and url.',
    }),
    generateHeadingSlug: optional(fn<(input: { slug?: string }) => string>(), {
      typeComment: 'Customize the heading portion of the hash',
    }),
    generateModelSlug: optional(fn<(input: { name?: string }) => string>(), {
      typeComment: 'Customize the model portion of the hash',
    }),
    generateTagSlug: optional(fn<(input: { name?: string }) => string>(), {
      typeComment: 'Customize the tag portion of the hash',
    }),
    generateOperationSlug: optional(fn<(input: { path: string; operationId?: string; method: string; summary?: string }) => string>(), {
      typeComment: 'Customize the operation portion of the hash',
    }),
    generateWebhookSlug: optional(fn<(input: { name: string; method?: string }) => string>(), {
      typeComment: 'Customize the webhook portion of the hash',
    }),
    redirect: optional(fn<(input: string) => string | null | undefined>(), {
      typeComment: 'To handle redirects, pass a function that receives the current path/hash and passes that to history.replaceState',
    }),
    withDefaultFonts: boolean({
      default: true,
      typeComment: 'Whether to include default fonts',
    }),
    defaultOpenFirstTag: boolean({
      default: true,
      typeComment: 'Whether to expand the first tag in the sidebar when no specific URL target is present',
    }),
    defaultOpenAllTags: boolean({
      default: false,
      typeComment: 'Whether to expand all tags by default. Warning: this can cause performance issues on big documents',
    }),
    expandAllModelSections: boolean({
      default: false,
      typeComment: 'Whether to expand all models by default. Warning: this can cause performance issues on big documents',
    }),
    expandAllResponses: boolean({
      default: false,
      typeComment: 'Whether to expand all responses by default. Warning: this can cause performance issues on big documents',
    }),
    tagsSorter: optional(union([
      literal('alpha'),
      fn<(a: any, b: any) => number>(),
    ]), {
      typeComment: 'Function to sort tags',
    }),
    operationsSorter: optional(union([
      literal('alpha'),
      literal('method'),
      fn<(a: any, b: any) => number>(),
    ]), {
      typeComment: 'Function to sort operations',
    }),
    orderSchemaPropertiesBy: union([
      literal('alpha'),
      literal('preserve'),
    ], {
      typeComment: 'Order the schema properties by',
    }),
    orderRequiredPropertiesFirst: boolean({
      default: true,
      typeComment: 'Sort the schema properties by required ones first',
    }),
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

    // @ts-expect-error - We're deleting the deprecated attribute
    delete input.showToolbar
  }

  return input
}