import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { generateUniqueSlug } from '@/v2/features/command-palette/helpers/generate-unique-slug'

/** Result of attempting to create a draft registry document. */
export type CreateDraftRegistryDocumentResult = { ok: true; documentName: string } | { ok: false; error: string }

/**
 * Create a draft workspace document for a brand-new registry version.
 *
 * The draft is seeded from an existing workspace document (typically the
 * currently active version) so the user has something to start from rather
 * than a blank schema. We pull the seed via `getEditableDocument`, which
 * already returns a clean OpenAPI body (internal extensions like
 * `x-scalar-is-dirty`, `x-scalar-navigation`, and the original-document hash
 * are stripped, and `$ref`s are restored), so we only need to stamp the new
 * `info.version` and let `addDocument` do the rest. The `meta` we pass in
 * overrides any leftover `x-scalar-registry-meta` from the seed during the
 * spread that `addInMemoryDocument` performs.
 *
 * Crucially, we do not record a `commitHash` in `x-scalar-registry-meta` -
 * a missing hash is what marks the document as a "draft" the user has not
 * yet pushed to the registry. If the registry later advertises a hash for
 * this version, the existing version-status pipeline picks it up and
 * surfaces the regular pull / conflict flow.
 */
export const createDraftRegistryDocument = async ({
  workspaceStore,
  namespace,
  slug,
  version,
  seedDocumentName,
}: {
  workspaceStore: WorkspaceStore
  namespace: string
  slug: string
  /** Version string the user just typed in the create-version modal. */
  version: string
  /** Name of the workspace document whose contents we branch off for the draft. */
  seedDocumentName: string
}): Promise<CreateDraftRegistryDocumentResult> => {
  const cloned = await workspaceStore.getEditableDocument(seedDocumentName)
  if (!cloned) {
    return {
      ok: false,
      error: `Seed document "${seedDocumentName}" is not loaded in the workspace.`,
    }
  }

  // Stamp the user-typed version onto the document itself so the rendered
  // OpenAPI matches the registry coordinates. `info` is required by the
  // OpenAPI schema, but we still guard against an unusually shaped seed.
  cloned.info = { ...(cloned.info ?? { title: '' }), version }

  const documentName = await generateUniqueSlug(
    cloned.info.title?.trim() || slug,
    new Set(Object.keys(workspaceStore.workspace.documents)),
  )

  if (!documentName) {
    return {
      ok: false,
      error: 'Failed to generate a unique name for the new version.',
    }
  }

  try {
    const ok = await workspaceStore.addDocument({
      name: documentName,
      document: cloned,
      meta: {
        'x-scalar-registry-meta': {
          namespace,
          slug,
          version,
        },
      },
    })

    if (!ok) {
      return {
        ok: false,
        error: 'Failed to add the new version to the workspace.',
      }
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to add the new version to the workspace.',
    }
  }

  return { ok: true, documentName }
}
