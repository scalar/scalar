import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

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

  // Parse the HTML string into a DOM element
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Get the pre element content and remove comments
  const preElement = doc.querySelector('pre')
  const content = preElement?.textContent || ''

  return content.trim()
}
