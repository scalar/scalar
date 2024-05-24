'use client'

import { ReferenceProps, createScalarReferences } from '@scalar/api-reference'
import React, { useEffect, useRef, useState } from 'react'
import { ApiReference, type ReferenceProps } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
import React, { useEffect, useRef } from 'react'
import { createApp } from 'vue/dist/vue.esm-bundler.js'

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/**
 * React wrapper around Api Reference
 */
export const ApiReferenceReact = (props: ReferenceProps) => {
  const el = useRef<HTMLDivElement | null>(null)

  const [reference, setReference] = useState<ReturnType<
    typeof createScalarReferences
  > | null>(null)

  useEffect(() => {
    if (!el.current) return reference?.unmount

    const instance = createScalarReferences(
      el.current,
      props.configuration ?? {},
    )
    setReference(instance)

    // Unmount on cleanup
    return instance.unmount
  }, [el])

  useEffect(() => {
    reference?.updateConfig(
      props.configuration ?? {},
      /** For React we will just replace the config if it changes */
      false,
    )
  }, [props.configuration])

  return <div ref={el} />
}
