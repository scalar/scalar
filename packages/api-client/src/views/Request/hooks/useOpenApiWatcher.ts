import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { specDictionary } from '@/store/import-spec'
import {
  combineRenameDiffs,
  mutateCollectionDiff,
  mutateRequestDiff,
  mutateSecuritySchemeDiff,
  mutateServerDiff,
  mutateTagDiff,
} from '@/views/Request/libs/watch-mode'
import { createHash, fetchDocument } from '@scalar/oas-utils/helpers'
import { parseSchema } from '@scalar/oas-utils/transforms'
import { useToasts } from '@scalar/use-toasts'
import { useTimeoutPoll } from '@vueuse/core'
import microdiff, { type Difference } from 'microdiff'
import { watch } from 'vue'

/** Timeout for the watch mode polling */
const POLLING_INTERVAL = 5 * 1000 // 5 seconds

/** Pause for 60 seconds after an error */
const ERROR_TIMEOUT = 60 * 1000 // 60 seconds

/**
 * Hook which handles polling the documentUrl for changes then attempts to merge what is new
 *
 * TODO:
 * - check lastModified or similar headers
 * - speed up the polling when there's a change then slowly slow it down
 */
export const useOpenApiWatcher = () => {
  const { toast } = useToasts()
  const activeEntities = useActiveEntities()
  const store = useWorkspace()

  const { activeCollection, activeWorkspace } = activeEntities
  const { collectionMutators } = store

  /** Little toast helper */
  const toastError = (type: string) => toast(`[useOpenApiWatcher] Changes to the ${type} were not applied`, 'error')

  // Transforms and applies the diff to our mutators
  const applyDiff = (d: Difference) => {
    // Info/Security
    if (d.path[0] === 'info' || d.path[0] === 'security') {
      const success = mutateCollectionDiff(d, activeEntities, store)
      if (!success) {
        toastError('collection')
      }
    }
    // Components.securitySchemes
    else if (d.path[0] === 'components' && d.path[1] === 'securitySchemes') {
      const success = mutateSecuritySchemeDiff(d, activeEntities, store)
      if (!success) {
        toastError('securitySchemes')
      }
    }
    // Servers
    else if (d.path[0] === 'servers') {
      const success = mutateServerDiff(d, activeEntities, store)
      if (!success) {
        toastError('servers')
      }
    }
    // Tags
    else if (d.path[0] === 'tags') {
      const success = mutateTagDiff(d, activeEntities, store)
      if (!success) {
        toastError('tags')
      }
    }
    // Requests
    else if (d.path[0] === 'paths') {
      const success = mutateRequestDiff(d, activeEntities, store)
      if (!success) {
        toastError('requests')
      }
    }
  }

  const { pause, resume } = useTimeoutPoll(async () => {
    const url = activeCollection.value?.documentUrl
    if (!url) {
      return
    }

    const old = specDictionary[url]

    try {
      // Grab the new spec
      const spec = await fetchDocument(url, activeWorkspace.value?.proxyUrl, false)
      const hash = createHash(spec)

      collectionMutators.edit(activeCollection.value.uid, 'watchModeStatus', 'WATCHING')

      // If we have no previous copy then store this one
      if (!old?.hash) {
        const { schema } = await parseSchema(spec)

        if (schema) {
          specDictionary[url] = {
            hash,
            schema,
          }
        }
      }
      // If the hashes do not match, start diffin
      else if (old.hash && old.hash !== hash) {
        const { schema } = await parseSchema(spec)
        const diff = microdiff(old.schema, schema)

        // Combines add/remove diffs into single rename diffs
        const combined = combineRenameDiffs(diff)

        try {
          // Transform and apply the diffs to our mutators
          combined.forEach(applyDiff)

          // Update the dict
          specDictionary[url] = {
            hash,
            schema,
          }
        } catch (e) {
          console.error('[useOpenApiWatcher] Error:', e)
        }
      } else {
        console.log('[useOpenApiWatcher] No changes detected yet…')
      }
    } catch (e) {
      console.error('[useOpenApiWatcher] Error:', e)
      console.info('[useOpenApiWatcher] Pausing watcher for 60 seconds')

      pause()
      collectionMutators.edit(activeCollection.value.uid, 'watchModeStatus', 'ERROR')
      toast('[useOpenApiWatcher] Unable to fetch the spec file, paused the watcher for 60 seconds', 'error')

      setTimeout(() => {
        console.info('[useOpenApiWatcher] Resuming watcher')
        resume()
      }, ERROR_TIMEOUT)
    }
  }, POLLING_INTERVAL)

  // Ensure we are only polling when we should watchMode
  watch(
    [() => activeCollection.value?.documentUrl, () => activeCollection.value?.watchMode],
    ([documentUrl, watchMode]) => {
      if (documentUrl && watchMode) {
        console.info(`[useOpenApiWatcher] Watching ${documentUrl} …`)
        resume()
      } else if (activeCollection.value) {
        pause()
        collectionMutators.edit(activeCollection.value.uid, 'watchModeStatus', 'IDLE')
      }
    },
    { immediate: true },
  )
}
