import type { AnyApiReferenceConfiguration, CreateApiReference } from '@scalar/types'
import React, { useEffect, useRef } from 'react'

import Layout from '@theme/Layout'
import './theme.css'

type Props = {
  route: {
    configuration: AnyApiReferenceConfiguration
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

export const ScalarDocusaurus = ({ route }: Props) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.Scalar || !ref.current) {
      return
    }

    // Create a new Scalar API Reference
    window.Scalar.createApiReference(ref.current, { ...route.configuration, hideDarkModeToggle: true })
  }, [ref])

  return (
    <Layout>
      <div ref={ref} />
    </Layout>
  )
}

export default ScalarDocusaurus
