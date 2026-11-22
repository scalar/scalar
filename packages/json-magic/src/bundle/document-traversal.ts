import { isObject } from '@scalar/helpers/object/is-object'

import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getRaw } from '@/magic-proxy/proxy'

import {
  type ReferenceContext,
  childReferenceContext,
  getSchemaVocabulary,
  isReferenceContext,
  isSchemaContext,
  isSchemaMapContext,
} from '../document/reference-context'

/** The authored location survives relocation into external document storage. */
type SourceLocation = { source: string; pointer: string; context: ReferenceContext; schemaSiblings: boolean }

/** Index traversal context separately from the mutable document and reference registry. */
export const documentTraversal = (
  aware: boolean,
  swagger: boolean,
  schemaSiblings: boolean,
  enabled = true,
  asyncapi = false,
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
    if (!enabled || document === null || typeof document !== 'object') {
      return
    }
    let visited = new WeakSet<object>()
    const api = isObject(document) && ['openapi', 'swagger', 'asyncapi'].some((key) => key in document)
    // External fragments inherit the root API type; complete documents use their own.
    const isAsyncApi = api ? typeof document.asyncapi === 'string' : asyncapi
    const targetContext = context ?? (api ? 'object' : 'schema')
    const isSwagger = api ? document.swagger === '2.0' : swagger
    const siblings = api ? document.swagger !== '2.0' && !String(document.openapi).startsWith('3.0.') : schemaSiblings
    const visit = (value: unknown, path: string[], inherited: ReferenceContext, inheritedSiblings: boolean): void => {
      if (value === null || typeof value !== 'object' || visited.has(value)) {
        return
      }
      visited.add(value)
      const current = !aware ? 'generic' : (exposures.get(value) ?? inherited)
      const currentSiblings =
        isObject(value) && typeof value.$schema === 'string'
          ? inheritedSiblings && !/draft-0[3467]/.test(value.$schema)
          : inheritedSiblings
      // Keep the inherited dialect separate for wrappers containing newer schemas.
      const schemaSiblings = currentSiblings && (getSchemaVocabulary(current)?.referenceSiblings ?? true)
      locations.set(value, {
        source,
        pointer: `#${path.map((key) => `/${escapeJsonPointer(key)}`).join('')}`,
        context: current,
        schemaSiblings,
      })
      const ignoredSiblings =
        aware &&
        current !== 'generic' &&
        current !== 'path-item' &&
        isReferenceContext(current) &&
        isObject(value) &&
        typeof value.$ref === 'string' &&
        (!isSchemaContext(current) || !schemaSiblings)
      const schemaFormat = isObject(value) && typeof value.schemaFormat === 'string' ? value.schemaFormat : undefined
      // Virtual $ref-value links can reach a message before its authored location and
      // give it the wrong context. Enumerate authored keys but retain proxied reads
      // so locations use the same identities as the bundler and preserve overrides.
      // Keys present only in an overrides layer are not indexed.
      for (const key of Object.keys(getRaw(value))) {
        const child = (value as Record<string, unknown>)[key]
        // Ignored reference siblings must not introduce schema resources or anchors.
        const next = ignoredSiblings
          ? 'data'
          : Array.isArray(value) && !['objects', 'messages'].includes(current) && !isSchemaMapContext(current)
            ? current
            : childReferenceContext(current, key, {
                swagger: isSwagger,
                openapi30: api ? String(document.openapi).startsWith('3.0.') : !schemaSiblings && !asyncapi && !swagger,
                asyncapi: isAsyncApi,
                schemaFormat,
              })
        visit(child, [...path, key], next, currentSiblings)
      }
    }
    // Index a document once; later references only expose their target subtree.
    if (!registered.has(document)) {
      visit(document, [], api ? 'object' : targetContext, siblings)
      registered.add(document)
    }
    if (context === undefined) {
      return
    }
    let target: unknown = document
    for (const key of targetPath) {
      if (target === null || typeof target !== 'object') {
        return
      }
      const location = locations.get(target)
      if (location?.context === 'data') {
        locations.set(target, { ...location, context: 'data-container' })
        exposures.set(target, 'data-container')
      }
      target = (target as Record<string, unknown>)[key]
    }
    if (target === null || typeof target !== 'object') {
      return
    }
    const targetLocation = locations.get(target)
    // References retain the target's authored vocabulary. Only a fragment initially
    // guessed to be a generic schema needs its referring schema context applied.
    if (
      isSchemaContext(targetLocation?.context) &&
      isSchemaContext(context) &&
      (api || targetLocation?.context !== 'schema')
    ) {
      return
    }
    exposures.set(target, context)
    if (targetLocation?.context === context) {
      return
    }
    // The initial walk may already have visited descendants with a different context.
    const targetSiblings = targetLocation?.schemaSiblings ?? siblings
    visited = new WeakSet<object>()
    visit(target, [...targetPath], context, targetSiblings)
  }
  return { register, location: (node: object): SourceLocation | undefined => locations.get(node) }
}
