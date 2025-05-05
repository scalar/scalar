import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ScalarApiReference from './components/ScalarApiReference.vue'

export async function createScalarApiReference(configuration: Partial<ApiReferenceConfiguration>) {
  // Create and configure the app
  const app = createSSRApp(ScalarApiReference, {
    configuration,
  })

  // Render the app to HTML string
  const html = await renderToString(app)

  // return html

  return markdownFromHtml(html)
}

async function markdownFromHtml(html: string): Promise<string> {
  // TODO: Remove HTML comments
  const file = await unified().use(rehypeParse).use(rehypeRemark).use(remarkStringify).process(html)

  return String(file)
}
