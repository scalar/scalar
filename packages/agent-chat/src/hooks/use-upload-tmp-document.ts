import { ref } from 'vue'
import { z } from 'zod/mini'

import { useState } from '@/state/state'

export type UploadTmpDocumentState =
  | { type: 'error'; error: unknown }
  | { type: 'uploading' }
  | { type: 'processing' }
  | { type: 'done' }

const TMP_DOC_LS_KEY = 'scalar-tmp-doc'

function saveTmpDocumentInLocalStorage({ namespace, slug }: { namespace: string; slug: string }) {
  localStorage.setItem(TMP_DOC_LS_KEY, JSON.stringify({ namespace, slug }))
}

export function getTmpDocFromLocalStorage() {
  const tmpDoc = localStorage.getItem(TMP_DOC_LS_KEY)
  if (!tmpDoc) {
    return
  }

  return z
    .object({
      namespace: z.string(),
      slug: z.string(),
    })
    .parse(JSON.parse(tmpDoc))
}

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

  async function uploadTempDocument(document: string, isAgent = false) {
    try {
      uploadState.value = { type: 'uploading' }

      const response = await fetch(createUrl(`/core/share/upload/apis${isAgent ? '?source=agent' : ''}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document }),
      })

      if (!response.ok) {
        uploadState.value = {
          type: 'error',
          error: 'Failed to upload document.',
        }
        return
      }

      const json = await response.json()

      const { success, data } = z.object({ url: z.string(), namespace: z.string(), slug: z.string() }).safeParse(json)
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

      saveTmpDocumentInLocalStorage({
        namespace: data.namespace,
        slug: data.slug,
      })

      await state.addDocument({
        namespace: data.namespace,
        slug: data.slug,
        removable: false,
      })

      if (!embeddingStatusResponse.ok) {
        uploadState.value = {
          type: 'error',
          error: 'Failed to embed document.',
        }
        return
      }

      uploadState.value = { type: 'done' }
      state.uploadedTmpDocumentUrl.value = data.url

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
