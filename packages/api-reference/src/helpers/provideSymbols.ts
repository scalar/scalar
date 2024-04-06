import { type OpenAPIV3 } from '@scalar/openapi-parser'
import { type InjectionKey } from 'vue'

/**
 * Collection of symbols to use with provide inject
 */
export const GLOBAL_SECURITY_SYMBOL = Symbol() as InjectionKey<
  () => OpenAPIV3.SecurityRequirementObject[] | undefined
>

export const HIDE_DOWNLOAD_BUTTON_SYMBOL = Symbol() as InjectionKey<
  () => boolean | undefined
>
