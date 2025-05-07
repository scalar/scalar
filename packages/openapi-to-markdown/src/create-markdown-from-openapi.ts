import { normalize } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { minify } from 'html-minifier-terser'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ScalarApiReference from './components/ScalarApiReference.vue'

type AnyDocument = OpenAPIV3_1.Document | Record<string, unknown> | string

export async function createHtmlFromOpenApi(input: AnyDocument) {
  const content = normalize(input)

  // Create and configure a server-side rendered Vue app
  const app = createSSRApp(ScalarApiReference, {
    content,
  })

  // Get static HTML
  const html = await renderToString(app)

  // Clean the output
  return minify(html, {
    removeComments: true,
    removeEmptyElements: true,
    collapseWhitespace: true,
    continueOnParseError: true,
    noNewlinesBeforeTagClose: true,
    preserveLineBreaks: true,
    removeEmptyAttributes: true,
    decodeEntities: true,
  })
}

export async function createMarkdownFromOpenApi(content: AnyDocument) {
  return markdownFromHtml(await createHtmlFromOpenApi(content))
}

export async function markdownFromHtml(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(remarkGfm)
    .use(rehypeSanitize)
    .use(rehypeRemark)
    .use(remarkStringify, {
      bullet: '-',
    })
    .process(html)

  return String(file)
}
