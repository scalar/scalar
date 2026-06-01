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
    | 'customFetch'
    | 'hideClientButton'
    | 'hiddenClients'
    | 'oauth2RedirectUri'
    | 'proxyUrl'
    | 'servers'
  >
>

export type ApiClientOptionsRef = Ref<ApiClientOptions>
