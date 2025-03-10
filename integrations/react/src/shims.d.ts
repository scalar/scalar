/* eslint-disable no-var */
declare module globalThis {
  var __VUE_OPTIONS_API__: boolean
  var __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean
  var __VUE_PROD_DEVTOOLS__: boolean
}

declare module 'vue/dist/vue.esm-bundler.js' {
  export * from 'vue'
}
