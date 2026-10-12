import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

/** Raw input accepted by the Node.js loader. Strings may be JSON, YAML, a file path, or a URL. */
export type AsyncApiInput = AsyncApiDocument | Record<string, unknown> | string

/** A page is identified by its map key or an exact JSON pointer, never its display title. */
export type AsyncApiSelector = string | { pointer: string }

/** Choose at most one page. Omitting all selectors renders the complete API description. */
type PageSelectors = {
  introduction: true
  channel: AsyncApiSelector
  operation: AsyncApiSelector
  /** A string selects components.messages; a pointer can also select a channel message. */
  message: AsyncApiSelector
  model: AsyncApiSelector
  tag: string
}

/** Control shared model links without assuming a documentation URL layout. */
export type AsyncApiRenderOptions = {
  schemaReferences?: {
    mode: 'linked'
    /** Return a published URL, or undefined to render the model name as text. */
    resolveUrl?: (reference: { ref: string; name: string }) => string | undefined
    /** Keep small primitive definitions inline. Defaults to true. */
    inlinePrimitives?: boolean
  }
} & (
  | {
      [Key in keyof PageSelectors]: Pick<PageSelectors, Key> & Partial<Record<Exclude<keyof PageSelectors, Key>, never>>
    }[keyof PageSelectors]
  | Partial<Record<keyof PageSelectors, never>>
)

/** A prepared document snapshot, reusable across independent page renders. */
export type AsyncApiMarkdownRenderer = {
  render: (options?: AsyncApiRenderOptions) => Promise<string>
}
