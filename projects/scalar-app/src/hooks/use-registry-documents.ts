import { useToasts } from '@scalar/use-toasts'
import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import { computed, watch } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

/**
 * Fetches and caches API documents from the Scalar registry for your current team
 *
 * @returns The query result extended with a `documents` computed ref (defaults to `[]`).
 */
export const useRegistryDocuments = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  const { isLoggedIn } = useAuth()
  const queryKey = ['documents'] satisfies QueryKey

  // Set some defaults
  const { toast } = useToasts()

  const query = useQuery(
    {
      queryKey,
      queryFn: () => scalarClient.registry.listAllApiDocuments().then((response) => response.apiDocuments ?? []),
      enabled: isLoggedIn,
      refetchOnMount: true,
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      ...options,
    },
    queryClient,
  )

  watch(
    () => query.error.value,
    (error) => {
      if (error) {
        toast('Failed to fetch documents', 'error')
      }
    },
  )

  return {
    ...query,
    documents: computed(() => query.data.value ?? []),
  }
}
