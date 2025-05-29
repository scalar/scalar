import { normalize } from '@/utils/normalize'
import { resolveReferences } from '@/utils/resolve-references'
import type { AnyObject } from '@/types'

export async function resolveNew(specification: AnyObject) {
  return resolveReferences(normalize(specification))
}
