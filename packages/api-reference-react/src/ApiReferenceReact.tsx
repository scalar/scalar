'use client'

import { useEffect, useRef, useState } from 'react'
import type { MultiReferenceConfiguration } from '@scalar/types/api-reference'
import { type ApiReferenceInstance, createApiReference } from '@scalar/api-reference'

import './style.css'

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/**
 * React wrapper around the Scalar API Reference
 */
export const ApiReferenceReact = (props: { configuration: MultiReferenceConfiguration }) => {
  const el = useRef<HTMLDivElement | null>(null)

  const [reference, setReference] = useState<ApiReferenceInstance | null>(null)

  useEffect(() => {
    if (!el.current) return reference?.app?.unmount

    const instance = createApiReference(el.current, { _integration: 'react', ...props.configuration })
    setReference(instance)

    // Unmount on cleanup
    return instance.destroy
  }, [el])

  useEffect(() => {
    reference?.updateConfiguration({ _integration: 'react', ...props.configuration })
  }, [props.configuration, reference])

  return <div ref={el} />
}
