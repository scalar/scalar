import type { PluginDocumentType, PluginNavigationEntry } from '@scalar/types/api-reference'
import type { TraversedPluginEntry } from '@scalar/workspace-store/schemas/navigation'
import type { DocumentTypeDefinition } from '@scalar/workspace-store/schemas/plugin-document'

/** Tag plugin navigation entries (and their children) as `plugin` entries of the given document type. */
const toTraversedEntries = (entries: PluginNavigationEntry[], documentType: string): TraversedPluginEntry[] =>
  entries.map(({ children, ...entry }) => ({
    ...entry,
    type: 'plugin',
    documentType,
    ...(children ? { children: toTraversedEntries(children, documentType) } : {}),
  }))

/**
 * Translate the document types from the plugin API into the workspace store's definitions.
 *
 * The plugin API stays independent of the store's navigation types: plugins return plain entries and
 * this adapter adds the discriminators the store and the sidebar rely on.
 */
export const toStoreDocumentTypes = (documentTypes: PluginDocumentType[]): DocumentTypeDefinition[] =>
  documentTypes.map(({ type, detect, ingest, bundle, traverse }) => ({
    type,
    detect,
    ingest,
    bundle,
    traverse: (context) => toTraversedEntries(traverse(context), type),
  }))
