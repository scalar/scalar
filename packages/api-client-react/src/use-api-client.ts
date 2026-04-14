'use client'

import type { ApiClientModal, ApiClientModalOptions, RoutePayload } from '@scalar/api-client/v2/features/modal'
import { useEffect, useState } from 'react'

import './style.css'

import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { getOrCreateApiClient } from './lazy-load'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

export type ApiClientConfigurationReact = ApiClientModalOptions & {
  content?: Record<string, unknown>
  url?: string
}

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
export const useApiClient = ({
  configuration,
}: UseApiClientModalProps = {}):
  | (Omit<ApiClientModal, 'open'> & { open: (payload: RoutePayload) => void })
  | undefined => {
  const [client, setClient] = useState<ApiClientModal | undefined>(undefined)
  const [workspaceStore, setWorkspaceStore] = useState<WorkspaceStore | undefined>(undefined)
  const [documentSlug, setDocumentSlug] = useState('')

  /** Small wrapper to set the documentSlug */
  const open = (payload: RoutePayload) => client?.open({ documentSlug, ...payload })

  useEffect(() => {
    let cancelled = false

    // Strip document-specific fields before passing to the modal constructor.
    // `url` and `content` are registered separately via workspaceStore.addDocument.
    const { url, content, ...modalOptions } = configuration ?? {}

    void getOrCreateApiClient(modalOptions)?.then((_client) => {
      if (cancelled || !_client) {
        return
      }

      // Compute the slug here so we can batch all three state updates into one render,
      // preventing a render where `client` is set but `documentSlug` is still ''.
      const slug = url || (content as { info?: { title?: string } })?.info?.title || ''

      // Keep singleton modal options in sync even when the client already exists.
      _client.apiClient.updateOptions(modalOptions)

      setClient(_client.apiClient)
      setWorkspaceStore(_client.workspaceStore)
      setDocumentSlug(slug)

      if (slug && !documentDict[slug]) {
        documentDict[slug] = true
        void _client.workspaceStore.addDocument(
          content ? { name: slug, document: content } : { name: slug, url: url ?? '' },
        )
      }
    })

    return () => {
      cancelled = true
    }

    // Only run once per mount
  }, [])

  // Keep modal options in sync and register a new document when configuration changes.
  useEffect(() => {
    if (!client || !workspaceStore) {
      return
    }

    const { url: _, content: __, ...modalOptions } = configuration ?? {}
    client.updateOptions(modalOptions)

    if (!configuration) {
      return
    }

    const slug = configuration.url || (configuration.content as { info?: { title?: string } })?.info?.title || 'default'
    setDocumentSlug(slug)

    if (documentDict[slug]) {
      return
    }
    documentDict[slug] = true

    void workspaceStore.addDocument(
      configuration.content
        ? { name: slug, document: configuration.content }
        : { name: slug, url: configuration.url ?? '' },
    )
  }, [client, configuration, workspaceStore])

  return client
    ? {
        ...client,
        open,
      }
    : undefined
}
