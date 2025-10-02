// biome-ignore lint/performance/noBarrelFile: <ignore>
export { default as ApiReference } from '@/components/ApiReference.vue'
export { default as ApiReferenceContent } from '@/components/ApiReferenceContent.vue'
export { default as ApiReferenceLayout } from '@/components/ApiReferenceLayout.vue'
// TODO: This component shouldn't live in @scalar/api-reference. If it needs to live in scalar/scalar, it should be in @scalar/api-reference-editor
export { default as GettingStarted } from '@/components/GettingStarted.vue'
export { SearchButton, SearchModal } from '@/features/Search'
export { useNavState } from '@/hooks/useNavState'
// TODO: Ideally, we'd remove those exports or at least not export them through the root index.
export { createEmptySpecification } from '@/libs/openapi'
export { createApiReference } from '@/standalone/lib/html-api'
export type {
  ApiReferenceConfiguration,
  ReferenceProps,
} from '@/types'
export { default as ApiReferenceWorkspace } from '@/v2/ApiReferenceWorkspace.vue'
// TODO: Remove this export. Needed during store migration
export { useWorkspaceStoreEvents } from '@/v2/hooks/use-workspace-store-events'
