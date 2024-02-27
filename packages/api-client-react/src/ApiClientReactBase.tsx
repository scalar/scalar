'use client'

import { ApiClient } from '@scalar/api-client'
import React, { useEffect, useRef } from 'react'
import { createApp } from 'vue/dist/vue.esm-bundler.js'

import './style.css'

// These are required for the vue bundler version
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false

export type BaseProps = {
  isDarkMode: boolean
}

/**
 * Api Client base for react
 * This would be the client itself, use ApiClientReact for the popup
 */
export const ApiClientReactBase = (
  { isDarkMode = true }: BaseProps = { isDarkMode: true },
) => {
  const el = useRef(null)

  useEffect(() => {
    if (!el.current) return undefined

    const vueApp = createApp(ApiClient)
    vueApp.mount(el.current)

    // Unmount for react strict mode
    return () => vueApp.unmount()
  }, [el])

  // Apply light or dark theme
  const className = isDarkMode ? 'dark dark-mode' : 'light light-mode'

  return (
    <div
      ref={el}
      className={className}
    />
  )
}
