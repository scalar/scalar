import { coerce, object, string } from '@scalar/validation'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { generateUniqueSlug } from '@/v2/features/command-palette/helpers/generate-unique-slug'
import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

/** Result of attempting to load a registry document into the workspace store. */
type LoadRegistryDocumentResult = { ok: true; documentName: string } | { ok: false; error: string }

export const loadRegistryDocument = async ({
  workspaceStore,
  fetcher,
  namespace,
  slug,
  version = 'latest',
}: {
  workspaceStore: WorkspaceStore
  fetcher: ImportDocumentFromRegistry
  namespace: string
  slug: string
  /**
   * Specific version to fetch from the registry. When omitted we ask the
   * registry for `latest`, which is what callers default to when they do
   * not have a concrete version pinned for the document yet.
   */
  version?: string
}): Promise<LoadRegistryDocumentResult> => {
  const documents = workspaceStore.workspace.documents

  const existing = Object.entries(documents).find(([, doc]) => {
    const meta = doc?.['x-scalar-registry-meta']
    return meta?.namespace === namespace && meta?.slug === slug && meta?.version === version
  })

  if (existing) {
    return { ok: true, documentName: existing[0] }
  }

  const result = await fetcher({ namespace, slug, version })
  if (!result.ok) {
    // The registry adapter returns a discriminated `FetchRegistryDocumentError`
    // code; we surface the human-readable `message` when one was provided
    // and fall back to the code itself so the user always sees something
    // actionable in the toast / log line.
    return {
      ok: false,
      error: `Failed to fetch document: ${result.message ?? result.error}`,
    }
  }

  const { document, versionSha } = result.data

  // Parse the document data into a schema
  const schema = object({ info: object({ title: string() }) })
  const baseName = coerce(schema, document).info.title

  // Compose the workspace key as `slug(title)-slug(version)`
  // so the url will be like /workspace/acme/pets-api-1.0.0
  const title = baseName.trim() || slug
  const documentName = await generateUniqueSlug(`${title}-${version}`, new Set(Object.keys(documents)))

  if (!documentName) {
    return {
      ok: false,
      error: 'Failed to generate a unique name for the document',
    }
  }

  await workspaceStore.addDocument({
    name: documentName,
    document,
    meta: {
      'x-scalar-registry-meta': {
        namespace,
        slug,
        version,
        // Only include `commitHash` when the registry actually advertised
        // one. Writing `undefined` into the object would leave an explicit
        // `commitHash: undefined` key on the persisted meta, which the
        // downstream sync logic treats as "we already know the hash" and
        // short-circuits the first commit-hash stamp after a pull.
        ...(versionSha ? { commitHash: versionSha } : {}),
      },
    },
  })

  return { ok: true, documentName }
}
