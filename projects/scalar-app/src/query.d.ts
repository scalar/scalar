import '@tanstack/vue-query'

declare module '@tanstack/vue-query' {
  interface Register {
    queryMeta: {
      /** Toast message shown when the query fails. Handled by the global `QueryCache.onError` callback. */
      errorMessage?: string
    }
  }
}
