'use client'

import { createApiReference } from '@scalar/api-reference'
import type { AnyApiReferenceConfiguration, ApiReferenceInstance } from '@scalar/types/api-reference'
import { useEffect, useRef, useState } from 'react'

import './style.css'

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/**
 * React wrapper around the Scalar API Reference
 */
export const ApiReferenceReact = (props: { configuration: AnyApiReferenceConfiguration }) => {
  const el = useRef<HTMLDivElement | null>(null)

  const [reference, setReference] = useState<ApiReferenceInstance | null>(null)

  /** handle adding the integration to the config */
  const addIntegration = () =>
    Array.isArray(props.configuration)
      ? props.configuration.map((c) => ({ _integration: 'react' as const, ...c }))
      : { _integration: 'react' as const, ...props.configuration }

  useEffect(() => {
    if (!el.current) {
      return reference?.app?.unmount
    }

    const instance = createApiReference(el.current, addIntegration())
    setReference(instance)

    // Unmount on cleanup
    return instance.destroy
  }, [el])

  useEffect(() => {
    reference?.updateConfiguration(addIntegration())
  }, [props.configuration, reference])

  return <div ref={el} />
}
