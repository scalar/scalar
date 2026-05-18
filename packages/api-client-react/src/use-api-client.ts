'use client'

import type { ApiClientModal, ApiClientOptions, RoutePayload } from '@scalar/api-client/modal'
import { generateHash } from '@scalar/helpers/string/generate-hash'
import { useEffect, useRef, useState } from 'react'

import './style.css'

import { isObjectEqual } from '@scalar/helpers/object/is-object-equal'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { getOrCreateApiClient } from './lazy-load'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

export type ApiClientConfigurationReact = ApiClientOptions &
  (
    | {
        content?: never
        url: string
      }
    | {
        content: Record<string, unknown>
        url?: never
      }
  )

export type UseApiClientModalProps = {
  /** Configuration for the Api Client (url or inline content) */
  configuration: ApiClientConfigurationReact
}

/** Tracks which documents are/have been loaded so we dont duplicate */
const documentSet = new Set<string>()

const getDocumentSlug = (configuration: ApiClientConfigurationReact) => {
  if (configuration.url) {
    return configuration.url
  }
  return generateHash(JSON.stringify(configuration.content ?? {}))
}

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
}: UseApiClientModalProps): (Omit<ApiClientModal, 'open'> & { open: (payload: RoutePayload) => void }) | undefined => {
  const [client, setClient] = useState<ApiClientModal | undefined>(undefined)
  const [workspaceStore, setWorkspaceStore] = useState<WorkspaceStore | undefined>(undefined)
  const documentSlugRef = useRef('')
  const previousModalOptionsRef = useRef<ApiClientOptions | undefined>(undefined)

  /** Small wrapper to set the documentSlug */
  const open = (payload: RoutePayload) => client?.open({ documentSlug: documentSlugRef.current, ...payload })

  useEffect(() => {
    let cancelled = false

    // Strip document-specific fields before passing to the modal constructor.
    const { url, content, ...modalOptions } = configuration

    const slug = getDocumentSlug(configuration)

    void getOrCreateApiClient(modalOptions)?.then((_client) => {
      if (cancelled || !_client) {
        return
      }

      // React always provides the complete modal option set for this hook instance,
      // so we overwrite to clear options removed by consumers.
      _client.apiClient.updateOptions(modalOptions, true)
      previousModalOptionsRef.current = modalOptions

      setClient(_client.apiClient)
      setWorkspaceStore(_client.workspaceStore)
      documentSlugRef.current = slug

      if (slug && !documentSet.has(slug)) {
        documentSet.add(slug)
        if (url !== undefined) {
          void _client.workspaceStore.addDocument({ name: slug, url })
        } else {
          void _client.workspaceStore.addDocument({ name: slug, document: content })
        }
      }
    })

    return () => {
      cancelled = true
    }

    // Only run once per mount
  }, [])

  // Register new document when we detect the url has changed
  useEffect(() => {
    if (!client || !workspaceStore) {
      return
    }

    const slug = configuration.url || 'default'
    documentSlugRef.current = slug

    if (documentSet.has(slug)) {
      return
    }
    documentSet.add(slug)

    if (configuration.url !== undefined) {
      void workspaceStore.addDocument({ name: slug, url: configuration.url })
    } else {
      void workspaceStore.addDocument({ name: slug, document: configuration.content })
    }
  }, [client, configuration.url, configuration.content, workspaceStore])

  // Update the modal options when the configuration changes
  useEffect(() => {
    if (!client || !configuration) {
      return
    }

    const { url: _url, content: _content, ...modalOptions } = configuration
    if (isObjectEqual(previousModalOptionsRef.current, modalOptions)) {
      return
    }

    client.updateOptions(modalOptions, true)
    previousModalOptionsRef.current = modalOptions
  }, [client, configuration])

  return client
    ? {
        ...client,
        open,
      }
    : undefined
}
