import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type MaybeRefOrGetter, computed, toValue, watch } from 'vue'

/**
 * Watches the specified document in the workspace store and periodically rebases it with its remote source.
 *
 * This utility sets up a watcher on the given document. If the document specifies an 'x-scalar-original-source-url',
 * this hook polls the remote source every second (using setInterval) and calls `store.rebaseDocument`.
 * If rebase conflicts are detected, it applies automatic conflict resolution by preferring remote changes.
 *
 * @param params - Object with:
 *   - documentName: the name/key of the document to watch and rebase.
 *   - store: the WorkspaceStore instance.
 *
 * @example
 * ```ts
 * import { useDocumentWatcher } from '@/hooks/use-document-watcher'
 * import { useScalarWorkspaceStore } from '@scalar/workspace-store'
 *
 * const store = useScalarWorkspaceStore()
 * useDocumentWatcher({ documentName: 'myApi', store })
 * ```
 */
export const useDocumentWatcher = ({
  documentName,
  store,
  initialTimeout = 5000,
}: {
  documentName: MaybeRefOrGetter<string>
  store: WorkspaceStore
  initialTimeout?: number
}) => {
  let timeout = initialTimeout
  const document = computed(() => store.workspace.documents[toValue(documentName)])

  let interval: ReturnType<typeof setInterval> | null = null

  watch(
    [() => document.value?.['x-scalar-original-source-url'], () => document.value?.['x-scalar-watch-mode']],
    ([sourceUrl, watchMode]) => {
      // Clear any existing interval
      if (interval) {
        clearInterval(interval)
        interval = null
      }

      if (!sourceUrl || !watchMode) {
        // Reset initial timeout
        timeout = initialTimeout
        return
      }

      // Reset timeout on successful call
      const onSuccessfulCall = () => {
        timeout = initialTimeout
        if (interval) {
          clearInterval(interval)
          interval = null
        }
        interval = setInterval(poll, timeout)
      }

      const poll = async () => {
        const result = await store.rebaseDocument({
          name: toValue(documentName),
          url: sourceUrl,
        })

        if (result?.ok) {
          // On conflicts, prefers remote changes by automatically choosing the first option for each conflict tuple
          await result.applyChanges(result.conflicts.flatMap((conflictTuple) => conflictTuple[0]))

          onSuccessfulCall()
        } else if (result?.ok === false && result.type === 'NO_CHANGES_DETECTED') {
          // Its still a successful call, just nothing changed
          onSuccessfulCall()
        } else {
          timeout *= 2 // Exponential backoff on failure

          if (interval) {
            clearInterval(interval)
            interval = setInterval(poll, timeout)
          }
        }
      }

      // Poll the remote source every x seconds and attempt to rebase
      interval = setInterval(poll, timeout)
    },
    { immediate: true },
  )
}
