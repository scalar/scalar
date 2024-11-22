export type { Request } from 'har-format'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Clients {}
}

export type AddClient<T extends string, C extends string> = {
  [K in `${T}/${C}`]: C
}

export type TargetId = keyof Clients & string extends `${infer T}/${string}`
  ? T
  : never

export type ClientId<T extends TargetId> = Clients[keyof Clients &
  `${T}/${string}`]

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
