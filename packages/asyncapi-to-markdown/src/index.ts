import { loadDocument } from './load-document'
import { createRenderer } from './render-document'
import type { AsyncApiInput, AsyncApiMarkdownRenderer, AsyncApiRenderOptions } from './types'

export type { AsyncApiInput, AsyncApiMarkdownRenderer, AsyncApiRenderOptions, AsyncApiSelector } from './types'

/** Prepare an immutable document snapshot once for a complete export or multiple pages. */
export const createAsyncApiMarkdownRenderer = async (input: AsyncApiInput): Promise<AsyncApiMarkdownRenderer> =>
  createRenderer(await loadDocument(input))

/** Generate LLM-friendly Markdown from an AsyncAPI description or one of its reference pages. */
export const createMarkdownFromAsyncApi = async (
  input: AsyncApiInput,
  options?: AsyncApiRenderOptions,
): Promise<string> => (await createAsyncApiMarkdownRenderer(input)).render(options)
