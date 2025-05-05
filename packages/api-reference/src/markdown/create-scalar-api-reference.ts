import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import rehypeParse from 'rehype-parse'
import rehypePresetMinify from 'rehype-preset-minify'
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
  const file = await unified()
    .use(rehypeParse)
    .use(rehypePresetMinify)
    .use(rehypeRemark)
    .use(remarkStringify, {
      bullet: '-',
    })
    .process(html)

  return (
    String(file)
      // TODO: Better way to remove HTML comments
      .replace(/<!--[\s\S]*?(?:-->)/g, '')
      // Make sure there's never more than one empty line
      // TODO: Is there a better way to do this?
      .replace(/\n\n+/g, '\n\n')
  )
}
