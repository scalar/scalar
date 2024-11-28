import type { Request } from 'har-format'

export type { Request } from 'har-format'

/**
 * List of available clients
 */
export type AvailableClients = [
  'js/fetch',
  'js/ofetch',
  'node/fetch',
  'node/ofetch',
  'node/undici',
  'shell/curl',
  'shell/wget',
]

/** Programming language */
export type TargetId = AvailableClients[number] extends `${infer T}/${string}`
  ? T
  : never

/** HTTP client */
export type ClientId<T extends string> = T extends TargetId
  ? Extract<
      AvailableClients[number],
      `${T}/${string}`
    > extends `${T}/${infer C}`
    ? C
    : never
  : never

/** What any plugins needs to return */
export type Plugin = {
  /** The language or environment. */
  target: TargetId
  /** The identifier of the client. */
  client: ClientId<TargetId>
  /** The actual source code. */
  generate: (
    request?: Partial<Request>,
    configuration?: PluginConfiguration,
  ) => string
}

/**
 * Optional configuration for any plugin
 */
export type PluginConfiguration = {
  /** Credentials to add HTTP Basic Authentication */
  auth?: { username: string; password: string }
}
