import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { Ref } from 'vue'

import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'
import type { CaptureOAuth2Callback } from '@/v2/blocks/scalar-auth-selector-block/helpers/oauth'

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
  /**
   * Captures the OAuth2 redirect for interactive flows where browser-popup polling
   * cannot work. The desktop app provides this to run authorization through the
   * system browser plus a loopback redirect target.
   */
  captureOAuth2Callback?: CaptureOAuth2Callback
}

export type ApiClientOptionsRef = Ref<ApiClientOptions>
