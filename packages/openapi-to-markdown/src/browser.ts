import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { markdownFromHtml, renderDocument } from './render-document'
import type { OpenApiRenderOptions } from './select-document'

/**
 * Convert an OpenAPI document from the workspace store to Markdown in the browser.
 * References must already be resolved by the store. This entry point does not load
 * files, fetch URLs, or migrate raw API descriptions.
 */
export const createMarkdownFromOpenApi = async (
  document: OpenApiDocument,
  options?: OpenApiRenderOptions,
): Promise<string> => markdownFromHtml(await renderDocument(document, options))
