import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import { checkVersionConflict } from '@/v2/features/app/helpers/check-version-conflict'
import type { SidebarDocumentVersion } from '@/v2/features/app/hooks/use-sidebar-documents'
import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

/**
 * Kicks off background `checkVersionConflict` calls for every loaded
 * registry-backed version of the active document group whose status
 * indicates a fresh three-way merge is needed.
 *
 * Scope is limited to the *active document group* on purpose: the breadcrumb
 * only renders the picker for the document the user is currently viewing,
 * so spending requests on versions outside that group would be wasted work.
 * Within the active group, every loaded version is checked because the
 * picker dropdown surfaces a status icon for each row — switching versions
 * later should not block on a new request when the user opens the dropdown.
 *
 * The helper writes the result to `x-scalar-registry-meta` on the workspace
 * document, which then flows back through `useSidebarDocuments` and updates
 * the row icon. The in-memory `inflight` map guards against firing the same
 * request twice while the cache write is still pending.
 */
export const useVersionConflictCheck = ({
  store,
  fetcher,
  registry,
  versions,
}: {
  /** Workspace store the conflict result is cached on. */
  store: MaybeRefOrGetter<WorkspaceStore | null>
  /** Registry fetcher used to pull the latest remote document for the merge. */
  fetcher: MaybeRefOrGetter<ImportDocumentFromRegistry | undefined>
  /** Registry coordinates of the group these versions belong to. */
  registry: MaybeRefOrGetter<{ namespace: string; slug: string } | undefined>
  /** All versions of the active document group. */
  versions: MaybeRefOrGetter<SidebarDocumentVersion[]>
}): void => {
  // Tracks the registry hash we have already kicked off a check for, keyed
  // by `documentName`. The check itself also caches on the document via
  // `x-scalar-registry-meta`, but that write is asynchronous; this map
  // bridges the gap so rapid re-renders do not fire duplicate requests.
  const inflight = new Map<string, string>()

  watch(
    () => toValue(versions),
    (next) => {
      const fetcherValue = toValue(fetcher)
      const storeValue = toValue(store)
      const registryValue = toValue(registry)
      if (!fetcherValue || !storeValue || !registryValue) {
        return
      }

      for (const version of next) {
        // We can only run the three-way merge when the version is loaded
        // locally and the registry has advertised a hash to compare against.
        if (!version.documentName || !version.registryCommitHash) {
          continue
        }

        // Already fired (or finished) a check for this exact registry hash.
        if (inflight.get(version.documentName) === version.registryCommitHash) {
          continue
        }

        // The status helper already encodes everything we need to decide
        // whether a fresh check is required. `pull` means "hashes differ
        // and no usable cached result"; the other states either match
        // (`synced`, `push`) or already reflect a cached conflict
        // (`conflict`).
        if (version.status !== 'pull') {
          continue
        }

        const documentName = version.documentName
        const registryCommitHash = version.registryCommitHash
        inflight.set(documentName, registryCommitHash)

        void checkVersionConflict({
          workspaceStore: storeValue,
          fetcher: fetcherValue,
          documentName,
          namespace: registryValue.namespace,
          slug: registryValue.slug,
          version: version.version,
          registryCommitHash,
        }).catch(() => {
          // Allow a future render to retry by clearing the in-flight marker
          // when the helper itself rejects (network failure, etc.). The
          // helper's `ok: false` returns are handled silently — the cache
          // simply stays empty and the row keeps showing `pull`.
          inflight.delete(documentName)
        })
      }
    },
    { immediate: true },
  )
}
