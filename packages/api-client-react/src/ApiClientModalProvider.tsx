'use client'

import type { ApiClientModal as V2ApiClientModal } from '@scalar/api-client/v2/features/modal'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceDocumentInput } from '@scalar/workspace-store/client'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react'

import { clientStore } from './client-store'

import './style.css'

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace'

type RoutePayload = {
  path: string
  method: HttpMethod | Uppercase<HttpMethod>
  example?: string
  documentSlug?: string
  _source?: 'api-reference' | 'gitbook'
}

type RequestUidPayload = {
  requestUid: string
  path?: never
  method?: never
}

export type OpenClientPayload = RoutePayload | RequestUidPayload

export type ApiClient = Omit<V2ApiClientModal, 'open' | 'route'> & {
  open: (payload?: OpenClientPayload) => void
  route: (payload: OpenClientPayload) => void
}

const ApiClientModalContext = createContext<ApiClient | null>(null)

type Props = PropsWithChildren<{
  /** Choose a request to initially route to */
  initialRequest?: OpenClientPayload
  /** Configuration for the Api Client */
  configuration?: Partial<ApiClientConfiguration>
}>

/** Hack: this is strictly to prevent creation of extra clients as the store lags a bit */
const clientDict: Record<string, ApiClient> = {}

const HTTP_METHODS = new Set<HttpMethod>([
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
  'trace',
])

const isHttpMethod = (value: string): value is HttpMethod => HTTP_METHODS.has(value as HttpMethod)

type ResolvedDocumentInput = {
  url: string
} | {
  document: Record<string, unknown>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const resolveDocumentInput = async (
  configuration: Partial<ApiClientConfiguration>,
): Promise<ResolvedDocumentInput | null> => {
  const url = configuration.url ?? configuration.spec?.url
  if (url) {
    return { url }
  }

  const rawContent = configuration.content ?? configuration.spec?.content
  const content = typeof rawContent === 'function' ? rawContent() : rawContent

  if (isRecord(content)) {
    return { document: content }
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      return isRecord(parsed) ? { document: parsed } : null
    } catch {
      console.error(
        '[@scalar/api-client-react] String OpenAPI documents must be valid JSON when used with the v2 modal.',
      )
    }
  }

  return null
}

const mapModalOptions = (configuration: Partial<ApiClientConfiguration>) => ({
  authentication: configuration.authentication,
  baseServerURL: configuration.baseServerURL,
  hideClientButton: configuration.hideClientButton,
  servers: configuration.servers,
})

const toRoutePayload = (payload?: OpenClientPayload) => {
  if (!payload) {
    return undefined
  }

  if ('requestUid' in payload) {
    console.warn('[@scalar/api-client-react] requestUid routing is no longer supported in the v2 modal.')
    return undefined
  }

  const method = payload.method.toLowerCase()
  if (!isHttpMethod(method)) {
    console.warn('[@scalar/api-client-react] Invalid HTTP method provided for modal routing.', payload.method)
    return undefined
  }

  return {
    path: payload.path,
    method,
    example: payload.example,
    documentSlug: payload.documentSlug,
  }
}

/**
 * Api Client Modal React
 *
 * Provider which mounts the Scalar Api Client Modal vue app.
 * Rebuilt to support multiple instances when using a unique spec.url
 */
export const ApiClientModalProvider = ({ children, initialRequest, configuration = {} }: Props) => {
  const key = configuration.slug ?? configuration.url ?? configuration.spec?.url ?? 'default'
  const el = useRef<HTMLDivElement | null>(null)
  const configurationRef = useRef(configuration)

  const state = useSyncExternalStore(clientStore.subscribe, clientStore.getSnapshot, clientStore.getSnapshot)

  useEffect(() => {
    configurationRef.current = configuration
  }, [configuration])

  useEffect(() => {
    let isMounted = true
    let createdClient: ApiClient | null = null

    const mountClient = async () => {
      if (!el.current || clientStore.getSnapshot().clientDict[key]) {
        return
      }

      const [{ createApiClientModal }, { createWorkspaceStore }] = await Promise.all([
        import('@scalar/api-client/v2/features/modal'),
        import('@scalar/workspace-store/client'),
      ])

      if (!isMounted || !el.current || clientStore.getSnapshot().clientDict[key]) {
        return
      }

      const currentConfiguration = configurationRef.current
      const workspaceStore = createWorkspaceStore({
        meta: {
          'x-scalar-active-proxy': currentConfiguration.proxyUrl,
        },
      })

      const resolvedDocumentInput = await resolveDocumentInput(currentConfiguration)
      if (!resolvedDocumentInput) {
        console.error(
          '[@scalar/api-client-react] Please provide an OpenAPI source through configuration.url or configuration.content.',
        )
        return
      }

      const documentName = currentConfiguration.slug ?? key
      const hasDocument = await workspaceStore.addDocument({
        name: documentName,
        ...resolvedDocumentInput,
      } satisfies WorkspaceDocumentInput)

      if (!hasDocument) {
        console.error('[@scalar/api-client-react] Failed to load the configured OpenAPI document.')
        return
      }

      workspaceStore.update('x-scalar-active-document', documentName)

      const modalClient = createApiClientModal({
        el: el.current,
        workspaceStore,
        options: mapModalOptions(currentConfiguration),
      })

      const client: ApiClient = {
        ...modalClient,
        open: (payload?: OpenClientPayload) => modalClient.open(toRoutePayload(payload)),
        route: (payload: OpenClientPayload) => {
          const routePayload = toRoutePayload(payload)
          if (routePayload) {
            modalClient.route(routePayload)
          }
        },
      }

      clientStore.addClient(key, client)
      clientDict[key] = client
      createdClient = client
    }

    void mountClient()

    return () => {
      isMounted = false
      if (!createdClient) {
        return
      }

      createdClient.app.unmount()
      clientStore.removeClient(key)
      delete clientDict[key]
    }
  }, [key])

  const client = (state.clientDict[key] as ApiClient | undefined) ?? null

  useEffect(() => {
    if (!client || !initialRequest) {
      return
    }
    client.route(initialRequest)
  }, [client, initialRequest])

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

export const useApiClientModal = (): ApiClient | null => useContext(ApiClientModalContext)
