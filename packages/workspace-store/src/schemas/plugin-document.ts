import { isObject } from '@scalar/helpers/object/is-object'

import type { UnknownObject } from '@/helpers/general'

import type { TraversedEntry } from './navigation'
import type { OpenAPIExtensions } from './v3.2/strict/openapi-document'

/** Document extension that marks a document as owned by a registered document type. */
export const PLUGIN_DOCUMENT_TYPE_KEY = 'x-scalar-document-type'

/**
 * A document whose format is not built into the store (OpenAPI and AsyncAPI are).
 *
 * The store treats the content as opaque: it keeps the document as ingested, adds the bookkeeping
 * extensions every workspace document carries, and leaves the rest to the registered document type.
 */
export type PluginDocument = Omit<OpenAPIExtensions, 'x-original-oas-version'> & {
  /** The `type` of the document type definition that claimed this document. */
  'x-scalar-document-type': string
  /**
   * Document metadata. Taken from the format's own `info` object when it has one (Arazzo and Overlay do);
   * otherwise the store adds an empty one, so every workspace document exposes `info`.
   */
  info: { title?: string; version?: string; description?: string } & Record<string, unknown>
} & Record<string, unknown>

/**
 * Teaches the workspace store about a document format it does not support natively.
 *
 * A registered type is checked before the built-in OpenAPI and AsyncAPI pipelines, so a document it
 * claims never goes through the OpenAPI upgrade or coercion.
 */
export type DocumentTypeDefinition = {
  /** Stable identifier stored on every claimed document as `x-scalar-document-type`. */
  type: string
  /** Whether this definition handles the raw (parsed) input document. */
  detect: (document: UnknownObject) => boolean
  /**
   * Optional hook to upgrade, validate or normalize the raw document before it is stored.
   * Receives a clone, so it may mutate and return the same object.
   */
  ingest?: (document: UnknownObject, context: { documentName: string }) => UnknownObject | Promise<UnknownObject>
  /**
   * Resolve `$ref`s with the store's loaders (fetch, file loader) before storing the document.
   * Defaults to `false`, since the reference semantics of a foreign format are not known to the store.
   */
  bundle?: boolean
  /**
   * Build the sidebar entries for the document. The store wraps them in the document root entry.
   * Ids must be unique across the workspace, so prefix them with the given `documentId`.
   */
  traverse: (context: { documentName: string; documentId: string; document: PluginDocument }) => TraversedEntry[]
}

/** Narrow a value to a document claimed by a registered document type. */
export const isPluginDocument = (value: unknown): value is PluginDocument =>
  isObject(value) && typeof value[PLUGIN_DOCUMENT_TYPE_KEY] === 'string'

/**
 * Find the registered document type that claims a raw document, if any.
 *
 * Every document goes through `detect`, so one that throws counts as "not mine". Otherwise a bug in a
 * single document type would stop OpenAPI and AsyncAPI documents from loading too.
 */
export const findDocumentType = (
  documentTypes: readonly DocumentTypeDefinition[] | undefined,
  document: UnknownObject,
): DocumentTypeDefinition | undefined =>
  documentTypes?.find((documentType) => {
    try {
      return documentType.detect(document)
    } catch (error) {
      console.error(`Document type '${documentType.type}' failed to detect a document:`, error)
      return false
    }
  })
