import type { AnyObject } from '@scalar/types/utils'

import { normalize } from '@/utils/normalize'
import { resolveReferences } from '@/utils/resolve-references'

export function resolveNew(specification: AnyObject) {
  return resolveReferences(normalize(specification))
}
