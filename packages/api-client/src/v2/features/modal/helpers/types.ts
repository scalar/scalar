import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { Ref } from 'vue'

/**
 * Configuration options supported by the API Client modal constructor.
 */
export type ApiClientModalOptions = Partial<
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
>

export type ApiClientModalOptionsRef = Ref<ApiClientModalOptions>
