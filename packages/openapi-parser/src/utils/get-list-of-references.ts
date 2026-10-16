import { isObjectLike } from '@scalar/helpers/object/is-object'
import type { AnyObject } from '@scalar/types/utils'

import { type ReferenceContext, canResolveReference, getChildReferenceContext } from './reference-context'

/** Collect external reference filenames without interpreting instance data as references. */
export const getListOfReferences = (specification: AnyObject): string[] => {
  const references = new Set<string>()
  const visited = new WeakSet<object>()

  const visit = (value: unknown, context: ReferenceContext): void => {
    if (context === 'literal' || !isObjectLike(value) || visited.has(value)) {
      return
    }
    visited.add(value)

    if (canResolveReference(context) && typeof value.$ref === 'string' && value.$ref && !value.$ref.startsWith('#')) {
      references.add(value.$ref.split('#')[0])
    }

    for (const [key, child] of Object.entries(value)) {
      visit(child, getChildReferenceContext(context, key, child))
    }
  }

  visit(specification, 'object')
  return [...references]
}
