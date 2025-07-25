'use client'

import type { createApiClientModalSync as CreateApiClientModalSync } from '@scalar/api-client/layouts/Modal'
import type { OpenClientPayload } from '@scalar/api-client/libs'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react'

export type { OpenClientPayload }

import { clientStore } from './client-store'

import './style.css'

const ApiClientModalContext = createContext<ReturnType<typeof CreateApiClientModalSync> | null>(null)

type Props = PropsWithChildren<{
  /** Choose a request to initially route to */
  initialRequest?: OpenClientPayload
  /** Configuration for the Api Client */
  configuration?: Partial<ApiClientConfiguration>
}>

/** Ensures we only load createClient once */
let isLoading = false

/** Hack: this is strictly to prevent creation of extra clients as the store lags a bit */
const clientDict: Record<string, ReturnType<typeof CreateApiClientModalSync>> = {}

/**
 * Api Client Modal React
 *
 * Provider which mounts the Scalar Api Client Modal vue app.
 * Rebuilt to support multiple instances when using a unique spec.url
 */
export const ApiClientModalProvider = ({ children, initialRequest, configuration = {} }: Props) => {
  const key = configuration.spec?.url || 'default'
  const el = useRef<HTMLDivElement | null>(null)

  const state = useSyncExternalStore(clientStore.subscribe, clientStore.getSnapshot, clientStore.getSnapshot)

  // Lazyload the js to create the client, but we only wanna call this once
  useEffect(() => {
    const loadApiClientJs = async () => {
      isLoading = true
      const { createApiClientModalSync } = await import('@scalar/api-client/layouts/Modal')
      clientStore.setCreateClient(createApiClientModalSync)
    }
    if (!isLoading) {
      loadApiClientJs()
    }
  }, [])

  useEffect(() => {
    if (!el.current || !state.createClient || clientDict[key]) {
      return () => null
    }

    // Check for cached client first
    const _client = state.createClient({
      el: el.current,
      configuration,
    })

    const updateConfig = async () => {
      await _client.updateConfig(configuration!)
      if (initialRequest) {
        _client.route(initialRequest)
      }
    }

    // Add the client to the store and dict
    clientStore.addClient(key, _client)
    clientDict[key] = _client

    // We update the config as we are using the sync version
    updateConfig()

    // Ensure we unmount the vue app on unmount
    return () => {
      _client.app.unmount()
      clientStore.removeClient(key)
      delete clientDict[key]
    }
  }, [el.current, state.createClient])

  return (
    <ApiClientModalContext.Provider value={state.clientDict[key] ?? null}>
      <div
        className="scalar-app"
        ref={el}
      />
      {children}
    </ApiClientModalContext.Provider>
  )
}

export const useApiClientModal = (): ReturnType<typeof CreateApiClientModalSync> | null =>
  useContext(ApiClientModalContext)
