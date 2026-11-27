import { isObject } from '@scalar/helpers/object/is-object'

import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getRaw } from '@/magic-proxy/symbols'

import { type ReferenceContext, isSchemaContext } from '../document/reference-context'
import {
  childReferencePosition,
  declaresSchema,
  ignoresReferenceSiblings,
  referencePosition,
} from '../document/reference-position'

/** The authored location survives relocation into external document storage. */
type SourceLocation = {
  source: string
  pointer: string
  context: ReferenceContext
  schemaSiblings: boolean
  /** Custom branches permit object identities and reference siblings. */
  customReferences?: true
}

type TraversalDialect = { swagger: boolean; openapi30: boolean; asyncapi: boolean }

/** Select the traversal dialect for a complete API description. */
export const getDocumentTraversalDialect = (document: unknown): TraversalDialect | undefined => {
  if (!isObject(document)) return undefined

  const format = document['x-scalar-document-type']
  if (
    (format === undefined || format === 'asyncapi') &&
    typeof document.asyncapi === 'string' &&
    /^\d+\.\d+(?:\.|$)/.test(document.asyncapi)
  ) {
    return { swagger: false, openapi30: false, asyncapi: true }
  }
  if (format !== undefined && format !== 'openapi') return undefined
  if (document.swagger === '2.0') return { swagger: true, openapi30: false, asyncapi: false }
  // Workspace normalization uses an empty version for versionless OpenAPI input.
  if (typeof document.openapi === 'string') {
    return { swagger: false, openapi30: /^3\.0(?:\.|$)/.test(document.openapi), asyncapi: false }
  }
  return undefined
}

/** Index traversal context separately from the mutable document and reference registry. */
export const documentTraversal = (
  root: unknown,
  {
    aware = true,
    enabled = true,
    includeCustomReferences = false,
  }: { aware?: boolean; enabled?: boolean; includeCustomReferences?: boolean } = {},
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
  const rootDialect = getDocumentTraversalDialect(root)
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
    // External fragments inherit the root API type; complete documents use their own.
    const dialect = document === root ? rootDialect : getDocumentTraversalDialect(document)
    const api = dialect !== undefined
    const { swagger, openapi30, asyncapi } = dialect ??
      rootDialect ?? {
        swagger: false,
        openapi30: false,
        asyncapi: false,
      }
    const targetContext = context ?? (api ? 'object' : 'schema')
    const schemaSiblings = !swagger && !openapi30
    const siblings = api ? schemaSiblings : (referenceSiblings ?? schemaSiblings)
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
      const position = referencePosition(value, inheritedContext, inheritedSiblings, customReferences)
      locations.set(value, {
        source,
        pointer: `#${path.map((key) => `/${escapeJsonPointer(key)}`).join('')}`,
        context: position.context,
        schemaSiblings: position.schemaSiblings,
        ...(customReferences ? { customReferences: true as const } : {}),
      })
      const ignoredSiblings = aware && ignoresReferenceSiblings(value, position)
      // Virtual $ref-value links can reach a message before its authored location and
      // give it the wrong context. Enumerate authored keys but retain proxied reads
      // so locations use the same identities as the bundler and preserve overrides.
      // Keys present only in an overrides layer are not indexed.
      for (const key of Object.keys(getRaw(value))) {
        const child = (value as Record<string, unknown>)[key]
        const next = ignoredSiblings
          ? { context: 'data' as const, customReferences }
          : childReferencePosition(value, key, position, { swagger, openapi30, asyncapi }, includeCustomReferences)
        visit(child, [...path, key], next.context, position.childSchemaSiblings, next.customReferences)
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
      if (target === null || typeof target !== 'object' || !Object.hasOwn(getRaw(target), key)) {
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
