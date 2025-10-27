import type { AnyApiReferenceConfiguration } from '@scalar/types'

export type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

// biome-ignore lint/performance/noBarrelFile: <ignore>
export { default as ApiReference } from '@/components/ApiReference.vue'
export { default as GettingStarted } from '@/components/GettingStarted.vue'
export { SearchButton, SearchModal } from '@/features/Search'
// TODO: Ideally, we'd remove those exports or at least not export them through the root index.
export { createEmptySpecification } from '@/helpers/openapi'
export { createApiReference } from '@/standalone/lib/html-api'
// TODO: Remove this export. Needed during store migration
export { useWorkspaceStoreEvents } from '@/v2/hooks/use-workspace-store-events'

export type ReferenceProps = {
  configuration?: AnyApiReferenceConfiguration
}
