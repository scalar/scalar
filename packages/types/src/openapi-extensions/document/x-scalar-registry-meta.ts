export type XScalarRegistryMeta = {
  'x-scalar-registry-meta'?: {
    namespace: string
    slug: string
    version: string
    commitHash?: string
    conflictCheckedAgainstHash?: string
    hasConflict?: boolean
  }
}
