'use client'

// eslint-disable-next-line vue/prefer-import-from-vue
import { getGlobalThis } from '@vue/shared'
import React, { useEffect, useRef } from 'react'
import { createApp, ref } from 'vue/dist/vue.esm-bundler.js'

// These are requied for the vue bundler version
getGlobalThis().__VUE_OPTIONS_API__ = true
getGlobalThis().__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
getGlobalThis().__VUE_PROD_DEVTOOLS__ = false

export const Wrapper = () => {
  const el = useRef(null)

  useEffect(() => {
    if (!el.current) return undefined

    const vueApp = createApp({
      setup() {
        const message = ref('Hello Vue!')
        return {
          message,
        }
      },
      template: `<div>this is vue {{ message }}</div>`,
    })
    vueApp.mount(el.current)

    // Unmount for react strict mode
    return () => vueApp.unmount()
  }, [el])
  return (
    <div
      id="app"
      ref={el}>
      Wrapper
    </div>
  )
}
