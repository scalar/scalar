import { isObject } from '@scalar/helpers/object/is-object'
import { type DocumentResolver, type LifecyclePlugin, resolveReferencePath } from '@scalar/json-magic/bundle'

/** Resolves an OpenAPI document's declared identity against its retrieval location. */
export const resolveOpenApiDocument: DocumentResolver = (document, retrievalUri) => {
  if (!isObject(document) || typeof document.openapi !== 'string' || typeof document.$self !== 'string') {
    return undefined
  }
  const baseUri = resolveReferencePath(retrievalUri, document.$self)
  return { baseUri, metadata: { openapi: document.openapi, $self: baseUri } }
}

/** Honors `$self` for complete OpenAPI documents, including external and cached documents. */
export const openApiDocument = (): LifecyclePlugin => ({
  type: 'lifecycle',
  resolveDocument: resolveOpenApiDocument,
})
