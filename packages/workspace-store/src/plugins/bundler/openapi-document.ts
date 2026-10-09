import { isObject } from '@scalar/helpers/object/is-object'
import { type DocumentResolver, type LifecyclePlugin, resolveReferencePath } from '@scalar/json-magic/bundle'

/** Resolves an OpenAPI document's declared identity against its retrieval location. */
export const resolveOpenApiDocument: DocumentResolver = (document, retrievalUri) => {
  if (
    !isObject(document) ||
    typeof document.openapi !== 'string' ||
    !/^3\.2\.\d+$/.test(document.openapi) ||
    typeof document.$self !== 'string'
  ) {
    return undefined
  }
  const self = resolveReferencePath(retrievalUri, document.$self)
  // RFC 3986 requires a fragment-free base, while the declared identity can retain its fragment.
  const fragmentIndex = self.indexOf('#')
  const baseUri = fragmentIndex === -1 ? self : self.slice(0, fragmentIndex)
  return { baseUri, metadata: { openapi: document.openapi, $self: self } }
}

/** Honors `$self` for complete OpenAPI documents, including external and cached documents. */
export const openApiDocument = (): LifecyclePlugin => {
  const authoredRefs = new WeakMap<object, string>()
  const paths = new WeakMap<object, readonly string[]>()
  const indexPaths = (value: unknown, path: readonly string[]): void => {
    if (value === null || typeof value !== 'object' || paths.has(value)) return
    paths.set(value, path)
    for (const [key, child] of Object.entries(value)) {
      indexPaths(child, [...path, key])
    }
  }
  return {
    type: 'lifecycle',
    resolveDocument: resolveOpenApiDocument,
    onBeforeNodeProcess: (node, context) => {
      if (typeof node.$ref === 'string' && resolveOpenApiDocument(context.rootNode, context.origin)) {
        // Partial bundles report paths relative to the selected subtree. Index the supplied root
        // so the saved references can also be restored when exporting the entire document.
        indexPaths(context.rootNode, [])
        authoredRefs.set(node, node.$ref)
      }
    },
    onAfterNodeProcess: (node, context) => {
      const authored = authoredRefs.get(node)
      if (authored === undefined || authored === node.$ref) {
        return
      }
      // A path-based map survives serialization and partial bundles without changing Reference Objects.
      // Keep the first spelling, including fragments and ./, when a later pass rewrites it again.
      const root = context.rootNode
      const existing = root['x-scalar-original-refs']
      const mapping = isObject(existing) ? existing : {}
      const key = JSON.stringify(paths.get(node) ?? context.path)
      const previous = mapping[key]
      const original = isObject(previous) && previous.rewritten === authored ? previous.original : authored
      mapping[key] = { original, rewritten: node.$ref }
      root['x-scalar-original-refs'] = mapping
    },
  }
}
