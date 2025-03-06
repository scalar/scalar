import { createApiClientModal } from '@scalar/api-client/layouts/Modal'
import type { ApiClient, CreateApiClientParams } from '@scalar/api-client/libs'
import { ref } from 'vue'

type Props = Pick<CreateApiClientParams, 'el' | 'configuration' | 'store'>

/** API Client instance */
const client = ref<ApiClient | null>(null)

/**
 * Hook to control and access the API Client
 */
export const useApiClient = (): {
  client: typeof client
  init: (args: Props) => Promise<ApiClient>
} => {
  /** Initialize the API Client, must be called only once or we will reset the state */
  const init = async (props: Props): Promise<ApiClient> => {
    const _client = (await createApiClientModal(props)) as ApiClient

    client.value = _client
    return _client
  }

  return {
    client,
    init,
  }
}
