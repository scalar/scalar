import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

/** Raw input accepted by the Node.js loader. Strings may be JSON, YAML, a file path, or a URL. */
export type AsyncApiInput = AsyncApiDocument | Record<string, unknown> | string

/** A page is identified by its map key or an exact JSON pointer, never its display title. */
export type AsyncApiSelector = string | { pointer: string }

/** Choose at most one page. Omitting all selectors renders the complete API description. */
export type AsyncApiRenderOptions = {
  introduction?: true
  channel?: AsyncApiSelector
  operation?: AsyncApiSelector
  /** A string selects components.messages; a pointer can also select a channel message. */
  message?: AsyncApiSelector
  model?: AsyncApiSelector
}

/** A prepared document snapshot, reusable across independent page renders. */
export type AsyncApiMarkdownRenderer = {
  render: (options?: AsyncApiRenderOptions) => Promise<string>
}
