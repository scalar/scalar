'use client'

import type { ApiReferenceConfiguration, ReferenceProps } from '@scalar/api-reference'

import { createScalarReferences } from '@scalar/api-reference'
import { useEffect, useRef, useState } from 'react'

import './style.css'

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/**
 * React wrapper around the Scalar API Reference
 */
export const ApiReferenceReact = (props: ReferenceProps) => {
  const el = useRef<HTMLDivElement | null>(null)

  const [reference, setReference] = useState<ReturnType<typeof createScalarReferences> | null>(null)

  useEffect(() => {
    if (!el.current) return reference?.unmount

    const defaultConfig = {
      _integration: 'react',
    } satisfies ApiReferenceConfiguration

    const mergedConfig = { ...defaultConfig, ...props.configuration }

    const instance = createScalarReferences(el.current, mergedConfig)
    setReference(instance)

    // Unmount on cleanup
    return instance.unmount
  }, [el])

  useEffect(() => {
    const defaultConfig = { _integration: 'react' } satisfies ApiReferenceConfiguration
    const mergedConfig = { ...defaultConfig, ...props.configuration }

    reference?.updateConfig(
      mergedConfig,
      /** For React we will just replace the config if it changes */
      false,
    )
  }, [props.configuration])

  return <div ref={el} />
}
