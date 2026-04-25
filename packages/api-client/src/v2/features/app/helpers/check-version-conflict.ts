import type { WorkspaceStore } from '@scalar/workspace-store/client'

import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

import { detectDocumentConflicts } from './detect-document-conflicts'

/** Result returned by `checkVersionConflict`. */
export type CheckVersionConflictResult =
  | {
      ok: true
      hasConflict: boolean
      /**
       * `true` when the result was already cached on the document for the
       * current registry hash and we did not have to fetch / recompute.
       */
      fromCache: boolean
    }
  | { ok: false; error: string }

/**
 * Compute (or reuse a cached) conflict-check result for a registry-backed
 * workspace document and persist it on `x-scalar-registry-meta`.
 *
 * The check is a three-way merge between:
 *  - the original document (last-known remote, kept in
 *    `workspaceStore.getOriginalDocument`),
 *  - the editable workspace document (with the user's local edits),
 *  - the freshly-fetched remote document advertised at `registryCommitHash`.
 *
 * The result is cached on the document under
 * `x-scalar-registry-meta.{conflictCheckedAgainstHash, hasConflict}` so
 * subsequent renders can short-circuit. The cache is only valid while
 * `conflictCheckedAgainstHash === registryCommitHash`.
 *
 * Writing to `x-scalar-registry-meta` does not flip the document's
 * `x-scalar-is-dirty` flag (the workspace store excludes registry meta from
 * the dirty tracker), so this side effect is safe to perform in the
 * background.
 */
export const checkVersionConflict = async ({
  workspaceStore,
  fetcher,
  documentName,
  namespace,
  slug,
  version,
  registryCommitHash,
}: {
  workspaceStore: WorkspaceStore
  fetcher: ImportDocumentFromRegistry
  /** Name of the workspace document the cache lives on. */
  documentName: string
  namespace: string
  slug: string
  version: string
  /**
   * Commit hash advertised by the registry for this version. The conflict
   * cache is keyed on this hash; passing `undefined` skips the check.
   */
  registryCommitHash?: string
}): Promise<CheckVersionConflictResult> => {
  if (!registryCommitHash) {
    return { ok: false, error: 'No registry commit hash available for this version.' }
  }

  const document = workspaceStore.workspace.documents[documentName]
  if (!document) {
    return { ok: false, error: `Document "${documentName}" is not loaded in the workspace.` }
  }

  const meta = document['x-scalar-registry-meta']

  // Cache hit - the previous check was performed against the registry hash
  // we are being asked about, so we can return the stored result without
  // touching the network.
  if (meta?.conflictCheckedAgainstHash === registryCommitHash && typeof meta?.hasConflict === 'boolean') {
    return { ok: true, hasConflict: meta.hasConflict, fromCache: true }
  }

  const original = workspaceStore.getOriginalDocument(documentName)
  if (!original) {
    return { ok: false, error: `Original document for "${documentName}" is unavailable.` }
  }

  const result = await fetcher({ namespace, slug, version })
  if (!result.ok) {
    return { ok: false, error: `Failed to fetch document: ${result.error || 'Unknown error'}` }
  }

  const hasConflict = detectDocumentConflicts({
    original: original as Record<string, unknown>,
    local: document as unknown as Record<string, unknown>,
    remote: result.data,
  })

  // Persist the cache on the document. The workspace store's dirty tracker
  // skips `x-scalar-registry-meta` writes, so this does not mark the
  // document as having local edits.
  const next = {
    ...(meta ?? { namespace, slug, version }),
    namespace,
    slug,
    version,
    conflictCheckedAgainstHash: registryCommitHash,
    hasConflict,
  }
  document['x-scalar-registry-meta'] = next

  return { ok: true, hasConflict, fromCache: false }
}
