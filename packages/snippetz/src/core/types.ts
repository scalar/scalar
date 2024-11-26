export type { Request } from 'har-format'

export type Source = {
  /** The language or environment. */
  target: TargetId
  /** The identifier of the client. */
  client: ClientId
  /** The actual source code. */
  code: string
}

export type TargetId = 'node' | 'js' | 'shell'

export type ClientId = 'undici' | 'fetch' | 'ofetch' | 'curl'

export type PluginConfiguration = {
  /** Credentials to add HTTP Basic Authentication */
  auth?: { username: string; password: string }
}
