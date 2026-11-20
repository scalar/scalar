import { isObject } from '@scalar/helpers/object/is-object'

import { decodeUriFragment } from '@/helpers/decode-uri-fragment'
import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { resolveResourcePath } from '@/helpers/resolve-resource-path'
import { toResourceUri } from '@/helpers/to-resource-uri'
import { getRaw } from '@/magic-proxy/proxy'
import type { UnknownObject } from '@/types'

import { type ReferenceContext, getSchemaVocabulary } from '../document/reference-context'
import type { SchemaResourceLocation } from './document-references'
import type { documentTraversal } from './document-traversal'

type Resource = SchemaResourceLocation & { node: UnknownObject; sourceUri: string }

/** A resolved target before its reference is rewritten for output. */
export type RelocationTarget = { path: string[]; context: ReferenceContext }

/** Authored nonpreserved edges keep their source base when resolution fails. */
export type SourceReference = { reference: string; origin: string; path: readonly string[] }

type RelocationOptions = {
  targets: WeakMap<object, RelocationTarget>
  schemas: SchemaResourceLocation[]
  externalDocumentsKey: string
  createTraversal: () => ReturnType<typeof documentTraversal>
  documents: { path: string[]; context: ReferenceContext }[]
  sourceReferences: Map<object, SourceReference>
  outputBase?: string
}

/** Keep resolved edges addressable from their schema resource after serialization. */
export const relocateReferences = (
  root: object,
  {
    targets,
    schemas,
    externalDocumentsKey,
    createTraversal,
    documents,
    sourceReferences,
    outputBase,
  }: RelocationOptions,
): void => {
  const identityKey = (value: string): string => {
    const [uri = '', fragment] = value.split('#', 2)
    let base = uri
    try {
      base = new URL(uri).href
    } catch {
      // Relative references have no canonical identity without their source base.
    }
    base = base.replace(/%([\da-f]{2})/gi, (encoded, hex: string) => {
      const character = String.fromCharCode(Number.parseInt(hex, 16))
      return /^[a-z\d._~-]$/i.test(character) ? character : encoded.toUpperCase()
    })
    return `${base}${fragment === undefined ? '' : `#${decodeUriFragment(fragment)}`}`
  }
  const resources: Resource[] = []
  const identities = new WeakMap<object, string>()
  const outputIdentities = new Map<string, Resource>()
  for (const { path, uri: sourceUri, outputUri, idKeyword } of schemas) {
    const node = getValueByPath(root, path).value
    if (!isObject(node)) {
      continue
    }
    const uri = outputUri ?? sourceUri
    const resource = { node, path, uri, outputUri, idKeyword, sourceUri }
    const previous = outputIdentities.get(identityKey(uri))
    if (
      previous &&
      getRaw(previous.node) !== getRaw(node) &&
      (uri !== sourceUri || previous.uri !== previous.sourceUri)
    ) {
      throw new TypeError(`Schema output identity collision: ${uri}`)
    }
    outputIdentities.set(identityKey(uri), resource)
    node[idKeyword] = uri
    resources.push(resource)
    identities.set(getRaw(node), uri)
  }
  resources.sort((a, b) => b.path.length - a.path.length)

  const contains = (parent: string[], child: string[]): boolean =>
    parent.length <= child.length && parent.every((segment, index) => segment === child[index])
  const pointer = (path: string[]): string =>
    path.length ? `#/${path.map((key) => encodeURIComponent(escapeJsonPointer(key))).join('/')}` : '#'
  documents.sort((a, b) => b.path.length - a.path.length)
  const resourceAt = (path: string[]): Resource | undefined => {
    const resource = resources.find((resource) => contains(resource.path, path))
    const document = documents.find((document) => contains(document.path, path))
    return document && resource && document.path.length > resource.path.length ? undefined : resource
  }
  const absoluteReference = ({ reference, origin }: SourceReference): string =>
    resolveResourcePath(toResourceUri(origin), reference)

  // Anonymous imported documents lose their retrieval scope when embedded. Their
  // resolved edges use pointers, so retaining those anchors would bind another URI.
  for (const document of documents) {
    if (!document.path.length) {
      continue
    }
    const node = getValueByPath(root, document.path).value
    const traversal = createTraversal()
    traversal.register(node, '', document.context)
    const visited = new WeakSet<object>()
    const stripAnchors = (value: unknown): void => {
      if (value === null || typeof value !== 'object' || identities.has(getRaw(value)) || visited.has(getRaw(value))) {
        return
      }
      visited.add(getRaw(value))
      const context = traversal.location(value)?.context
      if (context === 'data') {
        return
      }
      if (isObject(value) && (getSchemaVocabulary(context ?? 'schema')?.anchors || context === 'generic')) {
        delete value.$anchor
        delete value.$dynamicAnchor
      }
      for (const key of Object.keys(getRaw(value))) {
        stripAnchors(Reflect.get(value, key))
      }
    }
    stripAnchors(node)
  }
  for (const [node, reference] of sourceReferences) {
    if (!isObject(node)) {
      continue
    }
    const target = targets.get(node)
    if (target) {
      const destination = resourceAt(target.path)
      if (destination?.uri.includes('#') && target.path.length === destination.path.length) {
        node.$ref = destination.uri
      } else if (
        destination?.outputUri &&
        destination.uri !== destination.sourceUri &&
        !resourceAt([...reference.path])
      ) {
        const fragment = pointer(target.path.slice(destination.path.length))
        node.$ref = `${destination.uri}${fragment === '#' ? '' : fragment}`
      }
      continue
    }
    const document = documents.find((document) => contains(document.path, [...reference.path]))
    const owner = resourceAt([...reference.path])
    if ((!owner && (document?.path.length || outputBase !== undefined)) || (owner && owner.uri !== owner.sourceUri)) {
      node.$ref = absoluteReference(reference)
    }
  }

  const reservedUris = new Set(
    schemas.flatMap(({ uri, outputUri }) => [identityKey(uri), identityKey(outputUri ?? uri)]),
  )
  const scanned = new WeakSet<object>()
  const reserveReferences = (value: unknown): void => {
    if (value === null || typeof value !== 'object' || scanned.has(getRaw(value))) {
      return
    }
    scanned.add(getRaw(value))
    if (isObject(value) && typeof value.$ref === 'string') {
      reservedUris.add(identityKey(value.$ref))
    }
    for (const key of Object.keys(getRaw(value))) {
      reserveReferences(Reflect.get(value, key))
    }
  }
  reserveReferences(root)

  for (const owner of resources) {
    const fragmentIdentity = owner.uri.includes('#')
    const copies: { source: string[]; destination: string[]; uri?: string }[] = []
    const visited = new WeakSet<object>()
    const reference = ({ path: target, context }: RelocationTarget): string => {
      const destination = resourceAt(target)
      if (destination && (!destination.uri.includes('#') || target.length === destination.path.length)) {
        if (destination.uri.includes('#')) {
          return destination.uri
        }
        const fragment = pointer(target.slice(destination.path.length))
        return destination === owner ? fragment : `${destination.uri}${fragment === '#' ? '' : fragment}`
      }
      // Reserve the copy before walking it: anonymous dependency cycles share storage.
      const existing = copies.find(({ source }) =>
        fragmentIdentity ? source.length === target.length && contains(source, target) : contains(source, target),
      )
      if (existing) {
        return existing.uri ?? pointer([...existing.destination, ...target.slice(existing.source.length)])
      }
      const storageKey = fragmentIdentity ? 'definitions' : externalDocumentsKey
      const storage = Object.hasOwn(owner.node, storageKey) ? owner.node[storageKey] : undefined
      const documents: UnknownObject = isObject(storage) ? storage : {}
      if (storage !== documents) {
        Object.defineProperty(owner.node, storageKey, {
          value: documents,
          enumerable: true,
          configurable: true,
          writable: true,
        })
      }
      let index = copies.length
      while (Object.hasOwn(documents, `bundle-${index}`)) {
        index++
      }
      const key = `bundle-${index}`
      const location = [storageKey, key]
      let uri: string | undefined
      if (fragmentIdentity) {
        let alias = index
        do {
          uri = `${owner.uri.split('#', 1)[0]}#scalar-bundle-${alias++}`
        } while (reservedUris.has(identityKey(uri)))
        reservedUris.add(identityKey(uri))
      }
      copies.push({ source: target, destination: location, uri })
      const value = copy(getValueByPath(root, target).value, context)
      Object.defineProperty(documents, key, {
        // Legacy fragment IDs name subschemas, so pointers cannot use them as document roots.
        value: uri ? { [owner.idKeyword]: uri, allOf: [value] } : value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
      return uri ?? pointer(location)
    }
    const copy = (value: unknown, context: ReferenceContext): unknown => {
      // A reference exposing literal data as a schema does not change its other occurrences.
      const traversal = createTraversal()
      traversal.register(value, '', context)
      const clone = (node: unknown, literal = false): unknown => {
        if (node === null || typeof node !== 'object') {
          return node
        }
        const location = traversal.location(node)
        const data = literal || location?.context === 'data'
        const uri = data ? undefined : identities.get(getRaw(node))
        // Named resources already live in the bundle. Do not duplicate their identities.
        if (uri !== undefined) {
          return { $ref: uri }
        }
        if (Array.isArray(node)) {
          return node.map((child) => clone(child, data))
        }
        const result = Object.fromEntries(
          Object.keys(getRaw(node)).map((key) => [key, clone(Reflect.get(node, key), data)]),
        )
        const target = data ? undefined : targets.get(getRaw(node))
        if (target) {
          result.$ref = reference(target)
        } else if (!data && sourceReferences.has(getRaw(node))) {
          result.$ref = absoluteReference(sourceReferences.get(getRaw(node))!)
        }
        // Copied anonymous anchors would otherwise acquire the owner's URI and collide.
        // Resolved edges to these values use pointers; authored external edges stay external.
        if (!data && (getSchemaVocabulary(location?.context ?? 'schema')?.anchors || location?.context === 'generic')) {
          delete result.$anchor
          delete result.$dynamicAnchor
        }
        return result
      }
      return clone(value)
    }
    const visit = (value: unknown): void => {
      if (value === null || typeof value !== 'object' || visited.has(getRaw(value))) {
        return
      }
      visited.add(getRaw(value))
      if (getRaw(value) !== getRaw(owner.node) && identities.has(getRaw(value))) {
        return
      }
      const target = targets.get(getRaw(value))
      if (target && isObject(value)) {
        value.$ref = reference(target)
      }
      for (const key of Object.keys(getRaw(value))) {
        visit(Reflect.get(value, key))
      }
    }
    visit(owner.node)
  }
}
