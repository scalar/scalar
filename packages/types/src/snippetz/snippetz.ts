import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { Request as HarRequest } from 'har-format'

export type {
  Param as FormDataParam,
  PostDataCommon,
  Request as HarRequest,
  Response as HarResponse,
} from 'har-format'

/**
 * Maps programming languages and environments to their available HTTP clients.
 * Each key is a target (language/environment), and each value is an array of
 * client identifiers in the format `target/client`.
 *
 * This is the source of truth for all supported code generation targets.
 */
export const GROUPED_CLIENTS = {
  c: ['libcurl'],
  clojure: ['clj_http'],
  csharp: ['httpclient', 'restsharp'],
  dart: ['http'],
  fsharp: ['httpclient'],
  go: ['native'],
  http: ['http1.1'],
  java: ['asynchttp', 'nethttp', 'okhttp', 'unirest'],
  js: ['axios', 'fetch', 'jquery', 'ofetch', 'xhr'],
  kotlin: ['okhttp'],
  node: ['axios', 'fetch', 'ofetch', 'undici'],
  objc: ['nsurlsession'],
  ocaml: ['cohttp'],
  php: ['curl', 'guzzle'],
  powershell: ['restmethod', 'webrequest'],
  python: ['python3', 'requests', 'httpx_sync', 'httpx_async'],
  r: ['httr'],
  ruby: ['native'],
  rust: ['reqwest'],
  shell: ['curl', 'httpie', 'wget'],
  swift: ['nsurlsession'],
} as const

/**
 * Flat array of all available client identifiers.
 * Each identifier follows the format `target/client` (e.g., `js/fetch`, `python/requests`).
 */
export const AVAILABLE_CLIENTS = objectEntries(GROUPED_CLIENTS).flatMap(([group, clients]) =>
  clients.map((client) => `${group}/${client}` as const),
)

/**
 * All available client identifiers in array format
 * @example
 * ```typescript
 * const clients: AvailableClients = ['js/fetch', 'python/requests', 'shell/curl']
 * ```
 */
export type AvailableClients = typeof AVAILABLE_CLIENTS

/**
 * A single available client identifier.
 * @example
 * ```typescript
 * const client: AvailableClient = 'js/fetch'
 * ```
 */
export type AvailableClient = AvailableClients[number]

/**
 * A programming language or environment identifier.
 * @example
 * ```typescript
 * const targetId: TargetId = 'js'
 * ```
 */
export type TargetId = keyof typeof GROUPED_CLIENTS

/**
 * Extracts the client name from a full client identifier for a given target.
 * For example, for target `js`, this extracts `fetch` from `js/fetch`.
 *
 * @template T - The target identifier (e.g., `js`, `python`)
 */
export type ClientId<T extends TargetId> = (typeof GROUPED_CLIENTS)[T][number]

/**
 * Configuration for a specific target (language/environment).
 * Contains metadata about the target and its available clients.
 */
export type Target = {
  [K in TargetId]: {
    /** The unique identifier for this target. */
    key: K
    /** Human-readable name for the target. */
    title: string
    /** The default client to use for this target. */
    default: ClientId<K>
    /** All available client plugins for this target. */
    clients: Plugin[]
  }
}[TargetId]

/**
 * A code generation plugin for a specific HTTP client.
 * Each plugin knows how to convert an HTTP request into source code
 * for its target language and client library.
 */
export type Plugin = {
  /** The language or environment this plugin targets. */
  target: TargetId
  /** The identifier of the HTTP client within the target. */
  client: ClientId<TargetId>
  /** Human-readable name for the client. */
  title: string
  /** Generates source code for the given HTTP request. */
  generate: (request?: Partial<HarRequest>, configuration?: PluginConfiguration) => string
}

/**
 * Optional configuration that can be passed to any code generation plugin.
 * Plugins may use this to customize the generated code.
 */
export type PluginConfiguration = {
  /** Credentials for HTTP Basic Authentication. */
  auth?: {
    username: string
    password: string
  }
}
