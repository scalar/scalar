import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObject } from '@scalar/helpers/object/is-object'

import { decodeUriFragment } from '@/helpers/decode-uri-fragment'
import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getId } from '@/helpers/get-schemas'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { resolveReferencePath } from '@/helpers/resolve-reference-path'
import { resolveResourcePath } from '@/helpers/resolve-resource-path'
import { toResourceUri } from '@/helpers/to-resource-uri'
import { getRaw } from '@/magic-proxy/proxy'

/** Format-specific document identity, supplied by the caller. */
export type DocumentIdentity = {
  /** Declared base URI, resolved relative to the retrieval URI when necessary. */
  baseUri: string
  /** Root properties retained on copies embedded in the bundle; never applied to the source document. */
  metadata?: Record<string, unknown>
  /** Headerless resources are traversed only through targets whose context is established by a reference. */
  visitReferencedSubtrees?: boolean
  /** Translate an authored pointer into this resource's transformed layout. */
  remapPointer?: (pointer: readonly string[]) => readonly string[]
}

/** Reads document identity without imposing a document format on the bundler. */
export type DocumentResolver = (document: unknown, retrievalUri: string) => DocumentIdentity | undefined

/** Schema identity fields recognized by the caller's active vocabulary. */
export type SchemaIdentity = {
  id?: string
  idKeyword?: 'id' | '$id'
  anchor?: string
}

/** A declared schema identity and its location in the output document. */
export type SchemaResourceLocation = {
  path: string[]
  /** Canonical identity used to resolve the source document. */
  uri: string
  /** Serialization identity when the source is mapped to an output base. */
  outputUri?: string
  idKeyword: 'id' | '$id'
}

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

/** A node's location within its own resource, independent of bundle storage. */
export type DocumentLocation = { document: unknown; path: readonly string[]; uri: string }

/** Resolution metadata survives moving documents into the bundle. */
export type DocumentReferences = {
  source: (node: object) => DocumentLocation | undefined
  /** Retrieval document boundaries remain distinct even without a declared identity. */
  documents: () => { path: string[]; value: unknown }[]
  /** Declared schema identities and their output paths, including reconstructed ancestors. */
  schemas: () => SchemaResourceLocation[]
  identity: (document: unknown) => DocumentIdentity | undefined
  register: (
    document: unknown,
    retrievalUri: string,
    path?: string[],
    retrievalBase?: string,
    sourceUri?: string,
  ) => void
  refresh: (document: unknown, targetPath: string[]) => void
  isSchemaResource: (uri: string) => boolean
  origin: (node: object) => string | undefined
  /** Retrieval source before authored identifiers change the reference base. */
  sourceOrigin: (node: object) => string | undefined
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
  identifySchema: (node: object) => SchemaIdentity | undefined = (node) => ({
    id: getId(node),
    anchor: isObject(node) && typeof node.$anchor === 'string' ? node.$anchor : undefined,
  }),
  outputDocumentUri?: (retrievalUri: string) => string,
): DocumentReferences => {
  const identities = new Map<unknown, DocumentIdentity>()
  const resources = new Map<string, Resource>()
  const sources = new WeakMap<object, DocumentLocation>()
  const origins = new WeakMap<object, string>()
  const sourceOrigins = new WeakMap<object, string>()
  const outputOrigins = new WeakMap<object, string>()
  const retrievalOrigins = new WeakMap<object, string>()
  const bundledResources = new Map<string, Resource>()

  const canonicalizedIds = new WeakMap<object, { keyword: 'id' | '$id'; authored: string; canonical: string }>()

  // Cached schemas are first indexed before their referencing wrapper supplies a dialect.
  // Undo only our own mutation when that dialect treats the identifier as literal data.
  const restoreLiteralIdentifier = (value: Record<string, unknown>): void => {
    const previous = canonicalizedIds.get(value)
    if (!previous) {
      return
    }
    const identity = identifySchema(value)
    if (shouldVisit(value) && identity?.id !== undefined && (identity.idKeyword ?? '$id') === previous.keyword) {
      return
    }
    if (value[previous.keyword] === previous.canonical) {
      value[previous.keyword] = previous.authored
    }
    canonicalizedIds.delete(value)
  }

  let rootUri: string | undefined

  const registrations = new Map<
    unknown,
    {
      base: string
      path: string[]
      retrievalBase: string
      retrievalUri: string
      sourceUri: string
      outputBase: string
      resource: Resource
    }
  >()

  const register = (
    document: unknown,
    retrievalUri: string,
    path: string[] = [],
    retrievalBase = retrievalUri,
    sourceUri = retrievalUri,
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
    // Relative URL resolution can normalize the declared base, such as removing a default port.
    if (identity !== undefined && URL.canParse(base)) {
      resources.set(new URL(base).href, resource)
    }
    if (canonicalizeIds) {
      resources.set(toResourceUri(retrievalUri), resource)
      resources.set(toResourceUri(base), resource)
    }
    if (path.length > 1) {
      bundledResources.set(path[1], resource)
    }
    const retrievalOrigin = identity ? resolveReferencePath(retrievalBase, identity.baseUri) : retrievalBase
    const outputRetrieval = outputDocumentUri?.(retrievalUri) ?? base
    const outputBase =
      outputDocumentUri && identity ? resolveResourcePath(outputRetrieval, identity.baseUri) : outputRetrieval
    registrations.set(document, {
      base,
      path,
      retrievalBase: retrievalOrigin,
      retrievalUri,
      sourceUri,
      outputBase,
      resource,
    })
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
    const outputBase = registrations.get(document)!.outputBase
    // Shared nodes use the first traversal path and base, including for $id and $anchor
    // registration. This also prevents cycles from being indexed repeatedly.
    const visited = new WeakSet<object>()

    const visit = (
      value: unknown,
      origin: string,
      location: string[],
      inheritedIdentifier = '',
      retrievalOrigin = retrievalBase,
      outputOrigin = outputBase,
    ): void => {
      if (value === null || typeof value !== 'object' || visited.has(value) || !shouldVisit(value)) {
        return
      }
      visited.add(value)
      sourceOrigins.set(value, registrations.get(document)!.sourceUri)
      if (isObject(value)) {
        restoreLiteralIdentifier(value)
      }
      const schemaIdentity = identifySchema(value)
      const id = schemaIdentity?.id
      const identifier = id ?? inheritedIdentifier
      const resolved =
        id === undefined ? origin : canonicalizeIds ? resolveResourcePath(origin, id) : resolveReferencePath(origin, id)
      const current =
        canonicalizeIds && id !== undefined
          ? resolveResourcePath(toResourceUri(origin), id).replace(/#$/, '')
          : resolved
      // A refresh can encounter an identifier that this index already canonicalized.
      const currentRetrieval =
        canonicalizeIds && id === origins.get(value) && retrievalOrigins.has(value)
          ? retrievalOrigins.get(value)!
          : id === undefined
            ? retrievalOrigin
            : canonicalizeIds
              ? resolveResourcePath(retrievalOrigin, id)
              : resolveReferencePath(retrievalOrigin, id)
      sources.set(value, { document, path: location.slice(path.length), uri: retrievalBase })
      const previous = canonicalizedIds.get(value)
      const authored = previous && previous.canonical === id ? previous.authored : id
      const currentOutput = !outputDocumentUri
        ? current
        : id === undefined
          ? outputOrigin
          : resolveResourcePath(outputOrigin, authored).replace(/#$/, '')
      if (outputDocumentUri) outputOrigins.set(value, currentOutput)
      origins.set(value, current)
      retrievalOrigins.set(value, currentRetrieval)
      // Relative identifiers would acquire a different identity after serialization elsewhere.
      // Use the indexed base before mutation so nested identifiers are resolved exactly once.
      if (canonicalizeIds && id !== undefined && isObject(value)) {
        const keyword = schemaIdentity?.idKeyword ?? '$id'
        const previous = canonicalizedIds.get(value)
        canonicalizedIds.set(value, {
          keyword,
          authored: previous?.keyword === keyword && previous.canonical === id ? previous.authored : id,
          canonical: current,
        })
        value[keyword] = current
      }
      const anchor = schemaIdentity?.anchor
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
          if (canonicalizeIds) resources.set(currentRetrieval, schemaResource)
        }
        if (anchor !== undefined) {
          resources.set(`${current}#${anchor}`, schemaResource)
        }
      }
      for (const key of Object.keys(getRaw(value))) {
        if (key !== externalDocumentsKey) {
          visit(
            (value as Record<string, unknown>)[key],
            current,
            [...location, key],
            identifier,
            currentRetrieval,
            currentOutput,
          )
        }
      }
    }
    let target = document
    let origin = base
    let identifier = ''
    let retrievalOrigin = retrievalBase
    let outputOrigin = outputBase
    for (const key of targetPath) {
      if (target === null || typeof target !== 'object') {
        return
      }
      origin = origins.get(target) ?? origin
      retrievalOrigin = retrievalOrigins.get(target) ?? retrievalOrigin
      outputOrigin = outputOrigins.get(target) ?? outputOrigin
      identifier = identifySchema(target)?.id ?? identifier
      target = (target as Record<string, unknown>)[key]
    }
    visit(target, origin, [...path, ...targetPath], identifier, retrievalOrigin, outputOrigin)
  }

  return {
    source: (node) => sources.get(node),
    documents: () => [...registrations].map(([value, { path }]) => ({ value, path })),
    schemas: () =>
      [...resources].flatMap(([uri, resource]) =>
        resource.schema &&
        isObject(resource.value) &&
        identifySchema(resource.value)?.id !== undefined &&
        uri === origins.get(resource.value)
          ? [
              {
                uri,
                outputUri: outputDocumentUri ? outputOrigins.get(resource.value) : undefined,
                path: resource.path,
                idKeyword: identifySchema(resource.value)?.idKeyword ?? '$id',
              },
            ]
          : [],
      ),
    identity: (document) => identities.get(document),
    register,
    refresh: (document, targetPath) => {
      const registration = registrations.get(document)
      if (!registration) {
        return
      }
      index(document, registration.base, registration.path, targetPath, registration.retrievalBase)
      // A cached fragment can acquire its actual dialect after its first indexing.
      // Drop identities that became literal while keeping fetchable retrieval aliases.
      for (const [uri, resource] of resources) {
        if (resource.document !== document || !resource.schema || !isObject(resource.value)) {
          continue
        }
        restoreLiteralIdentifier(resource.value)
        const identity = identifySchema(resource.value)
        const origin = origins.get(resource.value)
        if (
          shouldVisit(resource.value) &&
          ((identity?.id !== undefined &&
            (uri === origin || (canonicalizeIds && uri === retrievalOrigins.get(resource.value)))) ||
            (identity?.anchor !== undefined && uri === `${origin}#${identity.anchor}`))
        ) {
          continue
        }
        if (uri === registration.base || uri === registration.retrievalUri) {
          resources.set(uri, registration.resource)
        } else {
          resources.delete(uri)
        }
      }
    },
    isSchemaResource: (uri) => resources.get(uri)?.schema === true,
    origin: (node) => origins.get(node),
    retrievalOrigin: (node) => retrievalOrigins.get(node),
    sourceOrigin: (node) => sourceOrigins.get(node),
    resolve: (ref, base, rootFallback = false) => {
      const [prefix, authoredFragment = ''] = ref.split('#', 2)
      const fragment = decodeUriFragment(authoredFragment)
      const uri = prefix
        ? canonicalizeIds
          ? resolveResourcePath(base, prefix)
          : resolveReferencePath(base, prefix)
        : canonicalizeIds
          ? base.split('#', 1)[0]!
          : base
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
      const segments = bundled
        ? pointer.slice(2)
        : [...(!resource.schema ? (identities.get(resource.document)?.remapPointer?.(pointer) ?? pointer) : pointer)]
      const remapped =
        segments.length !== pointer.length || segments.some((segment, index) => segment !== pointer[index])
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
      const isLocalRootDocumentReference = !resource.embedded && !resource.schema && !prefix && !remapped

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
