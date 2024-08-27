export type { Request } from 'har-format'

export type Source = {
  /** The language or environment. */
  target: TargetId
  /** The identifier of the client. */
  client: ClientId
  /** The actual source code. */
  code: string
}

export type TargetId = 'node' | 'js'

export type ClientId = 'undici' | 'fetch' | 'ofetch'
