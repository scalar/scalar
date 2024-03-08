'use client'

import { ApiReference, type ReferenceProps } from '@scalar/api-reference'
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
  const el = useRef(null)

  useEffect(() => {
    if (!el.current) return undefined

    const vueApp = createApp(ApiReference, props)
    vueApp.mount(el.current)

    // Unmount for react strict mode
    return () => vueApp?.unmount()
  }, [el])

  return <div ref={el} />
}
