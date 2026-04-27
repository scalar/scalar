import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { coerce, object, string, validate } from '@scalar/validation'
import { ref } from 'vue'

import { useState } from '@/state/state'

const SHOW_UPLOAD_SUCCESS_DELAY = 5_000 // 5 seconds

export type UploadTmpDocumentState =
  | { type: 'error'; error: unknown }
  | { type: 'uploading' }
  | { type: 'processing' }
  | { type: 'loading' }
  | { type: 'done' }

const TMP_DOC_LS_KEY = 'scalar-tmp-doc'

function saveTmpDocumentInLocalStorage({ namespace, slug }: { namespace: string; slug: string }) {
  localStorage.setItem(TMP_DOC_LS_KEY, JSON.stringify({ namespace, slug }))
}

const tmpDocSchema = object({
  namespace: string(),
  slug: string(),
})

export function getTmpDocFromLocalStorage() {
  const tmpDoc = localStorage.getItem(TMP_DOC_LS_KEY)
  if (!tmpDoc) {
    return
  }

  return coerce(tmpDocSchema, JSON.parse(tmpDoc))
}

export function removeTmpDocFromLocalStorage() {
  const tmpDoc = localStorage.getItem(TMP_DOC_LS_KEY)
  if (!tmpDoc) {
    return
  }

  localStorage.removeItem(TMP_DOC_LS_KEY)
}

/**
 * Handle uploading a temporary OpenAPI document.
 */
export function useUploadTmpDocument() {
  const state = useState()
  const uploadState = ref<UploadTmpDocumentState>()

  function createUrl(path: string) {
    const fullUrl = `${state.baseUrl}${path}`
    return redirectToProxy(state.platformProxyUrl, fullUrl)
  }

  async function uploadTempDocument(document: string, isAgent = false) {
    try {
      uploadState.value = {
        type: 'uploading',
      }

      const response = await fetch(createUrl(`/core/share/upload/apis${isAgent ? '?source=agent' : ''}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document }),
      })

      if (!response.ok) {
        uploadState.value = {
          type: 'error',
          error: 'Failed to upload your OpenAPI document.',
        }

        return
      }

      const json = await response.json()

      const uploadResponseSchema = object({ url: string(), namespace: string(), slug: string() })

      if (!validate(uploadResponseSchema, json)) {
        uploadState.value = {
          type: 'error',
          error: 'Failed to process document.',
        }
        return
      }

      const uploadData = coerce(uploadResponseSchema, json)

      uploadState.value = {
        type: 'processing',
      }
      const embeddingStatusResponse = await fetch(
        createUrl(`/vector/registry/embeddings/${uploadData.namespace}/${uploadData.slug}`),
        {
          method: 'GET',
        },
      )

      saveTmpDocumentInLocalStorage({
        namespace: uploadData.namespace,
        slug: uploadData.slug,
      })

      await state.addDocument({
        namespace: uploadData.namespace,
        slug: uploadData.slug,
        removable: false,
        tmp: true,
      })

      if (!embeddingStatusResponse.ok) {
        uploadState.value = {
          type: 'error',
          error: 'Failed to embed document.',
        }
        return
      }

      uploadState.value = { type: 'done' }
      state.uploadedTmpDocumentUrl.value = uploadData.url

      setTimeout(() => {
        uploadState.value = undefined
      }, SHOW_UPLOAD_SUCCESS_DELAY)

      return uploadData
    } catch {
      uploadState.value = { type: 'error', error: 'Failed to upload your OpenAPI document.' }
      return
    }
  }

  return {
    uploadTempDocument,
    uploadState,
  }
}
