import type { Request as HarRequest } from 'har-format'

export type { Request as HarRequest, Param as FormDataParam } from 'har-format'

/**
 * List of available clients
 */
export const AVAILABLE_CLIENTS = [
  'c/libcurl',
  'clojure/clj_http',
  'csharp/httpclient',
  'csharp/restsharp',
  'dart/http',
  'go/native',
  'http/http1.1',
  'java/asynchttp',
  'java/nethttp',
  'java/okhttp',
  'java/unirest',
  'js/axios',
  'js/fetch',
  'js/jquery',
  'js/ofetch',
  'js/xhr',
  'kotlin/okhttp',
  'node/axios',
  'node/fetch',
  'node/ofetch',
  'node/undici',
  'objc/nsurlsession',
  'ocaml/cohttp',
  'php/curl',
  'php/guzzle',
  'powershell/restmethod',
  'powershell/webrequest',
  'python/python3',
  'python/requests',
  'python/httpx_sync',
  'python/httpx_async',
  'r/httr',
  'ruby/native',
  'rust/reqwest',
  'shell/curl',
  'shell/httpie',
  'shell/wget',
  'swift/nsurlsession',
] as const

export type AvailableClients = typeof AVAILABLE_CLIENTS

/** Programming language */
export type TargetId = AvailableClients[number] extends `${infer T}/${string}` ? T : never

/** Configuration for a target */
export type Target = {
  [K in TargetId]: {
    key: K
    title: string
    default: ClientId<K>
    clients: Plugin[]
  }
}[TargetId]

/** HTTP client */
export type ClientId<T extends string> = T extends TargetId
  ? Extract<AvailableClients[number], `${T}/${string}`> extends `${T}/${infer C}`
    ? C
    : never
  : never

/** What any plugins needs to return */
export type Plugin = {
  /** The language or environment. */
  target: TargetId
  /** The identifier of the client. */
  client: ClientId<TargetId>
  /** The title of the client. */
  title: string
  /** The actual source code. */
  generate: (request?: Partial<HarRequest>, configuration?: PluginConfiguration) => string
}

/**
 * Optional configuration for any plugin
 */
export type PluginConfiguration = {
  /** Credentials to add HTTP Basic Authentication */
  auth?: { username: string; password: string }
}
