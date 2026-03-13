import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { default as ApiReference } from '@/components/ApiReference.vue'

/**
 * Render the Scalar API Reference to an HTML string for server-side rendering.
 * Use createApiReference on the client to hydrate the server-rendered output.
 */
export async function renderApiReferenceToString(configuration: AnyApiReferenceConfiguration): Promise<string> {
  const app = createSSRApp(() => h(ApiReference, { configuration }))

  return await renderToString(app)
}
