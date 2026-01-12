import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

export type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

export { default as ApiReference } from '@/components/ApiReference.vue'
export { default as GettingStarted } from '@/components/GettingStarted.vue'
export { SearchButton, SearchModal } from '@/features/Search'
// TODO: Ideally, we'd remove those exports or at least not export them through the root index.
export { createEmptySpecification } from '@/helpers/openapi'
export { createApiReference } from '@/standalone/lib/html-api'

export type ReferenceProps = {
  configuration?: AnyApiReferenceConfiguration
}
