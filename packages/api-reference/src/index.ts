export { default as ApiReference } from '@/components/ApiReference.vue'
export { default as ApiReferenceLayout } from '@/components/ApiReferenceLayout.vue'
export { default as ModernLayout } from '@/components/Layouts/ModernLayout.vue'
export { SearchButton, SearchModal } from '@/features/Search'
// TODO: This component shouldn’t live in @scalar/api-reference. If it needs to live in scalar/scalar, it should be in @scalar/api-reference-editor
export { default as GettingStarted } from '@/components/GettingStarted.vue'

export { useReactiveSpec } from '@/hooks/useReactiveSpec'
export { createApiReference } from '@/standalone/lib/html-api'

export { Sidebar } from '@/components/Sidebar'
export { Card, CardHeader, CardContent, CardFooter, CardTabHeader, CardTab } from '@/components/Card'
export { Layouts } from '@/components/Layouts'

// TODO: Ideally, we’d remove those exports or at least not export them through the root index.
export { parse } from '@/helpers/parse'
export { createEmptySpecification } from '@/helpers/createEmptySpecification'
export { useNavState } from '@/hooks/useNavState'
export { useSidebar } from '@/hooks/useSidebar'
export { useHttpClientStore } from '@/stores/useHttpClientStore'
export type {
  ApiReferenceConfiguration,
  ReferenceProps,
  // TODO: Deprecated 2025-03-12
  ReferenceConfiguration,
} from '@/types'

// TODO: Deprecated 2025-03-12
export { createScalarReferences } from '@/esm'
