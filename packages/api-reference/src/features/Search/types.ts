import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

export type EntryType =
  | 'operation'
  | 'webhook'
  | 'model'
  | 'heading'
  | 'tag'
  | 'asyncapi-channel'
  | 'asyncapi-operation'
  | 'asyncapi-message'

export type FuseData = {
  type: EntryType
  id: string
  title: string
  description: string
  /** Top-level request-body property names (e.g. `email`, `username`). High-signal field for search. */
  body?: string | string[]
  /** Descriptions of request-body properties. Verbose prose, weighted lower than `body`. */
  bodyDescriptions?: string[]
  /** Parameter names (e.g. `userId`, `limit`). High-signal field for search. */
  parameters?: string | string[]
  /** Descriptions of parameters. Verbose prose, weighted lower than `parameters`. */
  parameterDescriptions?: string[]
  /** AsyncAPI map keys and machine-friendly message names, separate from display titles. */
  identifiers?: string[]
  /** AsyncAPI action displayed without an HTTP method badge. */
  action?: 'send' | 'receive'
  responseExamples?: string[]
  method?: string
  path?: string
  operationId?: string
  entry: TraversedEntry
}
