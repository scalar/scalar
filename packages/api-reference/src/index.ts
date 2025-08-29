export { default as ApiReference } from '@/components/ApiReference.vue'
export { default as ApiReferenceLayout } from '@/components/ApiReferenceLayout.vue'
export { default as ApiReferenceWorkspace } from '@/v2/ApiReferenceWorkspace.vue'
export { SearchButton, SearchModal } from '@/features/Search'
// TODO: This component shouldn't live in @scalar/api-reference. If it needs to live in scalar/scalar, it should be in @scalar/api-reference-editor
export { default as GettingStarted } from '@/components/GettingStarted.vue'

export { createApiReference } from '@/standalone/lib/html-api'

export { useSidebar, Sidebar } from '@/features/sidebar'

// TODO: Remove this export. Needed during store migration
export { useWorkspaceStoreEvents } from '@/v2/hooks/use-workspace-store-events'

// TODO: Ideally, we'd remove those exports or at least not export them through the root index.
export { createEmptySpecification } from '@/libs/openapi'
export { useNavState } from '@/hooks/useNavState'
export type {
  ApiReferenceConfiguration,
  ReferenceProps,
} from '@/types'
