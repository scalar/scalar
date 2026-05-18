import type { XInternal, XScalarIgnore } from '@scalar/types/extensions/document'

/**
 * Returns true when an OpenAPI entity (tag, operation, schema, …) is marked as hidden
 * from navigation via `x-internal` or `x-scalar-ignore`.
 */
export const isHidden = (entity: (XInternal & XScalarIgnore) | null | undefined): boolean =>
  Boolean(entity?.['x-internal'] || entity?.['x-scalar-ignore'])
