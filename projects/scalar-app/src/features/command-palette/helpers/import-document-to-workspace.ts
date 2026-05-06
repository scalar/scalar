import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'

import { generateUniqueSlug } from '@/v2/features/command-palette/helpers/generate-unique-slug'

/**
 * Imports a single document from a workspace state into the current workspace.
 *
 * This function handles the complete import process including slug generation,
 * document loading, and sidebar updates. It ensures the imported document does not
 * conflict with existing documents by generating a unique slug.
 *
 * The meta from the importing workspace is intentionally excluded to preserve
 * the current workspace settings and avoid unintended configuration changes.
 *
 * @param workspaceStore - The active workspace store where the document will be imported
 * @param workspaceState - The in-memory workspace containing the document to import
 * @param name - The original slug/name of the document in the source workspace state
 *
 * @returns Promise that resolves to the slug of the imported document
 */
export const importDocumentToWorkspace = async ({
  workspaceStore,
  workspaceState,
  name,
}: {
  workspaceStore: WorkspaceStore | null
  workspaceState: InMemoryWorkspace
  name: string
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> => {
  if (!workspaceStore) {
    return { ok: false, error: 'Workspace store is not available' }
  }

  const importingDocument = workspaceState.documents[name]
  if (!importingDocument) {
    return { ok: false, error: 'Importing document not found in workspace state' }
  }

  const currentDocuments = new Set(Object.keys(workspaceStore.workspace.documents))

  /**
   * Generate a unique slug to avoid naming conflicts with existing documents.
   * The slug is based on the document title but modified if necessary to ensure uniqueness.
   */
  const slug = await generateUniqueSlug(importingDocument.info.title || 'default', currentDocuments)
  if (!slug) {
    return { ok: false, error: 'Failed to generate a unique slug for the importing document' }
  }

  /**
   * Load the document along with all its associated data structures.
   * We intentionally pass an empty meta object to preserve the current workspace settings.
   */
  workspaceStore.loadWorkspace({
    meta: {},
    documents: {
      [slug]: importingDocument,
    },
    intermediateDocuments: {
      [slug]: workspaceState.intermediateDocuments[name] ?? {},
    },
    originalDocuments: {
      [slug]: workspaceState.originalDocuments[name] ?? {},
    },
    overrides: {
      [slug]: workspaceState.overrides[name] ?? {},
    },
    history: {},
    auth: {},
  })

  /**
   * Rebuild the sidebar to update all internal references from the old slug to the new one.
   * This ensures the document appears correctly in the sidebar navigation.
   */
  workspaceStore.buildSidebar(slug)

  /**
   * Persist the imported document and the changes made during sidebar rebuilding.
   * Without this, the import would be lost on page refresh.
   */
  await workspaceStore.saveDocument(slug)

  return { ok: true, slug }
}
