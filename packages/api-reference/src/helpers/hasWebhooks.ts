import type { OpenAPI } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'

export const hasWebhooks = (spec?: Spec | OpenAPI.Document) => {
  if (!spec) {
    return false
  }

  if (Object.keys(spec?.webhooks ?? {}).length) {
    return true
  }

  return false
}
