/** biome-ignore-all lint/suspicious/noVar: It's OK, Biome. */
/** biome-ignore-all lint/performance/noReExportAll: It's OK, Biome. */
/** biome-ignore-all lint/style/noNamespace: It's OK, Biome. */
declare namespace globalThis {
  var __VUE_OPTIONS_API__: boolean
  var __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean
  var __VUE_PROD_DEVTOOLS__: boolean
}

declare module 'vue/dist/vue.esm-bundler.js' {
  export * from 'vue'
}
