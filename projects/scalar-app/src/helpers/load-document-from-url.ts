import { resolve } from '@scalar/import'
import type { UrlDoc, WorkspaceStore } from '@scalar/workspace-store/client'
import { getFetch } from '@scalar/workspace-store/helpers/get-fetch'

/** Discover an API description in a reference page using the app's configured transport. */
export const loadDocumentFromUrl = async (
  workspaceStore: WorkspaceStore,
  source: string,
  name: string,
  watchMode: boolean,
  customFetch?: UrlDoc['fetch'],
): Promise<boolean> => {
  const url = source.trim()
  const fetch = getFetch({
    fetch: customFetch,
    proxyUrl: workspaceStore.workspace['x-scalar-active-proxy'] ?? undefined,
  })
  const resolved = await resolve(url, {
    fetch: async (input) => {
      const response = await fetch(input)
      // Keep failures on the configured transport rather than retrying through the renderer.
      if (!response.ok) {
        throw new Error(`Failed to fetch reference: ${response.status}`)
      }
      return response
    },
  })

  if (typeof resolved === 'object') {
    return await workspaceStore.addDocument({ name, document: resolved })
  }

  return await workspaceStore.addDocument({
    name,
    url: resolved ?? url,
    fetch: customFetch,
    meta: { 'x-scalar-watch-mode': watchMode },
  })
}
