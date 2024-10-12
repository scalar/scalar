import { useWorkspace } from '@/store'
import { specDictionary } from '@/store/import-spec'
import {
  combineRenameDiffs,
  diffToCollectionPayload,
  diffToRequestPayload,
  diffToSecuritySchemePayload,
  diffToServerPayload,
  diffToTagPayload,
} from '@/views/Request/libs/live-sync'
import { createExampleFromRequest } from '@scalar/oas-utils/entities/spec'
import { createHash, fetchSpecFromUrl } from '@scalar/oas-utils/helpers'
import { parseSchema } from '@scalar/oas-utils/transforms'
import { useTimeoutPoll } from '@vueuse/core'
import microdiff, { type Difference } from 'microdiff'
import { watch } from 'vue'

/** Live Sync polling timeout */
const FIVE_SECONDS = 5 * 1000

/**
 * Hook which handles polling the documentUrl for changes then attempts to merge what is new
 *
 * TODO:
 * - check lastModified or similar headers
 * - speed up the polling when there's a change then slowly slow it down
 */
export const useOpenApiWatcher = () => {
  const {
    activeCollection,
    activeWorkspace,
    collectionMutators,
    requests,
    requestMutators,
    requestExamples,
    requestExampleMutators,
    securitySchemes,
    securitySchemeMutators,
    servers,
    serverMutators,
    tags,
    tagMutators,
  } = useWorkspace()

  // Transforms and applies the diff to our mutators
  const applyDiff = (d: Difference) => {
    if (!d.path.length || !activeCollection.value?.uid) return

    // Info/Security
    if (d.path[0] === 'info' || d.path[0] === 'security') {
      const payload = diffToCollectionPayload(d, activeCollection.value)
      if (payload) collectionMutators.edit(...payload)
    }
    // Components.securitySchemes
    else if (d.path[0] === 'components' && d.path[1] === 'securitySchemes') {
      const payload = diffToSecuritySchemePayload(
        d,
        activeCollection.value,
        securitySchemes,
      )

      if (payload?.method === 'add') securitySchemeMutators.add(...payload.args)
      else if (payload?.method === 'edit')
        securitySchemeMutators.edit(...payload.args)
      else if (payload?.method === 'delete')
        securitySchemeMutators.delete(...payload.args)
    }
    // Servers
    else if (d.path[0] === 'servers') {
      const payload = diffToServerPayload(d, activeCollection.value, servers)
      if (payload?.method === 'edit') serverMutators.edit(...payload.args)
      else if (payload?.method === 'add') serverMutators.add(...payload.args)
      else if (payload?.method === 'delete')
        serverMutators.delete(...payload.args)
    }
    // Tags
    else if (d.path[0] === 'tags') {
      const payload = diffToTagPayload(d, tags, activeCollection.value)
      if (payload?.method === 'edit') tagMutators.edit(...payload.args)
      else if (payload) tagMutators[payload.method](...payload.args)
    }
    // Paths
    else if (d.path[0] === 'paths') {
      const requestPayloads = diffToRequestPayload(
        d,
        activeCollection.value,
        requests,
      )

      requestPayloads.forEach((rp) => {
        const { method, args } = rp

        // Specially handle these cases for some reason
        if (args[1] === 'method')
          requestMutators.edit(args[0] as string, 'method', args[2])
        else if (args[1] === 'path')
          requestMutators.edit(args[0] as string, 'path', args[2])
        else if (method === 'edit') requestMutators.edit(...args)
        else requestMutators[method](...args)

        if (
          rp.method !== 'edit' ||
          (d.path[3] !== 'parameters' && d.path[3] !== 'requestBody')
        )
          return

        const requestUid = rp.args[0]
        const request = requests[requestUid]

        // V0 just generate a new example
        // V1 We can do some better diffing
        request?.examples.forEach((exampleUid) => {
          const newExample = createExampleFromRequest(
            request,
            requestExamples[exampleUid].name,
          )
          if (newExample)
            requestExampleMutators.set({
              ...newExample,
              uid: exampleUid,
            })
        })
      })
    }
  }

  const { pause, resume } = useTimeoutPoll(async () => {
    const url = activeCollection.value?.documentUrl
    if (!url) return

    const old = specDictionary[url]

    // Grab the new spec
    const spec = await fetchSpecFromUrl(
      url,
      activeWorkspace.value.proxyUrl,
      false,
    )
    const hash = createHash(spec)

    // If we have no previous copy then store this one
    if (!old?.hash) {
      const { schema } = await parseSchema(spec)

      if (schema)
        specDictionary[url] = {
          hash,
          schema,
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
    } else console.log('[useOpenApiWatcher] No changes detected yet…')
  }, FIVE_SECONDS)

  // Ensure we are only polling when we should watchForChanges
  watch(
    [
      () => activeCollection.value?.documentUrl,
      () => activeCollection.value?.watchForChanges,
    ],
    ([documentUrl, watchForChanges]) => {
      if (documentUrl && watchForChanges) {
        console.info(`[useOpenApiWatcher] Watching ${documentUrl} …`)
        resume()
      } else pause()
    },
    { immediate: true },
  )
}
