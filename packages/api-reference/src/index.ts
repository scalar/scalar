export { default as ApiReference } from '@/components/ApiReference.vue'
export { default as ApiReferenceLayout } from '@/components/ApiReferenceLayout.vue'
export { SearchButton, SearchModal } from '@/features/Search'
// TODO: This component shouldn't live in @scalar/api-reference. If it needs to live in scalar/scalar, it should be in @scalar/api-reference-editor
export { default as GettingStarted } from '@/components/GettingStarted.vue'

export { createApiReference } from '@/standalone/lib/html-api'

export { useSidebar, Sidebar } from '@/features/sidebar'

// TODO: Ideally, we'd remove those exports or at least not export them through the root index.
export { parse } from '@/helpers/parse'
export { createEmptySpecification } from '@/libs/openapi'
export { useNavState } from '@/hooks/useNavState'
export type {
  ApiReferenceConfiguration,
  ReferenceProps,
} from '@/types'
