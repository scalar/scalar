import { isObjectLike } from '@scalar/helpers/object/is-object'

import { getSegmentsFromPath } from './get-segments-from-path'
import { type ReferenceContext, canResolveReference, getChildReferenceContext } from './reference-context'

/** A selected document fragment and the kind of object expected by its caller. */
export type ReferenceTarget = { fragment: string; context: ReferenceContext }

/** External dependencies retain their fragment and context until the file is loaded. */
type ExternalReferenceTarget = ReferenceTarget & { filename: string }

/** Collect dependencies from selected fragments, following local aliases in the same context. */
export const getReferenceTargets = (
  specification: unknown,
  targets: ReferenceTarget[] = [{ fragment: '', context: 'document' }],
): ExternalReferenceTarget[] => {
  const references: ExternalReferenceTarget[] = []
  const localTargets: ReferenceTarget[] = []
  const visited = new WeakMap<object, Set<ReferenceContext>>()

  const visitTarget = ({ fragment, context }: ReferenceTarget): void => {
    try {
      const target = getSegmentsFromPath(fragment).reduce<unknown>(
        (value, key) => (isObjectLike(value) && Object.hasOwn(value, key) ? value[key] : undefined),
        specification,
      )
      visit(target, context)
    } catch {
      // Reference resolution reports invalid pointers; dependency collection does not validate them.
    }
  }

  const visit = (value: unknown, context: ReferenceContext): void => {
    if (context === 'literal' || !isObjectLike(value) || visited.get(value)?.has(context)) {
      return
    }
    const contexts = visited.get(value) ?? new Set<ReferenceContext>()
    contexts.add(context)
    visited.set(value, contexts)

    if (canResolveReference(context) && typeof value.$ref === 'string' && value.$ref) {
      const [filename, fragment = ''] = value.$ref.split('#', 2)
      if (filename) {
        references.push({ filename, fragment, context })
      } else {
        localTargets.push({ fragment, context })
      }
    }
    for (const [key, child] of Object.entries(value)) {
      visit(child, getChildReferenceContext(context, key, child))
    }
  }

  for (const target of targets) {
    visitTarget(target)
  }
  for (const target of localTargets) {
    visitTarget(target)
  }
  return references
}
