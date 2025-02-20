// biome-ignore lint/suspicious/useNamespaceKeyword: We want it to be a module here.
// biome-ignore lint/style/noNamespace: We want it to be a module here.
declare module globalThis {
  let __VUE_OPTIONS_API__: boolean
  let __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean
  let __VUE_PROD_DEVTOOLS__: boolean
}

declare module 'vue/dist/vue.esm-bundler.js' {
  export * from 'vue'
}
