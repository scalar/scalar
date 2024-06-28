import { ClientConfiguration, createScalarApiClient } from '@scalar/api-client'
import React, { ReactNode, useEffect, useRef, useState } from 'react'

import './style.css'

type Props = {
  /** If you change the config, it clears your current state and imports a new spec */
  configuration: ClientConfiguration
  children?: ReactNode
}

/**
 * Api Client React
 */
export const ApiClientReact = ({ configuration, children }: Props) => {
  const el = useRef(null)

  const [client, setClient] = useState<Awaited<
    ReturnType<typeof createScalarApiClient>
  > | null>(null)

  useEffect(() => {
    if (!el.current) return
    console.log(el.current)
    createScalarApiClient(el.current, configuration).then(setClient)
  }, [el])

  useEffect(() => {
    client?.updateConfig(configuration)
  }, [configuration])

  return <div ref={el}>{children}</div>
}
