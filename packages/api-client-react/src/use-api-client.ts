'use client'

import type { ApiClientModal, RoutePayload } from '@scalar/api-client/v2/features/modal'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import { useEffect, useState } from 'react'

import { getOrCreateApiClient } from './get-or-create-api-client'
import './style.css'

import type { WorkspaceStore } from '@scalar/workspace-store/client'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/** We don't really need all of the content types so we just accept an object instead */
export type ApiClientConfigurationReact = Partial<
  Omit<ApiClientConfiguration, 'content' | 'url'> & { content?: Record<string, unknown>; url?: string }
>

export type UseApiClientModalProps = {
  /** Configuration for the Api Client (url or inline content) */
  configuration?: ApiClientConfigurationReact
}

/** Tracks which documents are/have been loaded so we dont duplicate */
const documentDict: Record<string, true> = {}

/**
 * Returns the singleton Api Client
 *
 * On first call the Vue app is lazily created and appended to document.body where it
 * lives for the lifetime of the page — it is never unmounted, so it survives client-side
 * navigation without losing state.
 *
 * Subsequent calls from any component share the same instance of the client but can use the same
 * or different documents
 */
export const useApiClient = ({ configuration }: UseApiClientModalProps = {}): ApiClientModal | undefined => {
  const [client, setClient] = useState<ApiClientModal | undefined>(undefined)
  const [workspaceStore, setWorkspaceStore] = useState<WorkspaceStore | undefined>(undefined)
  const [documentSlug, setDocumentSlug] = useState('')

  /** Small wrapper to set the documentSlug */
  const open = (payload: RoutePayload) => client?.open({ documentSlug, ...payload })

  useEffect(() => {
    let cancelled = false

    void getOrCreateApiClient(configuration ?? {}).then((_client) => {
      if (cancelled) {
        return
      }

      setClient(_client?.apiClient)
      setWorkspaceStore(_client?.workspaceStore)
    })

    return () => {
      cancelled = true
    }

    // Only run once per mount
  }, [])

  // On config url or content changes lets add a document and set the slug
  useEffect(() => {
    if (!client || !configuration || !workspaceStore) {
      return
    }

    /** The document key of the most recently added document, used as the default documentSlug when opening. */
    const documentSlug =
      configuration.url || (configuration.content as { info?: { title?: string } })?.info?.title || ''
    setDocumentSlug(documentSlug)

    // Ensure we only load each document once
    if (documentDict[documentSlug]) {
      return
    }
    documentDict[documentSlug] = true

    void workspaceStore.addDocument(
      configuration.content
        ? {
            name: documentSlug,
            document: configuration.content,
          }
        : {
            name: documentSlug,
            url: configuration.url ?? '',
          },
    )
  }, [client, configuration?.url, configuration?.content])

  return client
    ? {
        ...client,
        open,
      }
    : undefined
}
