export { default as ApiReference } from '@/components/ApiReference.vue'
export { default as ApiReferenceLayout } from '@/components/ApiReferenceLayout.vue'
export { default as ModernLayout } from '@/components/Layouts/ModernLayout.vue'
export { SearchButton, SearchModal } from '@/features/Search'
export { default as GettingStarted } from '@/components/GettingStarted.vue'

export { useReactiveSpec } from '@/hooks/useReactiveSpec'
export { createApiReference } from '@/standalone/lib/html-api'

export { Sidebar } from '@/components/Sidebar'
export { Card, CardHeader, CardContent, CardFooter, CardTabHeader, CardTab } from '@/components/Card'
export { Layouts } from '@/components/Layouts'

export * from '@/stores'
export * from '@/helpers'
export * from '@/types'
export * from '@/hooks'

// TODO: Deprecated 2025-03-12
export { createScalarReferences } from '@/esm'
