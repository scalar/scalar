import { isObject } from '@scalar/helpers/object/is-object'

import { escapeJsonPointer } from '@/helpers/escape-json-pointer'

import { type ReferenceContext, childReferenceContext } from './reference-context'

/** The authored location survives relocation into external document storage. */
type SourceLocation = { source: string; pointer: string; context: ReferenceContext; schemaSiblings: boolean }

/** Index traversal context separately from the mutable document and reference registry. */
export const documentTraversal = (
  aware: boolean,
  swagger: boolean,
  schemaSiblings: boolean,
  enabled = true,
): {
  register: (document: unknown, source: string, context?: ReferenceContext, targetPath?: readonly string[]) => void
  location: (node: object) => SourceLocation | undefined
} => {
  const exposures = new WeakMap<object, ReferenceContext>()
  const locations = new WeakMap<object, SourceLocation>()
  const registered = new WeakSet<object>()
  const register = (
    document: unknown,
    source: string,
    context?: ReferenceContext,
    targetPath: readonly string[] = [],
  ): void => {
    if (!enabled || document === null || typeof document !== 'object') return
    let visited = new WeakSet<object>()
    const api = isObject(document) && ['openapi', 'swagger', 'asyncapi'].some((key) => key in document)
    const targetContext = context ?? (api ? 'object' : 'schema')
    const isSwagger = api ? document.swagger === '2.0' : swagger
    const siblings = api ? document.swagger !== '2.0' && !String(document.openapi).startsWith('3.0.') : schemaSiblings
    const visit = (value: unknown, path: string[], inherited: ReferenceContext, inheritedSiblings: boolean): void => {
      if (value === null || typeof value !== 'object' || visited.has(value)) return
      visited.add(value)
      const current = !aware ? 'generic' : (exposures.get(value) ?? inherited)
      const currentSiblings =
        isObject(value) && typeof value.$schema === 'string'
          ? inheritedSiblings && !/draft-0[3467]/.test(value.$schema)
          : inheritedSiblings
      locations.set(value, {
        source,
        pointer: `#${path.map((key) => `/${escapeJsonPointer(key)}`).join('')}`,
        context: current,
        schemaSiblings: currentSiblings,
      })
      for (const [key, child] of Object.entries(value)) {
        const next =
          Array.isArray(value) && !['objects', 'schemas', 'messages'].includes(current)
            ? current
            : childReferenceContext(current, key, isSwagger)
        visit(child, [...path, key], next, currentSiblings)
      }
    }
    // Index a document once; later references only expose their target subtree.
    if (!registered.has(document)) {
      visit(document, [], api ? 'object' : targetContext, siblings)
      registered.add(document)
    }
    if (context === undefined) return
    let target: unknown = document
    for (const key of targetPath) {
      if (target === null || typeof target !== 'object') return
      const location = locations.get(target)
      if (location?.context === 'data') {
        locations.set(target, { ...location, context: 'data-container' })
        exposures.set(target, 'data-container')
      }
      target = (target as Record<string, unknown>)[key]
    }
    if (target === null || typeof target !== 'object') return
    exposures.set(target, context)
    if (locations.get(target)?.context === context) return
    // The initial walk may already have visited descendants with a different context.
    const targetSiblings = locations.get(target)?.schemaSiblings ?? siblings
    visited = new WeakSet<object>()
    visit(target, [...targetPath], context, targetSiblings)
  }
  return { register, location: (node: object): SourceLocation | undefined => locations.get(node) }
}
