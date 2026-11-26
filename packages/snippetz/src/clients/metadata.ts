import type { ClientId, TargetId } from '@scalar/types/snippetz'

/**
 * Everything the client selector needs to know about a plugin, without its `generate` function.
 */
export type PluginMetadata = {
  [T in TargetId]: {
    /** The language or environment this plugin targets. */
    target: T
    /** The identifier of the HTTP client within the target. */
    client: ClientId<T>
    /** Human-readable name for the client. */
    title: string
  }
}[TargetId]

/**
 * Every `target/client` pair that exists. Unlike `AvailableClient`, each target is only paired with its
 * own clients, so a record keyed by it must list exactly the built-in clients.
 */
export type PluginId = { [T in TargetId]: `${T}/${ClientId<T>}` }[TargetId]

/**
 * A target (language or environment) and the metadata of its clients, without any generator code.
 */
export type TargetMetadata = {
  [K in TargetId]: {
    /** The unique identifier for this target. */
    key: K
    /** Human-readable name for the target. */
    title: string
    /** The default client to use for this target. */
    default: ClientId<K>
    /** Metadata for all client plugins of this target, in display order. */
    clients: PluginMetadata[]
  }
}[TargetId]

/**
 * Static metadata for every built-in client: the single list of targets, their titles and defaults, and
 * the order of their clients. `clients` from `@scalar/snippetz/clients` is built from it.
 *
 * This module deliberately imports no plugin implementation, so a client selector can list every client
 * without pulling the generators into the bundle. Client titles also live on the plugins, which need them
 * without this list, so a test keeps those two in sync.
 */
export const clientsMetadata: TargetMetadata[] = [
  {
    key: 'c',
    title: 'C',
    default: 'libcurl',
    clients: [{ target: 'c', client: 'libcurl', title: 'Libcurl' }],
  },
  {
    key: 'csharp',
    title: 'C#',
    default: 'restsharp',
    clients: [
      { target: 'csharp', client: 'httpclient', title: 'HttpClient' },
      { target: 'csharp', client: 'restsharp', title: 'RestSharp' },
    ],
  },
  {
    key: 'clojure',
    title: 'Clojure',
    default: 'clj_http',
    clients: [{ target: 'clojure', client: 'clj_http', title: 'clj-http' }],
  },
  {
    key: 'dart',
    title: 'Dart',
    default: 'http',
    clients: [{ target: 'dart', client: 'http', title: 'Http' }],
  },
  {
    key: 'fsharp',
    title: 'F#',
    default: 'httpclient',
    clients: [{ target: 'fsharp', client: 'httpclient', title: 'HttpClient' }],
  },
  {
    key: 'go',
    title: 'Go',
    default: 'native',
    clients: [{ target: 'go', client: 'native', title: 'NewRequest' }],
  },
  {
    key: 'http',
    title: 'HTTP',
    default: 'http1.1',
    clients: [{ target: 'http', client: 'http1.1', title: 'HTTP/1.1' }],
  },
  {
    key: 'java',
    title: 'Java',
    default: 'unirest',
    clients: [
      { target: 'java', client: 'asynchttp', title: 'AsyncHttp' },
      { target: 'java', client: 'nethttp', title: 'java.net.http' },
      { target: 'java', client: 'okhttp', title: 'OkHttp' },
      { target: 'java', client: 'unirest', title: 'Unirest' },
    ],
  },
  {
    key: 'js',
    title: 'JavaScript',
    default: 'fetch',
    clients: [
      { target: 'js', client: 'fetch', title: 'Fetch' },
      { target: 'js', client: 'axios', title: 'Axios' },
      { target: 'js', client: 'ofetch', title: 'ofetch' },
      { target: 'js', client: 'jquery', title: 'jQuery' },
      { target: 'js', client: 'xhr', title: 'XHR' },
    ],
  },
  {
    key: 'julia',
    title: 'Julia',
    default: 'http',
    clients: [{ target: 'julia', client: 'http', title: 'HTTP.jl' }],
  },
  {
    key: 'kotlin',
    title: 'Kotlin',
    default: 'okhttp',
    clients: [{ target: 'kotlin', client: 'okhttp', title: 'OkHttp' }],
  },
  {
    key: 'node',
    title: 'Node.js',
    default: 'fetch',
    clients: [
      { target: 'node', client: 'fetch', title: 'Fetch' },
      { target: 'node', client: 'axios', title: 'Axios' },
      { target: 'node', client: 'ofetch', title: 'ofetch' },
      { target: 'node', client: 'undici', title: 'undici' },
    ],
  },
  {
    key: 'objc',
    title: 'Objective-C',
    default: 'nsurlsession',
    clients: [{ target: 'objc', client: 'nsurlsession', title: 'NSURLSession' }],
  },
  {
    key: 'ocaml',
    title: 'OCaml',
    default: 'cohttp',
    clients: [{ target: 'ocaml', client: 'cohttp', title: 'Cohttp' }],
  },
  {
    key: 'php',
    title: 'PHP',
    default: 'curl',
    clients: [
      { target: 'php', client: 'curl', title: 'cURL' },
      { target: 'php', client: 'guzzle', title: 'Guzzle' },
      { target: 'php', client: 'laravel', title: 'Laravel HTTP Client' },
    ],
  },
  {
    key: 'powershell',
    title: 'PowerShell',
    default: 'webrequest',
    clients: [
      { target: 'powershell', client: 'webrequest', title: 'Invoke-WebRequest' },
      { target: 'powershell', client: 'restmethod', title: 'Invoke-RestMethod' },
    ],
  },
  {
    key: 'python',
    title: 'Python',
    default: 'python3',
    clients: [
      { target: 'python', client: 'python3', title: 'http.client' },
      { target: 'python', client: 'requests', title: 'Requests' },
      { target: 'python', client: 'aiohttp', title: 'aiohttp' },
      { target: 'python', client: 'httpx_sync', title: 'HTTPX (Sync)' },
      { target: 'python', client: 'httpx_async', title: 'HTTPX (Async)' },
    ],
  },
  {
    key: 'r',
    title: 'R',
    default: 'httr2',
    clients: [{ target: 'r', client: 'httr2', title: 'httr2' }],
  },
  {
    key: 'ruby',
    title: 'Ruby',
    default: 'native',
    clients: [{ target: 'ruby', client: 'native', title: 'net::http' }],
  },
  {
    key: 'rust',
    title: 'Rust',
    default: 'reqwest',
    clients: [{ target: 'rust', client: 'reqwest', title: 'reqwest' }],
  },
  {
    key: 'shell',
    title: 'Shell',
    default: 'curl',
    clients: [
      { target: 'shell', client: 'curl', title: 'Curl' },
      { target: 'shell', client: 'wget', title: 'Wget' },
      { target: 'shell', client: 'httpie', title: 'HTTPie' },
    ],
  },
  {
    key: 'swift',
    title: 'Swift',
    default: 'nsurlsession',
    clients: [{ target: 'swift', client: 'nsurlsession', title: 'NSURLSession' }],
  },
]
