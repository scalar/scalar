/* eslint-disable */
interface NewTargets {}

export type AddTarget<T extends string> = {
  [K in T]: T
}

interface NewClients {}

export type AddClient<T extends keyof NewTargets, C extends string> = {
  [K in `${T}-${C}`]: C
}

interface NewTargets extends AddTarget<'shell'> {}
interface NewClients extends AddClient<'shell', 'curl'> {}

interface NewTargets extends AddTarget<'node'> {}
interface NewClients extends AddClient<'node', 'undici'> {}
interface NewTargets extends AddTarget<'node'> {}
interface NewClients extends AddClient<'node', 'fetch'> {}

export type TargetId = NewTargets[keyof NewTargets]
export type ClientId<T extends TargetId> = NewClients[keyof NewClients &
  `${T}-${string}`]

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

export type Source = {
  /** The language or environment. */
  target: TargetId
  /** The identifier of the client. */
  client: ClientId<TargetId>
  /** The actual source code. */
  code: string
}
