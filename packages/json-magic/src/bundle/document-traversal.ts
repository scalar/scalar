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
): {
  register: (document: unknown, source: string, context?: ReferenceContext, targetPath?: readonly string[]) => void
  location: (node: object) => SourceLocation | undefined
} => {
  const locations = new WeakMap<object, SourceLocation>()
  const register = (
    document: unknown,
    source: string,
    context?: ReferenceContext,
    targetPath: readonly string[] = [],
  ): void => {
    const visited = new WeakSet<object>()
    const api = isObject(document) && ['openapi', 'swagger', 'asyncapi'].some((key) => key in document)
    const targetContext = context ?? (api ? 'object' : 'schema')
    const isSwagger = api ? document.swagger === '2.0' : swagger
    const siblings = api ? document.swagger !== '2.0' && !String(document.openapi).startsWith('3.0.') : schemaSiblings
    const visit = (value: unknown, path: string[], inherited: ReferenceContext, inheritedSiblings: boolean): void => {
      if (value === null || typeof value !== 'object' || visited.has(value)) return
      visited.add(value)
      const current = !aware
        ? 'generic'
        : path.length === targetPath.length && path.every((key, i) => key === targetPath[i])
          ? targetContext
          : inherited
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
        const childPath = [...path, key]
        const leadsToTarget =
          childPath.length < targetPath.length && childPath.every((segment, i) => segment === targetPath[i])
        visit(child, childPath, next === 'data' && leadsToTarget ? 'data-container' : next, currentSiblings)
      }
    }
    visit(document, [], api ? 'object' : targetContext, siblings)
  }
  return { register, location: (node: object): SourceLocation | undefined => locations.get(node) }
}
