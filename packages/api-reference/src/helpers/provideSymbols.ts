import type { ReferenceConfiguration } from '@/types'
import type { InjectionKey } from 'vue'

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
