import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObject } from '@scalar/helpers/object/is-object'

import { decodeUriFragment } from '@/helpers/decode-uri-fragment'
import { escapeJsonPointer } from '@/helpers/escape-json-pointer'
import { getId } from '@/helpers/get-schemas'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { resolveReferencePath } from '@/helpers/resolve-reference-path'
import { resolveResourcePath } from '@/helpers/resolve-resource-path'
import { toResourceUri } from '@/helpers/to-resource-uri'
import { type ScopeRole, getChildScopeRole } from '@/magic-proxy/dynamic-ref'
import { getRaw } from '@/magic-proxy/symbols'

import { type ReferenceContext, childReferenceContext, getSchemaVocabulary } from '../document/reference-context'
import { documentTraversal, getDocumentTraversalDialect } from './document-traversal'

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
  dynamicAnchor?: string
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
  dynamicAnchor?: string
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
  /** Index an occurrence copy without replacing the source document's URI aliases. */
  registerFragment: (
    document: unknown,
    location: { origin: string; retrievalBase: string; sourceUri: string; path: string[] },
  ) => void
  refresh: (document: unknown, targetPath: string[]) => void
  isSchemaResource: (uri: string) => boolean
  /** The owner of a schema resource, including a standalone schema's implicit retrieval root. */
  schemaResource: (uri: string) => unknown
  /** Dynamic references in complete API descriptions must occur at a modern schema position. */
  dynamicSchemaPosition: (node: object) => boolean | undefined
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
        /** Plain-name fragment created by a dynamic anchor, when that fragment was used. */
        dynamicAnchor?: string
      }
    | undefined
}

/** Give unmapped bundle entries separate bases so relative schema identifiers cannot collide. */
export const bundledDocumentUri = (origin: string, key: string, source?: string): string =>
  resolveReferencePath(origin, source ?? `./__bundle_${encodeURIComponent(key)}/document`)

/** An opaque resource URI cannot resolve a relative dynamic reference. */
export const resolveInitialDynamicRef = (
  references: DocumentReferences,
  reference: string,
  origin: string,
): ReturnType<DocumentReferences['resolve']> => {
  try {
    return references.resolve(reference, origin)
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error
    }
    return undefined
  }
}

const identifySchemaPosition = (
  node: object,
  role?: ScopeRole,
  context?: ReferenceContext,
): SchemaIdentity | undefined => {
  if (!isObject(node) || (context === undefined && role)) {
    return undefined
  }
  const vocabulary = context === undefined ? undefined : getSchemaVocabulary(context)
  if (context !== undefined && vocabulary === undefined) {
    return undefined
  }
  const keyword = context === undefined ? '$id' : vocabulary?.idKeyword
  return {
    id: keyword === '$id' ? getId(node) : undefined,
    anchor:
      (context === undefined || vocabulary?.anchors) && typeof node.$anchor === 'string' ? node.$anchor : undefined,
    dynamicAnchor:
      (context === undefined || vocabulary?.anchors) && typeof node.$dynamicAnchor === 'string'
        ? node.$dynamicAnchor
        : undefined,
  }
}

/**
 * Indexes complete documents before following their references. A declared identity
 * can point to content already in memory even when that URI cannot be fetched.
 */
export const documentReferences = (
  externalDocumentsKey: string,
  resolveDocument?: DocumentResolver,
  canonicalizeIds = false,
  shouldVisit: (node: object) => boolean = () => true,
  identifySchema: typeof identifySchemaPosition = identifySchemaPosition,
  outputDocumentUri?: (retrievalUri: string) => string,
  { includeCustomReferences = false }: { includeCustomReferences?: boolean } = {},
): DocumentReferences => {
  const identities = new Map<unknown, DocumentIdentity>()
  const resources = new Map<string, Resource>()
  const schemaPositions = new WeakMap<object, ReferenceContext>()
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
      dialect: ReturnType<typeof getDocumentTraversalDialect>
      customTraversal?: ReturnType<typeof documentTraversal>
    }
  >()

  const register = (
    document: unknown,
    retrievalUri: string,
    path: string[] = [],
    retrievalBase = retrievalUri,
    sourceUri = retrievalUri,
    fragment = false,
  ): void => {
    if (path.length === 0) {
      rootUri = retrievalUri
    }
    const identity = fragment ? undefined : resolveDocument?.(document, retrievalUri)
    const base = identity === undefined ? retrievalUri : resolveReferencePath(retrievalUri, identity.baseUri)
    if (identity !== undefined) {
      identities.set(document, { ...identity, baseUri: base })
    }
    const resource = { value: document, path, schema: false, embedded: path.length > 0, document, documentPath: path }
    // Retrieval aliases retain compatibility with callers that supply local copies.
    if (!fragment) {
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
    }
    if (path.length > 1) {
      bundledResources.set(path[1], resource)
    }
    const retrievalOrigin = identity ? resolveReferencePath(retrievalBase, identity.baseUri) : retrievalBase
    const outputRetrieval = outputDocumentUri?.(retrievalUri) ?? base
    const outputBase =
      outputDocumentUri && identity ? resolveResourcePath(outputRetrieval, identity.baseUri) : outputRetrieval
    const dialect = identifySchema === identifySchemaPosition ? getDocumentTraversalDialect(document) : undefined
    const customTraversal =
      includeCustomReferences && dialect ? documentTraversal(document, { includeCustomReferences: true }) : undefined
    customTraversal?.register(document, base)
    registrations.set(document, {
      base,
      path,
      retrievalBase: retrievalOrigin,
      retrievalUri,
      sourceUri,
      outputBase,
      resource,
      dialect,
      customTraversal,
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
    const { outputBase, sourceUri, dialect, customTraversal } = registrations.get(document)!
    const position = (node: object, fallback?: ReferenceContext): ReferenceContext | undefined => {
      const location = customTraversal?.location(node)
      if (location?.customReferences && getSchemaVocabulary(location.context, true)?.anchors) {
        return 'schema'
      }
      return location?.context ?? fallback
    }
    const nextContext = (
      parent: object,
      context: ReferenceContext | undefined,
      key: string,
    ): ReferenceContext | undefined => {
      if (!dialect || context === undefined || (Array.isArray(parent) && !['objects', 'messages'].includes(context))) {
        return context
      }
      const schemaFormat = Reflect.get(parent, 'schemaFormat')
      return childReferenceContext(context, key, {
        ...dialect,
        schemaFormat: typeof schemaFormat === 'string' ? schemaFormat : undefined,
      })
    }
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
      role?: ScopeRole,
      inheritedContext?: ReferenceContext,
    ): void => {
      if (value === null || typeof value !== 'object' || visited.has(value) || !shouldVisit(value)) {
        return
      }
      visited.add(value)
      sourceOrigins.set(value, sourceUri)
      if (isObject(value)) {
        restoreLiteralIdentifier(value)
      }
      const context = position(value, inheritedContext)
      if (context !== undefined) {
        schemaPositions.set(value, context)
      }
      const schemaIdentity = identifySchema(value, role, context)
      const id = schemaIdentity?.id
      const identifier = id ?? inheritedIdentifier
      const resolved =
        id === undefined ? origin : canonicalizeIds ? resolveResourcePath(origin, id) : resolveReferencePath(origin, id)
      const current = (
        canonicalizeIds && id !== undefined ? resolveResourcePath(toResourceUri(origin), id) : resolved
      ).replace(/#$/, '')
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
      const dynamicAnchor = schemaIdentity?.dynamicAnchor
      if (id !== undefined || anchor !== undefined || dynamicAnchor !== undefined) {
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
        if (dynamicAnchor !== undefined) {
          resources.set(`${current}#${dynamicAnchor}`, { ...schemaResource, dynamicAnchor })
        }
      }
      for (const key of Object.keys(getRaw(value))) {
        // Pre-resolved links on in-memory schemas are traversal edges, not lexical children.
        if (key !== externalDocumentsKey && (key !== '$ref-value' || role === 'map')) {
          visit(
            (value as Record<string, unknown>)[key],
            current,
            [...location, key],
            identifier,
            currentRetrieval,
            currentOutput,
            getChildScopeRole(role, key),
            nextContext(value, context, key),
          )
        }
      }
    }
    let target = document
    let origin = base
    let identifier = ''
    let retrievalOrigin = retrievalBase
    let outputOrigin = outputBase
    let role: ScopeRole
    let context: ReferenceContext | undefined = dialect ? 'object' : undefined
    for (const key of targetPath) {
      if (target === null || typeof target !== 'object' || !Object.hasOwn(getRaw(target), key)) {
        return
      }
      origin = origins.get(target) ?? origin
      retrievalOrigin = retrievalOrigins.get(target) ?? retrievalOrigin
      outputOrigin = outputOrigins.get(target) ?? outputOrigin
      context = position(target, context)
      identifier = identifySchema(target, role, context)?.id ?? identifier
      role = getChildScopeRole(role, key)
      context = nextContext(target, context, key)
      target = (target as Record<string, unknown>)[key]
    }
    visit(target, origin, [...path, ...targetPath], identifier, retrievalOrigin, outputOrigin, role, context)
  }

  return {
    source: (node) => sources.get(node),
    registerFragment: (document, { origin, retrievalBase, sourceUri, path }) =>
      register(document, origin, path, retrievalBase, sourceUri, true),
    documents: () => [...registrations].map(([value, { path }]) => ({ value, path })),
    schemas: () =>
      [...resources].flatMap(([uri, resource]) =>
        resource.schema &&
        isObject(resource.value) &&
        identifySchema(resource.value, undefined, schemaPositions.get(resource.value))?.id !== undefined &&
        uri === origins.get(resource.value)
          ? [
              {
                uri,
                outputUri: outputDocumentUri ? outputOrigins.get(resource.value) : undefined,
                path: resource.path,
                idKeyword:
                  identifySchema(resource.value, undefined, schemaPositions.get(resource.value))?.idKeyword ?? '$id',
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
        const identity = identifySchema(resource.value, undefined, schemaPositions.get(resource.value))
        const origin = origins.get(resource.value)
        if (
          shouldVisit(resource.value) &&
          ((identity?.id !== undefined &&
            (uri === origin || (canonicalizeIds && uri === retrievalOrigins.get(resource.value)))) ||
            (identity?.anchor !== undefined && uri === `${origin}#${identity.anchor}`) ||
            (identity?.dynamicAnchor !== undefined && uri === `${origin}#${identity.dynamicAnchor}`))
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
    schemaResource: (uri) => {
      const resource = resources.get(uri)
      return resource && (resource.schema || (isObject(resource.value) && !schemaPositions.has(resource.value)))
        ? resource.value
        : undefined
    },
    dynamicSchemaPosition: (node) => {
      const context = schemaPositions.get(node)
      return context === undefined ? undefined : (getSchemaVocabulary(context)?.anchors ?? false)
    },
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
        : base.split('#', 1)[0]!
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
        ...(resource.dynamicAnchor === undefined ? {} : { dynamicAnchor: resource.dynamicAnchor }),
        preserveReference:
          isUnresolved || isLocalSchemaReference || isDeclaredRootSchemaReference || isLocalRootDocumentReference,
      }
    },
  }
}
