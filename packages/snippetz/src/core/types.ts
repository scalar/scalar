/* eslint-disable */
interface Clients {}

export type AddClient<T extends string, C extends string> = {
  [K in `${T} ${C}`]: C
}

interface Clients extends AddClient<'shell', 'curl'> {}
interface Clients extends AddClient<'node', 'undici'> {}
interface Clients extends AddClient<'node', 'fetch'> {}

export type TargetId = keyof Clients & string extends `${infer T} ${string}`
  ? T
  : never

export type ClientId<T extends TargetId> = Clients[keyof Clients &
  `${T} ${string}`]

// TODO: Move to type tests
const goodTarget: TargetId = 'node'
// @ts-expect-error
const badTarget: TargetId = 'foo'

const goodClient: ClientId<'node'> = 'undici'
// @ts-expect-error
const badClient: ClientId<'node'> = 'undica'
// @ts-expect-error
const otherBadClient: ClientId<'foobar'> = 'undici'
// @ts-expect-error
const andAnotherBadClient: ClientId<'shell'> = 'undici'

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
