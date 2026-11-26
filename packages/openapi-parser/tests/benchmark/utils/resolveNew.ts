import type { AnyObject } from '@scalar/types/utils'

import { resolveReferences } from '@/utils/resolve-references'

export function resolveNew(specification: AnyObject) {
  return resolveReferences(specification)
}
