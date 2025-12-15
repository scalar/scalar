import type { Request as HarRequest } from 'har-format'
import type { Split } from 'type-fest'

export type {
  Param as FormDataParam,
  PostDataCommon,
  Request as HarRequest,
} from 'har-format'

/**
 * Maps programming languages and environments to their available HTTP clients.
 * Each key is a target (language/environment), and each value is an array of
 * client identifiers in the format `target/client`.
 *
 * This is the source of truth for all supported code generation targets.
 */
export const GROUPED_CLIENTS = {
  c: ['c/libcurl'],
  clojure: ['clojure/clj_http'],
  csharp: ['csharp/httpclient', 'csharp/restsharp'],
  dart: ['dart/http'],
  fsharp: ['fsharp/httpclient'],
  go: ['go/native'],
  http: ['http/http1.1'],
  java: ['java/asynchttp', 'java/nethttp', 'java/okhttp', 'java/unirest'],
  js: ['js/axios', 'js/fetch', 'js/jquery', 'js/ofetch', 'js/xhr'],
  kotlin: ['kotlin/okhttp'],
  node: ['node/axios', 'node/fetch', 'node/ofetch', 'node/undici'],
  objc: ['objc/nsurlsession'],
  ocaml: ['ocaml/cohttp'],
  php: ['php/curl', 'php/guzzle'],
  powershell: ['powershell/restmethod', 'powershell/webrequest'],
  python: ['python/python3', 'python/requests', 'python/httpx_sync', 'python/httpx_async'],
  r: ['r/httr'],
  ruby: ['ruby/native'],
  rust: ['rust/reqwest'],
  shell: ['shell/curl', 'shell/httpie', 'shell/wget'],
  swift: ['swift/nsurlsession'],
} as const

/**
 * Flat array of all available client identifiers.
 * Each identifier follows the format `target/client` (e.g., `js/fetch`, `python/requests`).
 */
export const AVAILABLE_CLIENTS = Object.values(GROUPED_CLIENTS).flat()

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
export type ClientId<T extends TargetId> = Split<(typeof GROUPED_CLIENTS)[T][number], '/'>[1]

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
