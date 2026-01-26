import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { ref } from 'vue'
import { z } from 'zod/mini'

import { useState } from '@/state/state'

export type UploadTmpDocumentState =
  | { type: 'error'; error: unknown }
  | { type: 'uploading' }
  | { type: 'processing' }
  | { type: 'done' }

export function useUploadTmpDocument() {
  const state = useState()
  const uploadState = ref<UploadTmpDocumentState>()

  function createUrl(path: string) {
    const url = `${state.baseUrl}${path}`

    // Localhost proxy
    if (url.startsWith('/')) return url

    const params = new URLSearchParams({ scalar_url: url.toString() })

    return new URL(`https://proxy.scalar.com/?${params}`)
  }

  async function uploadTempDocument(document: WorkspaceDocument) {
    try {
      uploadState.value = { type: 'uploading' }

      const response = await fetch(createUrl('/core/share/upload/apis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: JSON.stringify(document) }),
      })

      if (!response.ok) {
        uploadState.value = {
          type: 'error',
          error: 'Failed to upload document.',
        }
        return
      }

      const json = await response.json()

      const { success, data } = z.object({ namespace: z.string(), slug: z.string() }).safeParse(json)
      if (!success) {
        uploadState.value = {
          type: 'error',
          error: 'Failed to process document.',
        }
        return
      }

      uploadState.value = {
        type: 'processing',
      }
      const embeddingStatusResponse = await fetch(
        createUrl(`/vector/registry/embeddings/${data.namespace}/${data.slug}`),
        {
          method: 'GET',
        },
      )

      if (!embeddingStatusResponse.ok) {
        uploadState.value = {
          type: 'error',
          error: 'Failed to embed document.',
        }
        return
      }

      uploadState.value = { type: 'done' }

      setTimeout(() => {
        uploadState.value = undefined
      }, 2000)

      return data
    } catch {
      uploadState.value = { type: 'error', error: 'Failed to upload document.' }
      return
    }
  }

  return {
    uploadTempDocument,
    uploadState,
  }
}
