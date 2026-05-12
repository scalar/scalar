import { useToasts } from '@scalar/use-toasts'
import { QueryCache, QueryClient } from '@tanstack/vue-query'
import '@tanstack/vue-query'

const { toast } = useToasts()

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      if (query?.meta?.errorMessage) {
        toast(query.meta.errorMessage, 'error')
      }
    },
  }),
})
