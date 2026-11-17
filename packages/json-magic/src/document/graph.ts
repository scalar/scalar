import { isObject as isDocument } from '@scalar/helpers/object/is-object'
import { type Result, err, ok } from '@scalar/helpers/types/result'

import { decodeUriFragment } from '@/helpers/decode-uri-fragment'
import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { resolveReferencePath } from '@/helpers/resolve-reference-path'

import { pointerSegments, pointerValue } from './pointer'
import {
  type ReferenceContext,
  childReferenceContext,
  getSchemaVocabulary,
  isReferenceContext,
  isSchemaContext,
  isSchemaMapContext,
} from './reference-context'

type Entry = {
  value: unknown
  path: string
  origin: string
  base: string
  context: ReferenceContext
  /** Stored fragments have no authored schema vocabulary until a reference supplies it. */
  inferredContext: boolean
}
/** Indexed locations and reference resolution for a bundled API description. */
export type DocumentGraph = {
  entries: Map<string, Entry>
  resolve: (reference: string, from?: string) => string | undefined
  dereference: (value: unknown, path: string, seen?: Set<string>) => unknown
  expose: (path: string, context: ReferenceContext) => void
}
/** HTTP operation fields understood by the OpenAPI graph and use-site filters. */
export const operationMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace', 'query']
/** Append a literal key to a document pointer, preserving slash and tilde characters. */
export const childPath = (parent: string, key: string): string => `${parent}/${escapeJsonPointer(key)}`

const modernSchemaDocument = (document: Record<string, unknown>): boolean =>
  document.swagger !== '2.0' && !String(document.openapi).startsWith('3.0.')

const traversalContext = (
  value: object,
  context: ReferenceContext,
  key: string,
  document: Record<string, unknown>,
): ReferenceContext => {
  if (!Array.isArray(value)) {
    return childReferenceContext(context, key, {
      swagger: document.swagger === '2.0',
      asyncapi: typeof document.asyncapi === 'string',
      schemaFormat: isDocument(value) && typeof value.schemaFormat === 'string' ? value.schemaFormat : undefined,
    })
  }
  if (context === 'messages') {
    return 'message'
  }
  if (isSchemaMapContext(context)) {
    return childReferenceContext(context, key, {
      swagger: document.swagger === '2.0',
      asyncapi: typeof document.asyncapi === 'string',
    })
  }
  return context === 'objects' ? 'object' : context
}

/** Index the bundled graph without fetching anything after transformations. */
export const createGraph = (document: Record<string, unknown>, origin: string): DocumentGraph => {
  const entries = new Map<string, Entry>()
  const resources = new Map<string, string>([[origin, '']])
  const anchors = new Map<string, string>()
  const modernSchemas = modernSchemaDocument(document)
  const index = (
    value: unknown,
    path: string,
    base: string,
    context: ReferenceContext,
    ancestors: Set<object>,
    inferredContext = false,
  ): void => {
    const vocabulary = getSchemaVocabulary(context)
    const externalRoot = pointerSegments(path).length === 2 && path.startsWith('/x-ext/')
    const identity = isDocument(value)
      ? externalRoot
        ? value.$id
        : vocabulary?.idKeyword && (modernSchemas || typeof document.asyncapi === 'string')
          ? value[vocabulary.idKeyword]
          : undefined
      : undefined
    const currentOrigin = typeof identity === 'string' ? resolveReferencePath(base, identity) : base
    entries.set(path, { value, path, base, origin: currentOrigin, context, inferredContext })
    if (value === null || typeof value !== 'object' || context === 'data' || ancestors.has(value)) {
      return
    }
    const next = new Set(ancestors).add(value)
    if (typeof identity === 'string') {
      resources.set(currentOrigin, path)
    }
    if (isDocument(value) && vocabulary) {
      for (const anchor of modernSchemas && vocabulary.anchors ? [value.$anchor, value.$dynamicAnchor] : []) {
        if (typeof anchor === 'string') {
          anchors.set(`${currentOrigin}#${anchor}`, path)
        }
      }
    }
    for (const [key, child] of Object.entries(value)) {
      const childContext = traversalContext(value, context, key, document)
      index(child, childPath(path, key), currentOrigin, childContext, next, inferredContext)
    }
  }
  index(document, '', origin, 'object', new Set())
  if (isDocument(document['x-ext'])) {
    for (const [key, value] of Object.entries(document['x-ext'])) {
      const path = childPath('/x-ext', key)
      const api = isDocument(value) && ('openapi' in value || 'swagger' in value || 'asyncapi' in value)
      // References into stored fragments supply their semantic context at the use site.
      index(value, path, origin, api ? 'object' : 'schema', new Set(), !api)
    }
  }
  const expose = (path: string, context: ReferenceContext): void => {
    const entry = entries.get(path)
    if (
      entry?.context === context ||
      (isSchemaContext(entry?.context) && isSchemaContext(context) && !entry.inferredContext)
    ) {
      return
    }
    const ancestor = [...entries.values()]
      .filter((candidate) => path.startsWith(`${candidate.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0]
    const value = pointerValue(document, pointerSegments(path))
    if (value !== undefined) {
      index(value, path, entry?.base ?? ancestor?.origin ?? origin, context, new Set())
    }
  }

  const resolve = (reference: string, from = ''): string | undefined => {
    const base = entries.get(from)?.origin ?? origin
    const [prefix, authoredFragment = ''] = reference.split('#', 2)
    const fragment = decodeUriFragment(authoredFragment)
    const source = prefix ? resolveReferencePath(base, prefix) : base
    if (fragment && !fragment.startsWith('/')) {
      return anchors.get(`${source}#${fragment}`)
    }
    const resource = resources.get(source)
    if (resource === undefined) {
      return undefined
    }
    try {
      const pointer = fragment
      const target = resource + pointer
      if (pointerValue(document, pointerSegments(target)) !== undefined) {
        return target
      }
      // Bundled global chunks can retain pointers into the outer document.
      if (!prefix && pointerValue(document, pointerSegments(pointer)) !== undefined) {
        return pointer
      }
      return undefined
    } catch {
      return undefined
    }
  }

  const dereference = (value: unknown, path: string, seen = new Set<string>()): unknown => {
    if (!isDocument(value) || typeof value.$ref !== 'string') {
      return value
    }
    const target = resolve(value.$ref, path)
    if (target === undefined || seen.has(target)) {
      return value
    }
    expose(target, entries.get(path)?.context ?? 'object')
    const resolved = dereference(entries.get(target)?.value, target, new Set(seen).add(target))
    return isDocument(resolved)
      ? {
          ...resolved,
          ...Object.fromEntries(Object.entries(value).filter(([key]) => key !== '$ref')),
        }
      : resolved
  }
  return { entries, resolve, dereference, expose }
}

/**
 * Check an in-memory OpenAPI 2.0/3.x or AsyncAPI 2/3 graph, optionally removing unreachable reusable content.
 * Mutates the document only after successful checking. No files or URLs are fetched.
 * Unresolved external edges can retain all reusable content with warnings; missing local targets always fail.
 */
export const checkDocument = (
  document: Record<string, unknown>,
  {
    origin,
    prune = false,
    unresolvedReferences = 'error',
  }: {
    origin: string
    prune?: boolean
    /** Retain all reusable content when an unresolved external edge makes reachability uncertain. */
    unresolvedReferences?: 'error' | 'retain'
  },
): Result<{ document: Record<string, unknown>; warnings: string[] }> => {
  const graph = createGraph(document, origin)
  const async = typeof document.asyncapi === 'string'
  const async3 = async && String(document.asyncapi).startsWith('3.')
  const swagger = document.swagger === '2.0'
  const errors = new Set<string>()
  const warnings = new Set<string>()
  const live = new Set<string>()
  const visited = new Set<string>()
  const candidates = new Set<string>()
  const operationIds = new Map<string, Set<string>>()
  const operationLinks: { id: string; path: string }[] = []

  for (const entry of graph.entries.values()) {
    const segments = pointerSegments(entry.path)
    if (
      (segments.length === 3 && segments[0] === 'components' && !String(segments[1]).startsWith('x-')) ||
      (segments.length === 2 &&
        ['definitions', 'parameters', 'responses', 'securityDefinitions', 'x-ext'].includes(segments[0] ?? '')) ||
      (async3 && segments.length === 2 && segments[0] === 'channels')
    ) {
      candidates.add(entry.path)
    }
  }

  const mark = (path: string): void => {
    live.add(path)
    if (path) {
      mark(path.slice(0, path.lastIndexOf('/')))
    }
  }
  const follow = (reference: string, from: string, context?: ReferenceContext): void => {
    const target = graph.resolve(reference, from)
    if (target === undefined) {
      const message = `${from || '/'}: Reference target does not exist: ${reference}`
      if (unresolvedReferences === 'retain' && !reference.startsWith('#')) {
        warnings.add(message)
      } else {
        errors.add(message)
      }
    } else {
      if (context) {
        graph.expose(target, context)
      }
      visit(target, context)
      // Arrays retain their indices, so all retained elements need their dependencies.
      const segments = pointerSegments(target)
      for (const index of segments.keys()) {
        const parentPath = segments.slice(0, index).reduce(childPath, '')
        if (Array.isArray(pointerValue(document, segments.slice(0, index)))) {
          visit(parentPath, context)
        }
      }
      // Root components are retained whole, so their other children must remain valid too.
      for (const candidate of candidates) {
        if (!candidate.startsWith('/x-ext/') && target.startsWith(`${candidate}/`)) {
          visit(candidate)
        }
      }
    }
  }
  const namedReference = (name: string, path: string, container: string): string => {
    const segments = pointerSegments(path)
    const root = segments[0] === 'x-ext' ? childPath('/x-ext', segments[1] ?? '') : ''
    const local = `${root}${container}/${escapeJsonPointer(name)}`
    return pointerValue(document, pointerSegments(local)) !== undefined
      ? `#${local}`
      : `#${container}/${escapeJsonPointer(name)}`
  }
  const security = (value: unknown, path: string): void => {
    if (async3 || !Array.isArray(value)) {
      return
    }
    for (const requirement of value) {
      if (!isDocument(requirement)) {
        continue
      }
      for (const name of Object.keys(requirement)) {
        follow(namedReference(name, path, swagger ? '/securityDefinitions' : '/components/securitySchemes'), path)
      }
    }
  }
  const visit = (path: string, override?: ReferenceContext): void => {
    if (override) {
      graph.expose(path, override)
    }
    const entry = graph.entries.get(path)
    if (!entry) {
      return
    }
    const context =
      isSchemaContext(entry.context) && isSchemaContext(override) ? entry.context : (override ?? entry.context)
    mark(path)
    const visitKey = `${context}:${path}`
    if (visited.has(visitKey)) {
      return
    }
    visited.add(visitKey)
    const value = entry.value
    if (value === null || typeof value !== 'object' || context === 'data') {
      return
    }
    if (isDocument(value) && isReferenceContext(context)) {
      if (typeof value.$ref === 'string') {
        follow(value.$ref, path, context)
        if (
          isSchemaContext(context) &&
          (!modernSchemaDocument(document) || !getSchemaVocabulary(context)?.referenceSiblings)
        ) {
          return
        }
      }
      if (isSchemaContext(context) && typeof value.$dynamicRef === 'string') {
        follow(value.$dynamicRef, path, 'schema')
        const target = graph.resolve(value.$dynamicRef, path)
        const targetValue = target === undefined ? undefined : graph.entries.get(target)?.value
        if (isDocument(targetValue) && typeof targetValue.$dynamicAnchor === 'string') {
          // Dynamic scope can select another resource's matching anchor; retain every possible target.
          for (const candidate of graph.entries.values()) {
            if (
              isSchemaContext(candidate.context) &&
              isDocument(candidate.value) &&
              candidate.value.$dynamicAnchor === targetValue.$dynamicAnchor
            ) {
              visit(candidate.path, 'schema')
            }
          }
        }
      }
      if (isSchemaContext(context) && '$recursiveRef' in value) {
        errors.add(`${path}: $recursiveRef is not supported; use a supported $ref or $dynamicRef before transforming.`)
      }
      if (isSchemaContext(context) && isDocument(value.discriminator)) {
        for (const target of [
          ...Object.values(isDocument(value.discriminator.mapping) ? value.discriminator.mapping : {}),
          ...(String(document.openapi).startsWith('3.2.') && typeof value.discriminator.defaultMapping === 'string'
            ? [value.discriminator.defaultMapping]
            : []),
        ]) {
          if (typeof target === 'string') {
            follow(
              target.includes('/') ||
                target.includes('#') ||
                target.includes(':') ||
                (target.includes('.') &&
                  graph.resolve(namedReference(target, path, '/components/schemas'), path) === undefined)
                ? target
                : namedReference(target, path, '/components/schemas'),
              path,
              'schema',
            )
          }
        }
      }
      if (context === 'link') {
        if (typeof value.operationRef === 'string') {
          follow(value.operationRef, path, 'object')
        }
        if (typeof value.operationId === 'string') {
          operationLinks.push({ id: value.operationId, path })
        }
      }
      if (context === 'object' || context === 'path-item') {
        security(value.security, path)
      }
      if (async && Array.isArray(value.servers)) {
        for (const server of value.servers) {
          if (typeof server === 'string') {
            follow(`#/servers/${escapeJsonPointer(server)}`, path)
          }
        }
      }
    }
    for (const [key, child] of Object.entries(value)) {
      const nextPath = childPath(path, key)
      if (prune && candidates.has(nextPath)) {
        continue
      }
      // Reusable maps are storage, not roots. Their entries are reached through references.
      if (
        prune &&
        path === '' &&
        (['components', 'x-ext', 'definitions', 'parameters', 'responses', 'securityDefinitions'].includes(key) ||
          (async3 && key === 'channels'))
      ) {
        continue
      }
      if (path === '' && key === 'x-ext' && isDocument(child)) {
        for (const name of Object.keys(child)) {
          visit(childPath(nextPath, name))
        }
        continue
      }
      const childContext = traversalContext(value, context, key, document)
      if (child !== undefined) {
        visit(nextPath, childContext)
      }
    }
  }
  visit('')
  // Referenced fragments acquire their operation context while the graph is visited.
  for (const entry of graph.entries.values()) {
    const segments = pointerSegments(entry.path)
    const parent = graph.entries.get(entry.path.slice(0, entry.path.lastIndexOf('/')))
    if (
      isDocument(entry.value) &&
      typeof entry.value.operationId === 'string' &&
      ((parent?.context === 'path-item' && operationMethods.includes(segments.at(-1) ?? '')) ||
        (segments.at(-2) === 'additionalOperations' &&
          graph.entries.get(entry.path.slice(0, entry.path.lastIndexOf('/additionalOperations/')))?.context ===
            'path-item') ||
        (async && ['publish', 'subscribe'].includes(segments.at(-1) ?? '')) ||
        (async3 && segments[0] === 'operations' && segments.length === 2))
    ) {
      const paths = operationIds.get(entry.value.operationId) ?? new Set<string>()
      paths.add(entry.path)
      operationIds.set(entry.value.operationId, paths)
    }
  }
  for (const link of operationLinks) {
    const targets = operationIds.get(link.id)
    if (!targets || (prune && ![...targets].some((target) => live.has(target)))) {
      errors.add(`${link.path}: Operation does not exist: ${link.id}`)
    }
  }
  if (errors.size) {
    return err([...errors].join('\n'))
  }
  if (prune && warnings.size === 0) {
    for (const path of [...candidates].sort((a, b) => b.length - a.length)) {
      if (live.has(path)) {
        continue
      }
      const segments = pointerSegments(path)
      const parent = pointerValue(document, segments.slice(0, -1))
      if (isDocument(parent)) {
        delete parent[segments.at(-1) ?? '']
      }
    }
    const sweepExternal = (value: unknown, path: string): void => {
      if (!isDocument(value) || graph.entries.get(path)?.context === 'data') {
        return
      }
      for (const [key, child] of Object.entries(value)) {
        const location = childPath(path, key)
        // An ancestor's schema identity still defines the base of a retained descendant.
        if (['$id', '$anchor', '$dynamicAnchor', '$schema', '$global'].includes(key)) {
          continue
        }
        if (!live.has(location)) {
          delete value[key]
        } else {
          sweepExternal(child, location)
        }
      }
    }
    if (isDocument(document['x-ext'])) {
      for (const [key, value] of Object.entries(document['x-ext'])) {
        sweepExternal(value, childPath('/x-ext', key))
      }
    }
  }
  return ok({
    document,
    warnings: warnings.size
      ? [
          'Skipping unused-component removal because preserved external references make reachability uncertain.',
          ...warnings,
        ]
      : [],
  })
}
