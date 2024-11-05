import { createApiClientModal } from '@scalar/api-client/layouts/Modal'
import type { ApiClient, ClientConfiguration } from '@scalar/api-client/libs'
import { ref } from 'vue'

type InitArgs = {
  el: HTMLElement
  configuration: ClientConfiguration
}

/** API Client instance */
const client = ref<ApiClient | null>(null)

/**
 * Hook to control and access the API Client
 */
export const useApiClient = (): {
  client: typeof client
  init: (args: InitArgs) => Promise<ApiClient>
} => {
  /** Iniitialize the API Client, must be called only once or we will reset the state */
  const init = async ({ el, configuration }: InitArgs): Promise<ApiClient> => {
    const _client = (await createApiClientModal(el, configuration)) as ApiClient

    client.value = _client
    return _client
  }

  return {
    client,
    init,
  }
}
