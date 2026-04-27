import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { Ref } from 'vue'

/**
 * Configuration options for the API Client (app and modal).
 */
export type ApiClientOptions = Partial<
  Pick<
    ApiReferenceConfigurationRaw,
    | 'authentication'
    | 'baseServerURL'
    | 'hideClientButton'
    | 'hiddenClients'
    | 'oauth2RedirectUri'
    | 'proxyUrl'
    | 'servers'
  >
> & {
  /**
   * Custom fetch implementation used for all outgoing API requests.
   * When provided, replaces the global fetch in the request execution engine (sendRequest).
   */
  customFetch?: CustomFetch
}

export type ApiClientOptionsRef = Ref<ApiClientOptions>
