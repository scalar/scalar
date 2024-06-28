import { ClientConfiguration, createScalarApiClient } from '@scalar/api-client'
import React, { ReactNode, useEffect, useRef, useState } from 'react'

import './style.css'

type Props = {
  /** Controls whether the modal is open or closed */
  isOpen: boolean
  /** You must set isOpen to false in this method */
  close: () => void
  /** If you change the config, it clears your current state and imports a new spec */
  configuration: ClientConfiguration
  children?: ReactNode
}

/**
 * Api Client React
 */
export const ApiClientReact = ({
  close,
  isOpen = false,
  configuration,
  children,
}: Props) => {
  const el = useRef(null)

  const [client, setClient] = useState<Awaited<
    ReturnType<typeof createScalarApiClient>
  > | null>(null)

  useEffect(() => {
    if (!el.current) return
    createScalarApiClient(el.current, configuration).then(setClient)
  }, [el])

  useEffect(() => {
    if (client?.modalState.open === false) close()
  }, [client?.modalState.open])

  useEffect(() => {
    if (isOpen && client) client.open()
  }, [isOpen])

  useEffect(() => {
    client?.updateConfig(configuration)
  }, [configuration])

  return <div ref={el}>{children}</div>
}
