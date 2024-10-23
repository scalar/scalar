import { createApiClientModal } from '@scalar/api-client/layouts/Modal'
import type { ApiClient } from '@scalar/api-client/libs'
import type {
  AuthenticationState,
  Spec,
  SpecConfiguration,
} from '@scalar/types/legacy'
import { ref } from 'vue'

type InitArgs = {
  el: HTMLElement
  spec?: SpecConfiguration
  authentication?: AuthenticationState
  proxyUrl?: string
  servers?: Spec['servers']
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
  const init = async ({
    el,
    spec = {},
    authentication,
    proxyUrl,
    servers,
  }: InitArgs): Promise<ApiClient> => {
    const _client = (await createApiClientModal(el, {
      preferredSecurityScheme: authentication?.preferredSecurityScheme,
      spec,
      proxyUrl,
      servers,
    })) as ApiClient

    client.value = _client
    return _client
  }

  return {
    client,
    init,
  }
}
