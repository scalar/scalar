import { isObject } from '@scalar/helpers/object/is-object'

import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getRaw } from '@/magic-proxy/symbols'

import {
  type ReferenceContext,
  childReferenceContext,
  getSchemaVocabulary,
  isReferenceContext,
  isSchemaContext,
  isSchemaMapContext,
} from '../document/reference-context'

/** The authored location survives relocation into external document storage. */
type SourceLocation = {
  source: string
  pointer: string
  context: ReferenceContext
  schemaSiblings: boolean
  /** Custom branches permit object identities and reference siblings. */
  customReferences?: true
}

const schemaTypes = new Set(['null', 'boolean', 'object', 'array', 'number', 'integer', 'string'])

/** Explicit schema declarations distinguish schema maps from arbitrary custom objects. */
const declaresSchema = (value: unknown): boolean =>
  isObject(value) &&
  (typeof value.$id === 'string' ||
    typeof value.$schema === 'string' ||
    typeof value.$anchor === 'string' ||
    (typeof value.type === 'string' && schemaTypes.has(value.type)) ||
    (Array.isArray(value.type) && value.type.every((type) => typeof type === 'string' && schemaTypes.has(type))))

/** Index traversal context separately from the mutable document and reference registry. */
export const documentTraversal = (
  aware: boolean,
  swagger: boolean,
  schemaSiblings: boolean,
  enabled = true,
  asyncapi = false,
  includeCustomReferences = false,
): {
  register: (
    document: unknown,
    source: string,
    context?: ReferenceContext,
    targetPath?: readonly string[],
    customReferences?: boolean,
    referenceSiblings?: boolean,
  ) => void
  registerCopy: (document: unknown, location: SourceLocation) => void
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
    customTarget = false,
    referenceSiblings?: boolean,
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
    const siblings = api
      ? document.swagger !== '2.0' && !String(document.openapi).startsWith('3.0.')
      : (referenceSiblings ?? schemaSiblings)
    const visit = (
      value: unknown,
      path: string[],
      inherited: ReferenceContext,
      inheritedSiblings: boolean,
      customReferences = false,
    ): void => {
      if (value === null || typeof value !== 'object' || visited.has(value)) return
      visited.add(value)
      const inheritedContext = !aware ? 'generic' : (exposures.get(value) ?? inherited)
      const customSchema = customReferences && inheritedContext === 'object' && declaresSchema(value)
      const current = customSchema ? 'schema' : inheritedContext
      const vocabularySiblings = customSchema ? true : inheritedSiblings
      const currentSiblings =
        isObject(value) && typeof value.$schema === 'string'
          ? vocabularySiblings && !/draft-0[3467]/.test(value.$schema)
          : vocabularySiblings
      // Keep the inherited dialect separate for wrappers containing newer schemas.
      const schemaSiblings =
        customReferences && !isSchemaContext(current)
          ? true
          : currentSiblings && (getSchemaVocabulary(current)?.referenceSiblings ?? true)
      locations.set(value, {
        source,
        pointer: `#${path.map((key) => `/${escapeJsonPointer(key)}`).join('')}`,
        context: current,
        schemaSiblings,
        ...(customReferences ? { customReferences: true as const } : {}),
      })
      const ignoredSiblings =
        aware &&
        current !== 'generic' &&
        current !== 'path-item' &&
        isReferenceContext(current) &&
        isObject(value) &&
        typeof value.$ref === 'string' &&
        ((!isSchemaContext(current) && !customReferences) || !schemaSiblings)
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
                includeCustomReferences,
                customReferences,
              })
        const customChild =
          customReferences ||
          (includeCustomReferences &&
            next !== 'data' &&
            childReferenceContext(current, key, { swagger: isSwagger, asyncapi: isAsyncApi, schemaFormat }) === 'data')
        visit(child, [...path, key], next, currentSiblings, customChild)
      }
    }
    // Index a document once; later references only expose their target subtree.
    if (!registered.has(document)) {
      visit(document, [], api ? 'object' : targetContext, siblings, includeCustomReferences && !api && customTarget)
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
      if (location?.context === 'data' && !includeCustomReferences) {
        locations.set(target, { ...location, context: 'data-container' })
        exposures.set(target, 'data-container')
      }
      target = (target as Record<string, unknown>)[key]
    }
    if (target === null || typeof target !== 'object') {
      return
    }
    const targetLocation = locations.get(target)
    // Literal occurrences are exposed through independent occurrence copies.
    if (includeCustomReferences && targetLocation && ['data', 'data-container'].includes(targetLocation.context)) return
    // Native references establish their vocabulary for custom-stored targets.
    // Other targets retain their authored vocabulary.
    const authoredContext = targetLocation?.context
    const nativeExposure = targetLocation?.customReferences && (!customTarget || isSchemaContext(context))
    const retainContext =
      !nativeExposure &&
      ((customTarget &&
        api &&
        authoredContext !== undefined &&
        !['data', 'data-container'].includes(authoredContext)) ||
        (isSchemaContext(authoredContext) && isSchemaContext(context) && (api || authoredContext !== 'schema')))
    if (retainContext) return
    const customSchema = customTarget && context === 'object' && declaresSchema(target)
    const nextContext = customSchema ? 'schema' : context
    const customReferences = customTarget
    exposures.set(target, nextContext)
    const targetSiblings = customSchema ? true : (referenceSiblings ?? targetLocation?.schemaSiblings ?? siblings)
    if (
      targetLocation?.context === nextContext &&
      Boolean(targetLocation?.customReferences) === customReferences &&
      targetLocation.schemaSiblings === targetSiblings
    )
      return
    // The initial walk may already have visited descendants with a different context.
    visited = new WeakSet<object>()
    visit(target, [...targetPath], nextContext, targetSiblings, customReferences)
  }
  return {
    register,
    registerCopy: (document, location) => {
      if (document !== null && typeof document === 'object') registered.delete(document)
      register(document, location.source, location.context, [], location.customReferences, location.schemaSiblings)
      const visited = new WeakSet<object>()
      const label = (value: unknown): void => {
        if (value === null || typeof value !== 'object' || visited.has(value)) return
        visited.add(value)
        const indexed = locations.get(value)
        if (indexed) locations.set(value, { ...indexed, pointer: `${location.pointer}${indexed.pointer.slice(1)}` })
        for (const key of Object.keys(getRaw(value))) label(Reflect.get(value, key))
      }
      label(document)
    },
    location: (node: object): SourceLocation | undefined => locations.get(node),
  }
}
