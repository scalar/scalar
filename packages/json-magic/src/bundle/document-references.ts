import { isObject } from '@scalar/helpers/object/is-object'

import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getId } from '@/helpers/get-schemas'
import { getSegmentsFromPath } from '@/helpers/get-segments-from-path'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { resolveReferencePath } from '@/helpers/resolve-reference-path'

/** Format-specific document identity, supplied by the caller. */
export type DocumentIdentity = {
  /** Declared base URI, resolved relative to the retrieval URI when necessary. */
  baseUri: string
  /** Root properties retained on copies embedded in the bundle; never applied to the source document. */
  metadata?: Record<string, unknown>
}

/** Reads document identity without imposing a document format on the bundler. */
export type DocumentResolver = (document: unknown, retrievalUri: string) => DocumentIdentity | undefined

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
  identity: (document: unknown) => DocumentIdentity | undefined
  register: (document: unknown, retrievalUri: string, path?: string[]) => void
  isSchemaResource: (uri: string) => boolean
  origin: (node: object) => string | undefined
  resolve: (
    ref: string,
    base: string,
  ) =>
    | { path: string; value: unknown; preserveReference: boolean; document: unknown; documentPath: string[] }
    | undefined
}

/**
 * Indexes complete documents before following their references. A declared identity
 * can point to content already in memory even when that URI cannot be fetched.
 */
export const documentReferences = (
  externalDocumentsKey: string,
  resolveDocument?: DocumentResolver,
): DocumentReferences => {
  const identities = new Map<unknown, DocumentIdentity>()
  const resources = new Map<string, Resource>()
  const origins = new WeakMap<object, string>()
  const bundledResources = new Map<string, Resource>()

  const register = (document: unknown, retrievalUri: string, path: string[] = []): void => {
    const identity = resolveDocument?.(document, retrievalUri)
    const base = identity === undefined ? retrievalUri : resolveReferencePath(retrievalUri, identity.baseUri)
    if (identity !== undefined) {
      identities.set(document, { ...identity, baseUri: base })
    }
    const resource = { value: document, path, schema: false, embedded: path.length > 0, document, documentPath: path }
    // Retrieval aliases retain compatibility with callers that supply local copies.
    resources.set(retrievalUri, resource)
    resources.set(base, resource)
    if (path.length > 1) {
      bundledResources.set(path[1], resource)
    }
    // Shared nodes use the first traversal path and base, including for $id and $anchor
    // registration. This also prevents cycles from being indexed repeatedly.
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
      const anchor = isObject(value) && typeof value.$anchor === 'string' ? value.$anchor : undefined
      if (id !== undefined || anchor !== undefined) {
        const schemaResource = {
          value,
          path: location,
          schema: true,
          identifier,
          embedded: path.length > 0,
          document,
          documentPath: path,
        }
        if (id !== undefined) {
          resources.set(current, schemaResource)
        }
        if (anchor !== undefined) {
          resources.set(`${current}#${anchor}`, schemaResource)
        }
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
    identity: (document) => identities.get(document),
    register,
    isSchemaResource: (uri) => resources.get(uri)?.schema === true,
    origin: (node) => origins.get(node),
    resolve: (ref, base) => {
      const [prefix, fragment = ''] = ref.split('#', 2)
      const uri = prefix ? resolveReferencePath(base, prefix) : base
      const pointer = fragment.startsWith('/') ? getSegmentsFromPath(fragment) : []
      const bundled =
        (!prefix || resources.get(uri)?.path.length === 0) && pointer[0] === externalDocumentsKey
          ? bundledResources.get(pointer[1])
          : undefined
      const resource = bundled ?? resources.get(fragment && !fragment.startsWith('/') ? `${uri}#${fragment}` : uri)
      if (!resource) {
        return undefined
      }
      const segments = bundled ? pointer.slice(2) : pointer
      const location = [...resource.path, ...segments]
      const value = getValueByPath(resource.value, segments).value
      // Missing targets must stay unresolved instead of becoming pointers to absent values.
      const isUnresolved = value === undefined
      // Fragment-only schema references are relative to their own resource, even when embedded.
      const isLocalSchemaReference = resource.schema && !prefix
      // An absolute identifier declared in the root document remains usable by downstream consumers.
      const isAbsoluteRootSchemaReference =
        !resource.embedded && resource.schema && prefix === uri && resource.identifier === uri
      // Fragment-only document references already address the root without relocation.
      const isLocalRootDocumentReference = !resource.embedded && !resource.schema && !prefix

      return {
        path: location.map(escapeJsonPointer).join('/'),
        value,
        document: resource.document,
        documentPath: resource.documentPath,
        preserveReference:
          isUnresolved || isLocalSchemaReference || isAbsoluteRootSchemaReference || isLocalRootDocumentReference,
      }
    },
  }
}
