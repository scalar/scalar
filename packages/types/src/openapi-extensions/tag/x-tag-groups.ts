import type { XScalarOrder } from '../general/x-scalar-order'

export type XTagGroup = {
  name: string
  tags: string[]
} & XScalarOrder

export type XTagGroups = {
  'x-tagGroups'?: XTagGroup[]
}
