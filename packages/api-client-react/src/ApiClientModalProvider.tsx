'use client'

import { createModalRouter } from '@scalar/api-client'
import { ApiClientModal } from '@scalar/api-client/layouts/Modal'
import type {
  ClientConfiguration,
  createApiClient as CreateApiClient,
} from '@scalar/api-client/libs'
import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import './style.css'

const ApiClientModalContext = createContext<ReturnType<
  typeof CreateApiClient
> | null>(null)

type Props = PropsWithChildren<{
  config?: ClientConfiguration
}>

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/**
 * Api Client Modal React
 *
 * Provider which mounts the Scalar Api Client Modal vue app
 */
export const ApiClientModalProvider = ({ children, config = {} }: Props) => {
  const el = useRef<HTMLDivElement | null>(null)

  const [createClient, setCreateClient] = useState<
    typeof CreateApiClient | null
  >(null)
  const [client, setClient] = useState<ReturnType<
    typeof CreateApiClient
  > | null>(null)

  // Lazyload the js to create the client
  useEffect(() => {
    const loadApiClientJs = async () => {
      const { createApiClient } = await import('@scalar/api-client/libs')
      setCreateClient(() => createApiClient)
    }
    loadApiClientJs()
  }, [])

  useEffect(() => {
    if (!el?.current || !createClient) return

    // Create vue app
    const _client = createClient({
      el: el.current,
      appComponent: ApiClientModal,
      config,
      isReadOnly: true,
      mountOnInitialize: true,
      persistData: false,
      router: createModalRouter(),
    })
    setClient(_client)

    // We update the config as we are using the sync version
    if (config.spec) _client.updateSpec(config.spec)

    // Ensure we unmount the vue app on unmount
    // eslint-disable-next-line consistent-return
    return () => {
      _client.app.unmount()
      setClient(null)
    }
  }, [el, createClient])

  return (
    <ApiClientModalContext.Provider value={client}>
      <div ref={el} />
      {children}
    </ApiClientModalContext.Provider>
  )
}

export const useApiClientModal = () => useContext(ApiClientModalContext)
