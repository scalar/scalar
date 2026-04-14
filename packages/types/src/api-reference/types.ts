type ApiReferencePlugin = () => {
  name: string;
  extensions: {
    name: string;
    component: unknown;
    renderer?: unknown;
  }[];
  views: {
    'content.end': {
      component: unknown;
      renderer?: unknown;
      props?: Record<string, any>;
    }[];
  };
};

type BaseConfiguration = {
  /** The title of the OpenAPI document. */
  title?: string;
  /** The slug of the OpenAPI document used in the URL. If none is passed, the title will be used. If no title is used, it will just use the index. */
  slug?: string;
  /** Prefill authentication */
  authentication?: any;
  /** Base URL for the API server */
  baseServerURL?: string;
  /** Whether to hide the client button */
  hideClientButton: boolean;
  /** URL to a request proxy for the API client */
  proxyUrl?: string;
  /** Default OAuth 2.0 redirect URI used to prefill auth flows in the API client. */
  oauth2RedirectUri?: string;
  /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey?: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
  /** List of OpenAPI server objects */
  servers?: string[];
  /** Whether to show the sidebar */
  showSidebar?: boolean;
  /** Whether and when to show the developer tools. */
  showDeveloperTools?: "localhost" | "always" | "never";
  /** @deprecated Use showDeveloperTools instead */
  showToolbar?: "localhost" | "always" | "never";
  /** Whether to use the operation summary or the operation path for the sidebar and search */
  operationTitleSource?: "summary" | "path";
  /** A string to use one of the color presets */
  theme?: "default" | "alternate" | "moon" | "purple" | "solarized" | "bluePlanet" | "deepSpace" | "saturn" | "kepler" | "elysiajs" | "fastify" | "mars" | "laserwave" | "none";
  /** Integration type identifier */
  _integration?: "adonisjs" | "astro" | "docusaurus" | "dotnet" | "elysiajs" | "express" | "fastapi" | "fastify" | "go" | "hono" | "html" | "laravel" | "litestar" | "nestjs" | "nextjs" | "nitro" | "nuxt" | "platformatic" | "react" | "rust" | "svelte" | "vue";
  /** onRequestSent is fired when a request is sent */
  onRequestSent?: (input: string) => void;
  /** Whether to persist auth to local storage */
  persistAuth?: boolean;
  /** Enables / disables telemetry */
  telemetry?: boolean;
  /** External service URLs used by Scalar packages */
  externalUrls: {
    dashboardUrl: string;
    registryUrl: string;
    proxyUrl: string;
    apiBaseUrl: string;
  };
}

type SourceConfiguration = {
  default?: boolean;
  /** URL to an OpenAPI/Swagger document */
  url?: string;
  /** Directly embed the OpenAPI document. Can be a string, object, function returning an object, or null. It is recommended to pass a URL instead of content. */
  content?: string | null | (Record<string, any>) | (() => string | any);
  /** The title of the OpenAPI document. @deprecated Please move `title` to the top level and remove the `spec` prefix. */
  title?: string;
  /** The slug of the OpenAPI document used in the URL. @deprecated Please move `slug` to the top level and remove the `spec` prefix. */
  slug?: string;
  /** @deprecated Use `url` and `content` on the top level instead. */
  spec?: {
    url?: string;
    content?: string | null | (Record<string, any>) | (() => string | any);
  };
  /** Agent Scalar configuration */
  agent?: {
    key?: string;
    disabled?: boolean;
    /** When true, hide the control to add more APIs in the agent chat. Only preloaded/registry documents are shown; the public API list is not offered. */
    hideAddApi?: boolean;
  };
}

export type ApiReferenceConfiguration = BaseConfiguration & SourceConfiguration & ({
  /** The layout to use for the references */
  layout?: "modern" | "classic";
  /** @deprecated Use proxyUrl instead */
  proxy?: string;
  /** Custom fetch function for custom logic. Can be used to add custom headers, handle auth, etc. */
  fetch?: typeof fetch;
  /** Plugins for the API reference */
  plugins?: ApiReferencePlugin[];
  /** Allows the user to inject an editor for the spec */
  isEditable?: boolean;
  /** Controls whether the references show a loading state in the intro */
  isLoading?: boolean;
  /** Whether to show models in the sidebar, search, and content. */
  hideModels?: boolean;
  /** Sets the file type of the document to download, set to `none` to hide the download button */
  documentDownloadType?: "both" | "json" | "yaml" | "direct" | "none";
  /** @deprecated Use `documentDownloadType: 'none'` instead */
  hideDownloadButton?: boolean;
  /** Whether to show the "Test Request" button */
  hideTestRequestButton?: boolean;
  /** Whether to show the sidebar search bar */
  hideSearch?: boolean;
  /** Whether to show the operationId */
  showOperationId?: boolean;
  /** Whether dark mode is on or off initially (light mode) */
  darkMode?: boolean;
  /** forceDarkModeState makes it always this state no matter what */
  forceDarkModeState?: "dark" | "light";
  /** Whether to show the dark mode toggle */
  hideDarkModeToggle?: boolean;
  /** If used, passed data will be added to the HTML header. @see https://unhead.unjs.io/usage/composables/use-seo-meta */
  metaData?: any;
  /** Path to a favicon image */
  favicon?: string;
  /** List of httpsnippet clients to hide from the clients menu. By default hides Unirest, pass `[]` to show all clients */
  hiddenClients?: (Record<string, boolean | (string[])>) | (string[]) | true;
  /** Determine the HTTP client that is selected by default */
  defaultHttpClient?: {
    targetKey: string;
    clientKey: string;
  };
  /** Custom CSS to be added to the page */
  customCss?: string;
  /** onSpecUpdate is fired on spec/swagger content change */
  onSpecUpdate?: (input: string) => void;
  /** onServerChange is fired on selected server change */
  onServerChange?: (input: string) => void;
  /** onDocumentSelect is fired when the config is selected */
  onDocumentSelect?: () => void | Promise<void>;
  /** Callback fired when the reference is fully loaded */
  onLoaded?: (slug: string) => void | Promise<void>;
  /** Fired before the outbound request is built; callback receives a mutable request builder. Experimental API. */
  onBeforeRequest?: (input: { request: Request; requestBuilder: any; envVariables: Record<string, string> }) => void | Promise<void>;
  /** onShowMore is fired when the user clicks the "Show more" button on the references */
  onShowMore?: (tagId: string) => void | Promise<void>;
  /** onSidebarClick is fired when the user clicks on a sidebar item */
  onSidebarClick?: (href: string) => void | Promise<void>;
  /** Route using paths instead of hashes, your server MUST support this. @experimental */
  pathRouting?: {
    basePath: string;
  };
  /** MCP (Model Context Protocol) configuration. When provided, enables MCP integration with the given name and url. */
  mcp?: {
    /** Display name for the MCP server */
    name?: string;
    /** URL of the MCP server */
    url?: string;
    /** When true, disables the MCP integration */
    disabled?: boolean;
  };
  /** Customize the heading portion of the hash */
  generateHeadingSlug?: (input: { slug: string }) => string;
  /** Customize the model portion of the hash */
  generateModelSlug?: (input: { name: string }) => string;
  /** Customize the tag portion of the hash */
  generateTagSlug?: (input: { name: string }) => string;
  /** Customize the operation portion of the hash */
  generateOperationSlug?: (input: { path: string; operationId?: string; method: string; summary?: string }) => string;
  /** Customize the webhook portion of the hash */
  generateWebhookSlug?: (input: { name: string; method?: string }) => string;
  /** To handle redirects, pass a function that receives the current path/hash and passes that to history.replaceState */
  redirect?: (input: string) => string | null | undefined;
  /** Whether to include default fonts */
  withDefaultFonts?: boolean;
  /** Whether to expand the first tag in the sidebar when no specific URL target is present */
  defaultOpenFirstTag?: boolean;
  /** Whether to expand all tags by default. Warning: this can cause performance issues on big documents */
  defaultOpenAllTags?: boolean;
  /** Whether to expand all models by default. Warning: this can cause performance issues on big documents */
  expandAllModelSections?: boolean;
  /** Whether to expand all responses by default. Warning: this can cause performance issues on big documents */
  expandAllResponses?: boolean;
  /** Function to sort tags */
  tagsSorter?: "alpha" | ((a: any, b: any) => number);
  /** Function to sort operations */
  operationsSorter?: "alpha" | "method" | ((a: any, b: any) => number);
  /** Order the schema properties by */
  orderSchemaPropertiesBy?: "alpha" | "preserve";
  /** Sort the schema properties by required ones first */
  orderRequiredPropertiesFirst?: boolean;
})


// Remove deprecated attributes
export type ApiReferenceConfigurationWithSource = Omit<ApiReferenceConfiguration, 'proxy' | 'spec' | 'authentication' | 'showToolbar'> & {
  // Add the correct type for authentication
  authentication?: any;
}

/**
 * Configuration for a single config with multiple sources
 * The configuration will be shared between the documents
 */
export type ApiReferenceConfigurationWithMultipleSources = ApiReferenceConfigurationWithSource & {
  sources: SourceConfiguration[];
}

/** Configuration for multiple Api References */
export type AnyApiReferenceConfiguration =
  | Partial<ApiReferenceConfigurationWithSource>
  | Partial<ApiReferenceConfigurationWithMultipleSources>
  | Partial<ApiReferenceConfigurationWithSource>[]
  | Partial<ApiReferenceConfigurationWithMultipleSources>[]

  /** Typeguard to check to narrow the configs to the one with sources */
export const isConfigurationWithSources = (
  config: AnyApiReferenceConfiguration,
): config is Partial<ApiReferenceConfigurationWithMultipleSources> =>
  Boolean(!Array.isArray(config) && config && 'sources' in config && Array.isArray(config.sources))
