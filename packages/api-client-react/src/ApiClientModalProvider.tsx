'use client'

import type { ApiClientModal } from '@scalar/api-client/v2/features/modal'
import { parseJsonOrYaml } from '@scalar/oas-utils/helpers'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceDocumentInput } from '@scalar/workspace-store/client'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import './style.css'

type LowercaseHttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace'
type HttpMethod = LowercaseHttpMethod | Uppercase<LowercaseHttpMethod>

export type OpenClientPayload = {
  path: string
  method: HttpMethod
  example?: string
  documentSlug?: string
}

export type ApiClientModalController = Omit<ApiClientModal, 'open' | 'route'> & {
  open: (payload?: OpenClientPayload) => void
  route: (payload: OpenClientPayload) => void
}

type Props = PropsWithChildren<{
  /** Choose a request to initially route to */
  initialRequest?: OpenClientPayload
  /** Configuration for the API client */
  configuration?: Partial<ApiClientConfiguration>
  /** Optional document name used in the internal workspace */
  documentName?: string
}>

const DEFAULT_DOCUMENT_NAME = 'default'

const FALLBACK_DOCUMENT = {
  openapi: '3.1.0',
  info: {
    title: 'API description',
    version: '1.0.0',
  },
  paths: {},
} satisfies Record<string, unknown>

const ApiClientModalContext = createContext<ApiClientModalController | null>(null)

const normalizeMethod = (method: HttpMethod): LowercaseHttpMethod => method.toLowerCase() as LowercaseHttpMethod

const normalizeRoutePayload = (payload: OpenClientPayload) => ({
  ...payload,
  method: normalizeMethod(payload.method),
})

const createController = (modal: ApiClientModal): ApiClientModalController => ({
  ...modal,
  open: (payload) => modal.open(payload ? normalizeRoutePayload(payload) : undefined),
  route: (payload) => modal.route(normalizeRoutePayload(payload)),
})

const resolveSourceConfiguration = (configuration: Partial<ApiClientConfiguration>) => ({
  url: configuration.url ?? configuration.spec?.url,
  content: configuration.content ?? configuration.spec?.content,
})

const resolveDocumentInput = ({
  configuration,
  documentName,
}: {
  configuration: Partial<ApiClientConfiguration>
  documentName: string
}): WorkspaceDocumentInput => {
  const { url, content } = resolveSourceConfiguration(configuration)

  if (url) {
    return {
      name: documentName,
      url,
    }
  }

  const resolvedContent = typeof content === 'function' ? content() : content

  if (typeof resolvedContent === 'string') {
    try {
      return {
        name: documentName,
        document: parseJsonOrYaml(resolvedContent),
      }
    } catch {
      return {
        name: documentName,
        document: FALLBACK_DOCUMENT,
      }
    }
  }

  if (resolvedContent && typeof resolvedContent === 'object') {
    return {
      name: documentName,
      document: resolvedContent,
    }
  }

  return {
    name: documentName,
    document: FALLBACK_DOCUMENT,
  }
}

/**
 * React provider for the Scalar API Client v2 modal.
 */
export const ApiClientModalProvider = ({
  children,
  initialRequest,
  configuration = {},
  documentName = DEFAULT_DOCUMENT_NAME,
}: Props) => {
  const el = useRef<HTMLDivElement | null>(null)
  const [client, setClient] = useState<ApiClientModalController | null>(null)

  // We intentionally initialize once to avoid recreating the modal on every render.
  const initialRequestRef = useRef(initialRequest)
  const configurationRef = useRef(configuration)
  const documentNameRef = useRef(documentName)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let isDisposed = false

    const initialize = async () => {
      if (!el.current) {
        return
      }

      const [{ createApiClientModal }, { createWorkspaceStore }] = await Promise.all([
        import('@scalar/api-client/v2/features/modal'),
        import('@scalar/workspace-store/client'),
      ])

      const workspaceStore = createWorkspaceStore({
        meta: configurationRef.current.proxyUrl
          ? {
              'x-scalar-active-proxy': configurationRef.current.proxyUrl,
            }
          : undefined,
      })

      const input = resolveDocumentInput({
        configuration: configurationRef.current,
        documentName: documentNameRef.current,
      })

      await workspaceStore.addDocument(input)
      workspaceStore.update('x-scalar-active-document', documentNameRef.current)

      const modal = createApiClientModal({
        el: el.current,
        workspaceStore,
      })

      const modalController = createController(modal)

      if (isDisposed) {
        modal.app.unmount()
        return
      }

      setClient(modalController)

      if (initialRequestRef.current) {
        modalController.open(initialRequestRef.current)
      }

      cleanup = () => {
        modal.modalState.open = false
        modal.app.unmount()
      }
    }

    void initialize()

    return () => {
      isDisposed = true
      setClient(null)
      cleanup?.()
    }
  }, [])

  return (
    <ApiClientModalContext.Provider value={client}>
      <div
        className="scalar-app"
        ref={el}
      />
      {children}
    </ApiClientModalContext.Provider>
  )
}

export const useApiClientModal = (): ApiClientModalController | null => useContext(ApiClientModalContext)
