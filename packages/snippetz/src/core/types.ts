export type { Request } from 'har-format'

/**
 * List of available clients
 */
export type Clients = [
  'js/fetch',
  'js/ofetch',
  'node/fetch',
  'node/ofetch',
  'node/undici',
  'shell/curl',
]

export type TargetId = Clients[number] extends `${infer T}/${string}`
  ? T
  : never

export type ClientId<T extends string> = T extends TargetId
  ? Extract<Clients[number], `${T}/${string}`> extends `${T}/${infer C}`
    ? C
    : never
  : never

/** What any plugins needs to return */
export type Source = {
  /** The language or environment. */
  target: TargetId
  /** The identifier of the client. */
  client: ClientId<TargetId>
  /** The actual source code. */
  code: string
}

/**
 * Optional configuration for any plugin
 */
export type PluginConfiguration = {
  /** Credentials to add HTTP Basic Authentication */
  auth?: { username: string; password: string }
}
