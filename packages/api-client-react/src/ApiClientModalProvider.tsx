'use client'

import type { RoutePayload } from '@scalar/api-client/v2/features/modal'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useRef } from 'react'

import { type ApiClientController, createApiClientController } from './create-api-client-controller'
import { createLazyApiClientModal } from './lazy-load'
import './style.css'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

const ApiClientModalContext = createContext<ApiClientController | null>(null)

type Props = PropsWithChildren<{
  /** Choose a request to initially route to */
  initialRequest?: RoutePayload

  /** Configuration for the Api Client */
  configuration?: Partial<ApiClientConfiguration>
}>

/**
 * Api Client Modal React
 *
 * Provider which mounts the Scalar Api Client Modal vue app.
 * Rebuilt to support multiple instances when using a unique spec.url
 */
export const ApiClientModalProvider = ({ children, initialRequest, configuration = {} }: Props) => {
  const el = useRef<HTMLDivElement | null>(null)
  const apiClientController = useRef<ApiClientController | null>(null)

  useEffect(() => {
    const host = el.current
    if (!host) {
      return
    }

    const initializeModal = async () => {
      const { apiClient, workspaceStore } = await createLazyApiClientModal({
        el: host,
        options: configuration,
      })

      apiClientController.current = createApiClientController(apiClient, workspaceStore)

      // Perform initial routing
      if (initialRequest) {
        apiClientController.current.route(initialRequest)
      }
    }

    void initializeModal()

    return () => apiClientController.current?.app.unmount()
  }, [el])

  return (
    <ApiClientModalContext.Provider value={apiClientController.current}>
      <div
        className="scalar-app"
        ref={el}
      />
      {children}
    </ApiClientModalContext.Provider>
  )
}

export const useApiClientModal = (): ApiClientController | null => useContext(ApiClientModalContext)
