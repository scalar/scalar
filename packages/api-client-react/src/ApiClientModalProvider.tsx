'use client'

import type { RoutePayload } from '@scalar/api-client/v2/features/modal'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react'

import { apiClientModalStore } from './api-client-modal-store'
import type { AddDocumentInput, ApiClientController, ReactApiClientConfiguration } from './create-api-client-controller'
import './style.css'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

const ApiClientModalContext = createContext<ApiClientController | null>(null)

type Props = PropsWithChildren<
  {
    /** Choose a request to initially route to */
    initialRequest?: RoutePayload
    /** Configuration for the Api Client */
    configuration?: ReactApiClientConfiguration
  } & AddDocumentInput
>

/**
 * Api Client Modal React
 *
 * Provider which mounts the Scalar Api Client Modal vue app.
 * One Vue app is shared across the tree; it is recreated if its mount node is no longer connected.
 */
export const ApiClientModalProvider = ({ children, initialRequest, configuration = {} }: Props) => {
  const el = useRef<HTMLDivElement | null>(null)
  const configurationRef = useRef(configuration)
  configurationRef.current = configuration

  const { controller: apiClientController } = useSyncExternalStore(
    apiClientModalStore.subscribe,
    apiClientModalStore.getSnapshot,
    apiClientModalStore.getServerSnapshot,
  )

  useEffect(() => {
    const host = el.current
    if (!host) {
      return
    }

    let cancelled = false

    void apiClientModalStore.acquireApiClientModal(host, configurationRef.current).then(() => {
      if (cancelled) {
        return
      }
      const controller = apiClientModalStore.getSnapshot().controller
      if (controller) {
        if (configurationRef.current.content || configurationRef.current.url) {
          controller.addDocument(configurationRef.current)
        }

        if (initialRequest) {
          controller.route(initialRequest)
        }
      }
    })

    return () => {
      cancelled = true
      apiClientModalStore.releaseApiClientModal()
    }
  }, [initialRequest])

  return (
    <ApiClientModalContext.Provider value={apiClientController}>
      <div
        className="scalar-app"
        ref={el}
      />
      {children}
    </ApiClientModalContext.Provider>
  )
}

export const useApiClientModal = (): ApiClientController | null => useContext(ApiClientModalContext)
