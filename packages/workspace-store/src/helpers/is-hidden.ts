import type { XInternal } from '@/schemas/extensions/document/x-internal'
import type { XScalarIgnore } from '@/schemas/extensions/document/x-scalar-ignore'

/**
 * Returns true when an OpenAPI entity (tag, operation, schema, …) is marked as hidden
 * from navigation via `x-internal` or `x-scalar-ignore`.
 */
export const isHidden = (entity: (XInternal & XScalarIgnore) | null | undefined): boolean =>
  Boolean(entity?.['x-internal'] || entity?.['x-scalar-ignore'])
