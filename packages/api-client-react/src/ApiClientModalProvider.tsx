'use client'

import type {
  ClientConfiguration,
  createApiClientModalSync as CreateApiClientModalSync,
} from '@scalar/api-client'
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
  typeof CreateApiClientModalSync
> | null>(null)

type Props = PropsWithChildren<{
  configuration?: ClientConfiguration
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
export const ApiClientModalProvider = ({
  children,
  configuration = {},
}: Props) => {
  const el = useRef<HTMLDivElement | null>(null)

  const [createClient, setCreateClient] = useState<
    typeof CreateApiClientModalSync | null
  >(null)
  const [client, setClient] = useState<ReturnType<
    typeof CreateApiClientModalSync
  > | null>(null)

  // Lazyload the js to create the client
  useEffect(() => {
    const loadApiClientJs = async () => {
      const { createApiClientModalSync } = await import('@scalar/api-client')
      setCreateClient(() => createApiClientModalSync)
    }
    loadApiClientJs()
  }, [])

  useEffect(() => {
    if (!el?.current || !createClient) return

    // Create vue app
    const _client = createClient(el.current, configuration, true, true)
    setClient(_client)

    // We update the config as we are using the sync version
    if (configuration.spec) _client.updateSpec(configuration.spec)

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
