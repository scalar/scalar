import { makeUrlAbsolute, redirectToProxy } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { Ref } from 'vue'

import { mapConfiguration } from '@/v2/helpers/map-configuration'

/**
 * Creates a proxy function that redirects requests through a proxy URL.
 * This is used to handle CORS issues by routing requests through a proxy server.
 *
 * @param input - The URL or Request object to proxy
 * @param init - Optional fetch init parameters
 * @returns A Promise that resolves to the Response from the proxied request
 */
const makeProxy =
  (proxyUrl: string) =>
  (
    input: string | URL | globalThis.Request,
    // eslint-disable-next-line no-undef
    init?: RequestInit,
  ) => {
    return fetch(redirectToProxy(proxyUrl, input.toString()), init)
  }

/**
 * Adds a document to the workspace store based on the provided configuration.
 * Handles both in-memory documents (via content) and remote documents (via URL).
 * If the document is already in the store, it will be updated, otherwise it will be added.
 *
 * @param config - The document configuration containing either content or URL
 * @returns The result of adding the document to the store, or undefined if skipped
 */
export const addOrUpdateDocument = async ({
  slug,
  config,
  source,
  store,
  isIntersectionEnabled,
}: {
  slug: string
  config: ApiReferenceConfigurationRaw
  source: { url: string; content?: never } | { content: Record<string, unknown>; url?: never }
  store: WorkspaceStore
  isIntersectionEnabled: Ref<boolean>
}) => {
  // Always set it to active; if the document is null we show a loading state
  store.update('x-scalar-active-document', slug)
  isIntersectionEnabled.value = false

  // If the document is already in the store, we may want to update it
  if (source.content) {
    if (store.workspace.documents[slug]) {
      // Disable intersection observer to prevent url changing
      store.rebaseDocument(slug, source.content)
    } else {
      return await store.addDocument({
        name: slug,
        document: source.content,
        config: mapConfiguration(config),
      })
    }
  }

  if (source.url) {
    return await store.addDocument({
      name: slug,
      url: makeUrlAbsolute(source.url, {
        basePath: config.pathRouting?.basePath,
      }),
      fetch: config.fetch ?? makeProxy(config.proxyUrl ?? 'https://proxy.scalar.com'),
      config: mapConfiguration(config),
    })
  }

  // Re-enable intersection observer
  setTimeout(() => {
    isIntersectionEnabled.value = true
  }, 300)
}
