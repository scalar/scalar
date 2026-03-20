import type { AnyApiReferenceConfiguration, CreateApiReference } from '@scalar/types'
import Layout from '@theme/Layout'
import React, { useEffect, useRef } from 'react'

import './theme.css'

type Props = {
  configuration?: AnyApiReferenceConfiguration
  route: {
    configuration?: AnyApiReferenceConfiguration
    /** Not sure where the route type is for docusaurus, couldn't find one with an ID, TODO: replace with that */
    id: string
  }
}

// Register the createApiReference function in the global Scalar object (new)
declare global {
  interface Window {
    Scalar: {
      createApiReference: CreateApiReference
    }
  }
}

export const ScalarDocusaurus = ({ configuration, route }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const resolvedConfiguration = configuration ?? route.configuration

  useEffect(() => {
    if (!window.Scalar || !ref.current || !resolvedConfiguration) {
      return
    }

    // Create a new Scalar API Reference
    window.Scalar.createApiReference(ref.current, { ...resolvedConfiguration, hideDarkModeToggle: true })
  }, [resolvedConfiguration])

  return (
    <Layout>
      <div ref={ref} />
    </Layout>
  )
}

export default ScalarDocusaurus
