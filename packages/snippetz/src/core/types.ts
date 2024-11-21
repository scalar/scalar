declare global {
  /**
   * Available targets and clients, can be extended dynamically
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface SnippetzTargets {}
}

export type TargetId = keyof SnippetzTargets
export type ClientId<T extends TargetId> = keyof SnippetzTargets[T]

export type { Request } from '@scalar/types/external'

export type Source = {
  /** The language or environment. */
  target: TargetId
  /** The identifier of the client. */
  client: ClientId<TargetId>
  /** The actual source code. */
  code: string
}
