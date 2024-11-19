import type { ReferenceConfiguration } from '@/types'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { InjectionKey } from 'vue'

/**
 * Collection of symbols to use with provide inject
 */
export const GLOBAL_SECURITY_SYMBOL = Symbol() as InjectionKey<
  () =>
    | OpenAPIV3.SecurityRequirementObject[]
    | OpenAPIV3_1.SecurityRequirementObject[]
    | undefined
>

export const HIDE_DOWNLOAD_BUTTON_SYMBOL = Symbol() as InjectionKey<
  () => boolean | undefined
>

export const HIDE_TEST_REQUEST_BUTTON_SYMBOL = Symbol() as InjectionKey<
  () => boolean | undefined
>

export const OPENAPI_DOCUMENT_URL_SYMBOL = Symbol() as InjectionKey<
  () => string | undefined
>

export const INTEGRATION_SYMBOL = Symbol() as InjectionKey<
  () => ReferenceConfiguration['_integration']
>
