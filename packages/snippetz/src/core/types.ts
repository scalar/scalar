export type { TargetId } from 'httpsnippet-lite'

export type { Request } from 'har-format'

export type Source = {
  /** The language or environment. */
  target: ScalarTargetId
  /** The identifier of the client. */
  client: ClientId
  /** The actual source code. */
  code: string
}

export type ScalarTargetId = 'node' | 'js'

export type ClientId = 'undici' | 'fetch' | 'ofetch'

export const ScalarTargetTypes = ['node', 'js'] as const

export const SnippetTargetTypes = [
  'c',
  'csharp',
  'go',
  'java',
  'node',
  'ocaml',
  'php',
  'python',
  'ruby',
  'shell',
  'swift',
] as const

export const ScalarClientTypes = ['undici', 'fetch', 'ofetch'] as const

export type { HarRequest } from 'httpsnippet-lite'

export { availableTargets } from 'httpsnippet-lite'
