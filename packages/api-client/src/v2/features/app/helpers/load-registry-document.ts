import { coerce, object, string } from '@scalar/validation'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { generateUniqueSlug } from '@/v2/features/command-palette/helpers/generate-unique-slug'
import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

/** Result of attempting to load a registry document into the workspace store. */
export type LoadRegistryDocumentResult = { ok: true; documentName: string } | { ok: false; error: string }

export const loadRegistryDocument = async ({
  workspaceStore,
  fetcher,
  namespace,
  slug,
}: {
  workspaceStore: WorkspaceStore
  fetcher: ImportDocumentFromRegistry
  namespace: string
  slug: string
}): Promise<LoadRegistryDocumentResult> => {
  const documents = workspaceStore.workspace.documents

  const existing = Object.entries(documents).find(([, doc]) => {
    const meta = doc?.['x-scalar-registry-meta']
    return meta?.namespace === namespace && meta?.slug === slug
  })

  if (existing) {
    return { ok: true, documentName: existing[0] }
  }

  const result = await fetcher({ namespace, slug, version: 'latest' })
  if (!result.ok) {
    return {
      ok: false,
      error: `Failed to fetch document: ${result.error || 'Unknown error'}`,
    }
  }

  // Parse the document data into a schema
  const schema = object({ info: object({ title: string() }) })
  const baseName = coerce(schema, result.data).info.title

  const documentName = await generateUniqueSlug(baseName, new Set(Object.keys(documents)))

  if (!documentName) {
    return {
      ok: false,
      error: 'Failed to generate a unique name for the document',
    }
  }

  // Add the document to the workspace store
  await workspaceStore.addDocument({
    name: documentName,
    document: result.data,
    meta: {
      'x-scalar-registry-meta': { namespace, slug },
    },
  })

  return { ok: true, documentName }
}
