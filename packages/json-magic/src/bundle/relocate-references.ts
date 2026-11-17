import { isObject } from '@scalar/helpers/object/is-object'

import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { resolveReferencePath } from '@/helpers/resolve-reference-path'
import { toResourceUri } from '@/helpers/to-resource-uri'
import type { UnknownObject } from '@/types'

import type { documentTraversal } from './document-traversal'
import { type ReferenceContext, getSchemaVocabulary } from './reference-context'

type Resource = { node: UnknownObject; path: string[]; uri: string }

/** A resolved target before its reference is rewritten for output. */
export type RelocationTarget = { path: string[]; context: ReferenceContext }

/** Authored nonpreserved edges keep their source base when resolution fails. */
export type SourceReference = { reference: string; origin: string; path: readonly string[] }

type RelocationOptions = {
  targets: WeakMap<object, RelocationTarget>
  schemas: { path: string[]; uri: string }[]
  externalDocumentsKey: string
  createTraversal: () => ReturnType<typeof documentTraversal>
  documents: { path: string[]; context: ReferenceContext }[]
  sourceReferences: Map<object, SourceReference>
}

/** Keep resolved edges addressable from their schema resource after serialization. */
export const relocateReferences = (
  root: object,
  { targets, schemas, externalDocumentsKey, createTraversal, documents, sourceReferences }: RelocationOptions,
): void => {
  const resources: Resource[] = []
  const identities = new WeakMap<object, string>()
  for (const { path, uri } of schemas) {
    const node = getValueByPath(root, path).value
    if (!isObject(node)) {
      continue
    }
    resources.push({ node, path, uri })
    identities.set(node, uri)
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
  const absoluteReference = ({ reference, origin }: SourceReference): string => {
    const [prefix, fragment] = reference.split('#', 2)
    return `${toResourceUri(prefix ? resolveReferencePath(origin, prefix) : origin)}${fragment === undefined ? '' : `#${fragment}`}`
  }

  // Anonymous imported documents lose their retrieval scope when embedded. Their
  // resolved edges use pointers, so retaining those anchors would bind another URI.
  for (const document of documents) {
    if (!document.path.length) {
      continue
    }
    const node = getValueByPath(root, document.path).value
    const traversal = createTraversal()
    traversal.register(node, '', document.context)
    const stripAnchors = (value: unknown): void => {
      if (value === null || typeof value !== 'object' || identities.has(value)) {
        return
      }
      const context = traversal.location(value)?.context
      if (context === 'data') {
        return
      }
      if (isObject(value) && (getSchemaVocabulary(context ?? 'schema')?.anchors || context === 'generic')) {
        delete value.$anchor
      }
      for (const child of Object.values(value)) {
        stripAnchors(child)
      }
    }
    stripAnchors(node)
  }
  for (const [node, reference] of sourceReferences) {
    if (targets.has(node) || !isObject(node)) {
      continue
    }
    const document = documents.find((document) => contains(document.path, [...reference.path]))
    if (document?.path.length && !resourceAt([...reference.path])) {
      node.$ref = absoluteReference(reference)
    }
  }

  for (const owner of resources) {
    const copies: { source: string[]; destination: string[] }[] = []
    const visited = new WeakSet<object>()
    const reference = ({ path: target, context }: RelocationTarget): string => {
      const destination = resourceAt(target)
      if (destination) {
        const fragment = pointer(target.slice(destination.path.length))
        return destination === owner ? fragment : `${destination.uri}${fragment === '#' ? '' : fragment}`
      }
      // Reserve the copy before walking it: anonymous dependency cycles share storage.
      const existing = copies.find(({ source }) => contains(source, target))
      if (existing) {
        return pointer([...existing.destination, ...target.slice(existing.source.length)])
      }
      const storage = Object.hasOwn(owner.node, externalDocumentsKey) ? owner.node[externalDocumentsKey] : undefined
      const documents: UnknownObject = isObject(storage) ? storage : {}
      if (storage !== documents) {
        Object.defineProperty(owner.node, externalDocumentsKey, {
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
      const location = [externalDocumentsKey, key]
      copies.push({ source: target, destination: location })
      Object.defineProperty(documents, key, {
        value: copy(getValueByPath(root, target).value, context),
        enumerable: true,
        configurable: true,
        writable: true,
      })
      return pointer(location)
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
        const uri = data ? undefined : identities.get(node)
        // Named resources already live in the bundle. Do not duplicate their identities.
        if (uri !== undefined) {
          return { $ref: uri }
        }
        if (Array.isArray(node)) {
          return node.map((child) => clone(child, data))
        }
        const result = Object.fromEntries(Object.entries(node).map(([key, child]) => [key, clone(child, data)]))
        const target = data ? undefined : targets.get(node)
        if (target) {
          result.$ref = reference(target)
        } else if (!data && sourceReferences.has(node)) {
          result.$ref = absoluteReference(sourceReferences.get(node)!)
        }
        // Copied anonymous anchors would otherwise acquire the owner's URI and collide.
        // Resolved edges to these values use pointers; authored external edges stay external.
        if (!data && (getSchemaVocabulary(location?.context ?? 'schema')?.anchors || location?.context === 'generic')) {
          delete result.$anchor
        }
        return result
      }
      return clone(value)
    }
    const visit = (value: unknown): void => {
      if (value === null || typeof value !== 'object' || visited.has(value)) {
        return
      }
      visited.add(value)
      if (value !== owner.node && identities.has(value)) {
        return
      }
      const target = targets.get(value)
      if (target && isObject(value)) {
        value.$ref = reference(target)
      }
      for (const child of Object.values(value)) {
        visit(child)
      }
    }
    visit(owner.node)
  }
}
