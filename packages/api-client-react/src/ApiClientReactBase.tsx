'use client'

import { ApiClient } from '@scalar/api-client'
import React, { useEffect, useRef } from 'react'
import { createApp } from 'vue/dist/vue.esm-bundler.js'

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

/**
 * Api Client base for react
 * You are probably looking for ApiClientReact
 * only use this if you know what you are doing
 */
export const ApiClientReactBase = () => {
  const el = useRef(null)

  useEffect(() => {
    if (!el.current) return undefined

    const vueApp = createApp(ApiClient, { readOnly: true })
    vueApp.mount(el.current)

    // Unmount for react strict mode
    return () => vueApp.unmount()
  }, [el])

  return <div ref={el} />
}
