import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObject } from '@scalar/helpers/object/is-object'

import { decodeUriFragment } from '@/helpers/decode-uri-fragment'
import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getId } from '@/helpers/get-schemas'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { resolveReferencePath } from '@/helpers/resolve-reference-path'

/** Format-specific document identity, supplied by the caller. */
export type DocumentIdentity = {
  /** Declared base URI, resolved relative to the retrieval URI when necessary. */
  baseUri: string
  /** Translate an authored document pointer when a loader moved its target before registration. */
  remapPointer?: (segments: readonly string[]) => readonly string[]
  /** Visit only referenced subtrees when the rest of the file has no known object context. */
  visitReferencedSubtrees?: boolean
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
export type DocumentReferences = {
  identity: (document: unknown) => DocumentIdentity | undefined
  register: (document: unknown, retrievalUri: string, path?: string[], retrievalBase?: string) => void
  refresh: (document: unknown, targetPath: string[]) => void
  isSchemaResource: (uri: string) => boolean
  origin: (node: object) => string | undefined
  /** Fetchable base, without the private namespace used to isolate stored schemas. */
  retrievalOrigin: (node: object) => string | undefined
  resolve: (
    ref: string,
    base: string,
    rootFallback?: boolean,
  ) =>
    | {
        path: string
        segments: string[]
        resourceRelative: boolean
        value: unknown
        preserveReference: boolean
        document: unknown
        documentPath: string[]
      }
    | undefined
}

/** Give unmapped bundle entries separate bases so relative schema identifiers cannot collide. */
export const bundledDocumentUri = (origin: string, key: string, source?: string): string =>
  resolveReferencePath(origin, source ?? `./__bundle_${encodeURIComponent(key)}/document`)

/**
 * Indexes complete documents before following their references. A declared identity
 * can point to content already in memory even when that URI cannot be fetched.
 */
export const documentReferences = (
  externalDocumentsKey: string,
  resolveDocument?: DocumentResolver,
  canonicalizeIds = false,
  shouldVisit: (node: object) => boolean = () => true,
  hasSchemaIdentity: (node: object) => boolean = () => true,
): DocumentReferences => {
  const identities = new Map<unknown, DocumentIdentity>()
  const resources = new Map<string, Resource>()
  const origins = new WeakMap<object, string>()
  const retrievalOrigins = new WeakMap<object, string>()
  const bundledResources = new Map<string, Resource>()

  let rootUri: string | undefined

  const registrations = new Map<unknown, { base: string; path: string[]; retrievalBase: string }>()

  const register = (
    document: unknown,
    retrievalUri: string,
    path: string[] = [],
    retrievalBase = retrievalUri,
  ): void => {
    if (path.length === 0) {
      rootUri = retrievalUri
    }
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
    const retrievalOrigin = identity ? resolveReferencePath(retrievalBase, identity.baseUri) : retrievalBase
    registrations.set(document, { base, path, retrievalBase: retrievalOrigin })
    index(document, base, path, [], retrievalOrigin)
  }

  // Refresh newly exposed fragments without replaying the document identity hook.
  const index = (
    document: unknown,
    base: string,
    path: string[],
    targetPath: string[] = [],
    retrievalBase = base,
  ): void => {
    // Shared nodes use the first traversal path and base, including for $id and $anchor
    // registration. This also prevents cycles from being indexed repeatedly.
    const visited = new WeakSet<object>()

    const visit = (
      value: unknown,
      origin: string,
      location: string[],
      inheritedIdentifier = '',
      retrievalOrigin = retrievalBase,
    ): void => {
      if (value === null || typeof value !== 'object' || visited.has(value) || !shouldVisit(value)) {
        return
      }
      visited.add(value)
      const id = hasSchemaIdentity(value) ? getId(value) : undefined
      const identifier = id ?? inheritedIdentifier
      const current = id === undefined ? origin : resolveReferencePath(origin, id)
      // A refresh can encounter an identifier that this index already canonicalized.
      const currentRetrieval =
        canonicalizeIds && id === origins.get(value) && retrievalOrigins.has(value)
          ? retrievalOrigins.get(value)!
          : id === undefined
            ? retrievalOrigin
            : resolveReferencePath(retrievalOrigin, id)
      origins.set(value, current)
      retrievalOrigins.set(value, currentRetrieval)
      // Relative identifiers would acquire a different identity after serialization elsewhere.
      // Use the indexed base before mutation so nested identifiers are resolved exactly once.
      if (canonicalizeIds && id !== undefined && isObject(value)) {
        value.$id = current
      }
      const anchor =
        hasSchemaIdentity(value) && isObject(value) && typeof value.$anchor === 'string' ? value.$anchor : undefined
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
          visit(child, current, [...location, key], identifier, currentRetrieval)
        }
      }
    }
    let target = document
    let origin = base
    let identifier = ''
    let retrievalOrigin = retrievalBase
    for (const key of targetPath) {
      if (target === null || typeof target !== 'object') return
      origin = origins.get(target) ?? origin
      retrievalOrigin = retrievalOrigins.get(target) ?? retrievalOrigin
      identifier = (hasSchemaIdentity(target) ? getId(target) : undefined) ?? identifier
      target = (target as Record<string, unknown>)[key]
    }
    visit(target, origin, [...path, ...targetPath], identifier, retrievalOrigin)
  }

  return {
    identity: (document) => identities.get(document),
    register,
    refresh: (document, targetPath) => {
      const registration = registrations.get(document)
      if (registration) index(document, registration.base, registration.path, targetPath, registration.retrievalBase)
    },
    isSchemaResource: (uri) => resources.get(uri)?.schema === true,
    origin: (node) => origins.get(node),
    retrievalOrigin: (node) => retrievalOrigins.get(node),
    resolve: (ref, base, rootFallback = false) => {
      const [prefix, authoredFragment = ''] = ref.split('#', 2)
      const fragment = decodeUriFragment(authoredFragment)
      const uri = prefix ? resolveReferencePath(base, prefix) : base
      const pointer = fragment.startsWith('/') ? fragment.slice(1).split('/').map(unescapeJsonPointerSegment) : []
      const documentResource = resources.get(uri)
      const localStorage = isObject(documentResource?.value) ? documentResource.value[externalDocumentsKey] : undefined
      const ownsBundledKey =
        documentResource?.schema && isObject(localStorage) && Object.hasOwn(localStorage, pointer[1] ?? '')
      const bundled =
        !ownsBundledKey && (!prefix || documentResource?.path.length === 0) && pointer[0] === externalDocumentsKey
          ? bundledResources.get(pointer[1])
          : undefined
      const declaredOrigin =
        documentResource?.value !== null && typeof documentResource?.value === 'object'
          ? origins.get(documentResource.value)
          : undefined
      let resource =
        bundled ??
        (fragment && !fragment.startsWith('/')
          ? (resources.get(`${uri}#${fragment}`) ??
            (declaredOrigin ? resources.get(`${declaredOrigin}#${fragment}`) : undefined))
          : documentResource)
      if (!resource) {
        return undefined
      }
      // Bundle-local pointers already address the upgraded document's layout.
      let segments: readonly string[] = pointer
      if (bundled) {
        segments = pointer.slice(2)
      } else if (!resource.schema) {
        segments = identities.get(resource.document)?.remapPointer?.(pointer) ?? pointer
      }
      // Relocated documents can retain explicit pointers to their enclosing bundle.
      const rootResource = rootUri === undefined ? undefined : resources.get(rootUri)
      if (
        rootFallback &&
        !prefix &&
        fragment.startsWith('/') &&
        !bundled &&
        rootResource &&
        getValueByPath(resource.value, segments).value === undefined &&
        getValueByPath(rootResource.value, pointer).value !== undefined
      ) {
        resource = rootResource
        segments = pointer
      }
      const location = [...resource.path, ...segments]
      const value = getValueByPath(resource.value, segments).value
      // Missing targets must stay unresolved instead of becoming pointers to absent values.
      const isUnresolved = value === undefined
      // Fragment-only schema references are relative to their own resource, even when embedded.
      const isLocalSchemaReference = resource.schema && !prefix
      // References matching an authored root schema identifier remain usable by downstream consumers.
      // Preserve relative identifiers too: rewriting them changes schema names shown by renderers.
      const isDeclaredRootSchemaReference =
        !resource.embedded && resource.schema && Boolean(prefix) && prefix === resource.identifier
      // Fragment-only document references already address the root without relocation.
      const isLocalRootDocumentReference = !resource.embedded && !resource.schema && !prefix && segments === pointer

      return {
        path: location.map(escapeJsonPointer).join('/'),
        segments: location,
        resourceRelative: isLocalSchemaReference && !bundled,
        value,
        document: resource.document,
        documentPath: resource.documentPath,
        preserveReference:
          isUnresolved || isLocalSchemaReference || isDeclaredRootSchemaReference || isLocalRootDocumentReference,
      }
    },
  }
}
