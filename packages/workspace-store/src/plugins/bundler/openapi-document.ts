import { isObject } from '@scalar/helpers/object/is-object'
import { type DocumentResolver, type LifecyclePlugin, resolveReferencePath } from '@scalar/json-magic/bundle'

/** Resolves an OpenAPI document's declared identity against its retrieval location. */
export const resolveOpenApiDocument: DocumentResolver = (document, retrievalUri) => {
  if (!isObject(document) || typeof document.openapi !== 'string' || typeof document.$self !== 'string') {
    return undefined
  }
  const self = resolveReferencePath(retrievalUri, document.$self)
  // RFC 3986 requires a fragment-free base, while the declared identity can retain its fragment.
  const fragmentIndex = self.indexOf('#')
  const baseUri = fragmentIndex === -1 ? self : self.slice(0, fragmentIndex)
  return { baseUri, metadata: { openapi: document.openapi, $self: self } }
}

/** Honors `$self` for complete OpenAPI documents, including external and cached documents. */
export const openApiDocument = (): LifecyclePlugin => ({
  type: 'lifecycle',
  resolveDocument: resolveOpenApiDocument,
})
