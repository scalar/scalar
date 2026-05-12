import { useToasts } from '@scalar/use-toasts'
import { QueryCache, QueryClient } from '@tanstack/vue-query'
import '@tanstack/vue-query'

// Type the error metadata
declare module '@tanstack/vue-query' {
  interface Register {
    queryMeta: {
      /** Toast message shown when the query fails. Handled by the global `QueryCache.onError` callback. */
      toastError?: string
    }
  }
}

const { toast } = useToasts()

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      if (query?.meta?.toastError) {
        toast(query.meta.toastError, 'error')
      }
    },
  }),
})
