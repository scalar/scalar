import { createApiClientModal } from '@scalar/api-client/layouts/Modal'
import type { ApiClient } from '@scalar/api-client/libs'
import type {
  AuthenticationState,
  Spec,
  SpecConfiguration,
} from '@scalar/types/legacy'
import { ref } from 'vue'

/** API Client instance */
const client = ref<ApiClient | null>(null)

/**
 * Hook to control and access the API Client
 */
export const useApiClient = (): {
  client: typeof client
  init: (args: any) => Promise<ApiClient>
} => {
  /** Iniitialize the API Client, must be called only once or we will reset the state */
  const init = async ({
    el,
    spec = {},
    authentication,
    proxyUrl,
    servers,
  }: {
    el: HTMLElement
    authentication?: AuthenticationState
    proxyUrl?: string
    servers?: Spec['servers']
    spec: SpecConfiguration
  }) => {
    const _client = await createApiClientModal(el, {
      preferredSecurityScheme: authentication?.preferredSecurityScheme,
      spec,
      proxyUrl,
      servers,
    })

    // @ts-expect-error theres some type issue with a vue app in a ref, possible router related
    client.value = _client
    return _client as ApiClient
  }

  return {
    client,
    init,
  }
}
