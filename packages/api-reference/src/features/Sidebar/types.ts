import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Copied from the old useSidebar hook for backwards compatibility, we will update it later */
export type SidebarEntry = {
  id: string
  title: string
  children?: SidebarEntry[]
  httpVerb?: string
  deprecated?: boolean
  isGroup?: boolean
}

export type InputOption = {
  content: OpenAPIV3_1.Document
}

export type SortOptions = {
  tagSort?: TagSortOption['sort']
  operationSort?: OperationSortOption['sort']
}

export type OperationSortOption = {
  sort?: 'alpha' | 'method' | ((a: OpenAPIV3_1.OperationObject, b: OpenAPIV3_1.OperationObject) => number)
}

export type TagSortOption = {
  sort?: 'alpha' | ((a: ExtendedTagObject, b: ExtendedTagObject) => number)
  filter?: (tag: ExtendedTagObject) => boolean
}

// TODO: The store should support those custom properties
export type ExtendedTagObject = OpenAPIV3_1.TagObject & {
  'x-internal'?: boolean
  'x-scalar-ignore'?: boolean
  'x-displayName'?: string
  operations?: any[]
}
