import { type DocumentLoadOptions, loadDocument } from './load-document'
import { createRenderer } from './render-document'
import type { AsyncApiInput, AsyncApiMarkdownRenderer, AsyncApiRenderOptions } from './types'

export type { DocumentLoadOptions } from './load-document'
export type { AsyncApiInput, AsyncApiMarkdownRenderer, AsyncApiRenderOptions, AsyncApiSelector } from './types'

/** Prepare an immutable document snapshot once for a complete export or multiple pages. */
export const createAsyncApiMarkdownRenderer = async (
  input: AsyncApiInput,
  options?: DocumentLoadOptions,
): Promise<AsyncApiMarkdownRenderer> => createRenderer(await loadDocument(input, options))

/** Generate LLM-friendly Markdown from an AsyncAPI description or one of its reference pages. */
export const createMarkdownFromAsyncApi = async (
  input: AsyncApiInput,
  options?: AsyncApiRenderOptions & { documentLoading?: DocumentLoadOptions },
): Promise<string> => {
  const { documentLoading, ...renderOptions } = options ?? {}
  const renderer = await createAsyncApiMarkdownRenderer(input, documentLoading)
  return renderer.render(renderOptions)
}
