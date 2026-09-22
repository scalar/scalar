import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { loadDocument } from './load-document'
import { createDocumentRenderer } from './render-document'
import { type OpenApiRenderOptions, selectDocument } from './select-document'

type AnyDocument = OpenApiDocument | Record<string, unknown> | string
/** A resolved API description that can render multiple pages without loading it again. */
export type OpenApiMarkdownRenderer = {
  render: (options?: OpenApiRenderOptions) => Promise<string>
}

/**
 * Load and resolve an API description once, then render any number of selections.
 * Each renderer owns its document; create a new renderer to pick up source changes.
 */
export const createOpenApiMarkdownRenderer = async (input: AnyDocument): Promise<OpenApiMarkdownRenderer> => {
  const content = await loadDocument(input)

  const renderDocument = createDocumentRenderer()
  const render = async (options?: OpenApiRenderOptions): Promise<string> =>
    await renderDocument(selectDocument(content, options))
  return { render }
}

/** Generate Markdown from an API description, optionally scoped to a single page. */
export const createMarkdownFromOpenApi = async (
  input: AnyDocument,
  options?: OpenApiRenderOptions,
): Promise<string> => {
  const renderer = await createOpenApiMarkdownRenderer(input)
  return renderer.render(options)
}
