/* eslint-disable no-var */
declare namespace globalThis {
  let __VUE_OPTIONS_API__: boolean
  let __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean
  let __VUE_PROD_DEVTOOLS__: boolean
}

declare module 'vue/dist/vue.esm-bundler.js' {
  export * from 'vue'
}
