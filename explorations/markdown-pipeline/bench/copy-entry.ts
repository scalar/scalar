/** What the Copy as Markdown harness compares, built once per side with `@scalar/markdown` aliased. */
import { createMarkdownSerializer, htmlFromMarkdown, mdastFromHtml, parseMarkdown } from '@scalar/markdown'

import { createMarkdownFromAsyncApi } from '../../../packages/asyncapi-to-markdown/src/index'
import { createMarkdownFromOpenApi } from '../../../packages/openapi-to-markdown/src/create-markdown-from-openapi'
import { createDescriptionParser } from '../../../packages/openapi-to-markdown/src/parse-description'

export {
  createDescriptionParser,
  createMarkdownFromAsyncApi,
  createMarkdownFromOpenApi,
  createMarkdownSerializer,
  htmlFromMarkdown,
  mdastFromHtml,
  parseMarkdown,
}
