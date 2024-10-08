import { isHTTPMethod } from '@/components/HttpMethod'
import { useWorkspace } from '@/store'
import { specDictionary } from '@/store/import-spec'
import {
  combineRenameDiffs,
  diffToCollectionPayload,
  diffToRequestPayload,
  diffToSecuritySchemePayload,
  diffToServerPayload,
  diffToTagPayload,
  findResource,
} from '@/views/Request/libs/live-sync'
import {
  type Request,
  type RequestParameterPayload,
  type RequestPayload,
  requestSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import {
  createHash,
  fetchSpecFromUrl,
  schemaModel,
} from '@scalar/oas-utils/helpers'
import { parseSchema } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { useTimeoutPoll } from '@vueuse/core'
import microdiff from 'microdiff'
import { watch } from 'vue'

/** Live Sync polling timeout */
const FIVE_SECONDS = 5 * 1000

/**
 * Hook which handles polling the documentUrl for changes then attempts to merge what is new
 *
 * TODO:
 * - check lastModified or similar headers
 * - speed up the polling when there's a change then slowly slow it down
 * - ensure we upgrade the spec if required
 */
export const useLiveSync = () => {
  const {
    activeCollection,
    activeWorkspace,
    collectionMutators,
    requests,
    requestMutators,
    securitySchemes,
    securitySchemeMutators,
    servers,
    serverMutators,
    tags,
    tagMutators,
  } = useWorkspace()

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

      // Transform and apply the diffs to our mutators
      combined.forEach((d) => {
        console.log('=========')
        console.log(d)
        if (!d.path.length || !activeCollection.value?.uid) return

        // Info/Security
        if (d.path[0] === 'info' || d.path[0] === 'security') {
          const payload = diffToCollectionPayload(d, activeCollection.value)
          if (payload) collectionMutators.edit(...payload)
        }
        // Components.securitySchemes
        else if (
          d.path[0] === 'components' &&
          d.path[1] === 'securitySchemes'
        ) {
          const securitySchemePayload = diffToSecuritySchemePayload(
            d,
            activeCollection.value,
            securitySchemes,
          )
          if (securitySchemePayload) {
            const [method, ...payload] = securitySchemePayload
            securitySchemeMutators[method](...payload)
          }
        }
        // Servers
        else if (d.path[0] === 'servers') {
          const serverPayload = diffToServerPayload(
            d,
            activeCollection.value,
            servers,
          )
          if (serverPayload) {
            const [method, ...payload] = serverPayload
            serverMutators[method](...payload)
          }
        }
        // Tags
        else if (d.path[0] === 'tags') {
          const tagPayload = diffToTagPayload(d, tags, activeCollection.value)
          if (tagPayload) {
            const [method, ...payload] = tagPayload
            tagMutators[method](...payload)
          }
        }
        // Paths
        else if (d.path[0] === 'paths') {
          const requestPayloads = diffToRequestPayload(
            d,
            activeCollection.value,
            requests,
          )
          requestPayloads.forEach((rp) => {
            const [method, ...payload] = rp
            requestMutators[method](...payload)
          })
        }
      })

      // Update the dict
      specDictionary[url] = {
        hash,
        schema,
      }
    } else console.log('Live Sync: no changes detected yet...')
  }, FIVE_SECONDS)

  // Ensure we are only polling when we should liveSync
  watch(
    [
      () => activeCollection.value?.documentUrl,
      () => activeCollection.value?.liveSync,
    ],
    ([documentUrl, liveSync]) => {
      if (documentUrl && liveSync) {
        console.info('Live Sync: we are live!')
        resume()
      } else pause()
    },
    { immediate: true },
  )
}
