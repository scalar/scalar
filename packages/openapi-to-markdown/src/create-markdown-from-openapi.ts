import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { type DocumentLoadOptions, loadDocument } from './load-document'
import { createDocumentRenderer } from './render-document'
import { type OpenApiRenderOptions, createDocumentLookup, selectDocument } from './select-document'

type AnyDocument = OpenApiDocument | Record<string, unknown> | string
/** A resolved API description that can render multiple pages without loading it again. */
export type OpenApiMarkdownRenderer = {
  render: (options?: OpenApiRenderOptions) => Promise<string>
}

/**
 * Load and resolve an API description once, then render any number of selections.
 * Each renderer owns its document; create a new renderer to pick up source changes.
 */
export const createOpenApiMarkdownRenderer = async (
  input: AnyDocument,
  options?: DocumentLoadOptions,
): Promise<OpenApiMarkdownRenderer> => {
  const content = await loadDocument(input, options)

  const renderDocument = createDocumentRenderer()
  const lookup = createDocumentLookup(content)
  const render = async (options?: OpenApiRenderOptions): Promise<string> =>
    await renderDocument(selectDocument(content, options, lookup), options)
  return { render }
}

/** Generate Markdown from an API description, optionally scoped to a single page. */
export const createMarkdownFromOpenApi = async (
  input: AnyDocument,
  options?: OpenApiRenderOptions & { documentLoading?: DocumentLoadOptions },
): Promise<string> => {
  const renderer = await createOpenApiMarkdownRenderer(input, options?.documentLoading)
  if (options && 'documentLoading' in options) {
    const { documentLoading: _, ...renderOptions } = options
    return renderer.render(renderOptions)
  }
  return renderer.render(options)
}
