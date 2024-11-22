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

// TODO: Move to type tests
// const goodTarget: TargetId = 'node'
// // @ts-expect-error ok!
// const badTarget: TargetId = 'foo'

// const goodClient: ClientId<'node'> = 'undici'
// // @ts-expect-error ok!
// const badClient: ClientId<'node'> = 'does-not-exist'
// // @ts-expect-error ok!
// const otherBadClient: ClientId<'foobar'> = 'undici'
// // @ts-expect-error ok!
// const andAnotherBadClient: ClientId<'shell'> = 'undici'

// function print<T extends TargetId>(target: T, client: ClientId<T>) {
//   return `${target}/${client}`
// }

// print('shell', 'curl')

export type { Request } from '@scalar/types/external'

export type PluginConfiguration = {
  /** Credentials to add HTTP Basic Authentication */
  auth?: { username: string; password: string }
}

export type Snippet = {
  /** The language or environment. */
  target: TargetId
  /** The identifier of the client. */
  client: ClientId<TargetId>
  /** The actual source code. */
  code: string
}
