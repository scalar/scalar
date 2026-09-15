import { isObject } from '@scalar/helpers/object/is-object'

import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getId } from '@/helpers/get-schemas'
import { getSegmentsFromPath } from '@/helpers/get-segments-from-path'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { resolveReferencePath } from '@/helpers/resolve-reference-path'

/** A loaded resource and its location in the output document. */
type Resource = {
  value: unknown
  path: string[]
  schema: boolean
  identifier?: string
  embedded: boolean
  document: unknown
  documentPath: string[]
}

/** Resolution metadata survives moving documents into the bundle. */
type DocumentReferences = {
  register: (document: unknown, retrievalUri: string, path?: string[]) => void
  origin: (node: object) => string | undefined
  resolve: (
    ref: string,
    base: string,
  ) => { path: string; value: unknown; preserve: boolean; document: unknown; documentPath: string[] } | undefined
}

/**
 * Indexes complete documents before following their references. A declared identity
 * can point to content already in memory even when that URI cannot be fetched.
 */
export const documentReferences = (externalDocumentsKey: string): DocumentReferences => {
  const resources = new Map<string, Resource>()
  const origins = new WeakMap<object, string>()
  const bundledResources = new Map<string, Resource>()

  const register = (document: unknown, retrievalUri: string, path: string[] = []): void => {
    const self =
      isObject(document) && typeof document.openapi === 'string' && typeof document.$self === 'string'
        ? document.$self
        : undefined
    const base = self === undefined ? retrievalUri : resolveReferencePath(retrievalUri, self)
    const resource = { value: document, path, schema: false, embedded: path.length > 0, document, documentPath: path }
    // Retrieval aliases retain compatibility with callers that supply local copies.
    resources.set(retrievalUri, resource)
    resources.set(base, resource)
    if (path.length > 0) {
      bundledResources.set(path[1], resource)
    }
    const visited = new WeakSet<object>()

    const visit = (value: unknown, origin: string, location: string[], inheritedIdentifier = ''): void => {
      if (value === null || typeof value !== 'object' || visited.has(value)) {
        return
      }
      visited.add(value)
      const id = getId(value)
      const identifier = id ?? inheritedIdentifier
      const current = id === undefined ? origin : resolveReferencePath(origin, id)
      origins.set(value, current)
      if (id !== undefined) {
        resources.set(current, {
          value,
          path: location,
          schema: true,
          identifier,
          embedded: path.length > 0,
          document,
          documentPath: path,
        })
      }
      if (isObject(value) && typeof value.$anchor === 'string') {
        resources.set(`${current}#${value.$anchor}`, {
          value,
          path: location,
          schema: true,
          identifier,
          embedded: path.length > 0,
          document,
          documentPath: path,
        })
      }
      for (const [key, child] of Object.entries(value)) {
        if (key !== externalDocumentsKey) {
          visit(child, current, [...location, key], identifier)
        }
      }
    }
    visit(document, base, path)
  }

  return {
    register,
    origin: (node) => origins.get(node),
    resolve: (ref, base) => {
      const [prefix, fragment = ''] = ref.split('#', 2)
      const uri = prefix ? resolveReferencePath(base, prefix) : base
      const pointer = fragment.startsWith('/') ? getSegmentsFromPath(fragment) : []
      const bundled = !prefix && pointer[0] === externalDocumentsKey ? bundledResources.get(pointer[1]) : undefined
      const resource = bundled ?? resources.get(fragment && !fragment.startsWith('/') ? `${uri}#${fragment}` : uri)
      if (!resource) {
        return undefined
      }
      const segments = bundled ? pointer.slice(2) : pointer
      const location = [...resource.path, ...segments]
      const value = getValueByPath(resource.value, segments).value
      return {
        path: location.map(escapeJsonPointer).join('/'),
        value,
        document: resource.document,
        documentPath: resource.documentPath,
        // Existing absolute schema identifiers remain usable by downstream consumers.
        preserve:
          value === undefined ||
          (!resource.embedded &&
            resource.schema &&
            ((prefix === uri && resource.identifier === uri) || (!prefix && !fragment.startsWith('/')))) ||
          (!resource.embedded && !resource.schema && !prefix),
      }
    },
  }
}
