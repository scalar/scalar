import { useWorkspace } from '@/store'
import { specDictionary } from '@/store/import-spec'
import { diffSpec } from '@scalar/oas-utils/diff'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { createHash, fetchSpecFromUrl } from '@scalar/oas-utils/helpers'
import { parseSchema } from '@scalar/oas-utils/transforms'
import { getNestedValue } from '@scalar/object-utils/nested'
import { useTimeoutPoll } from '@vueuse/core'
import { watch } from 'vue'

/**
 * Hook which handles polling the documentUrl for changes then attempts to merge what is new
 *
 * Currently we will hash the
 */
export const useLiveSync = () => {
  const { activeCollection, activeWorkspace, collectionMutators } =
    useWorkspace()

  /** Live Sync polling timeout */
  const FIFTEEN_SECONDS = 5 * 1000

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

      const diff = diffSpec(old.schema, schema)

      Object.values(diff ?? {}).forEach((d) => {
        const { path, type, mutations, value } = d
        if (!path.length || !activeCollection.value?.uid) return

        console.log(mutations.length)

        // Info
        if (path[0] === 'info' && (type === 'delete' || type === 'add')) {
          const key = path.pop()
          if (!key) return

          // TODO: remove these any before PR merge
          let payload: any = value
          const propertyPath: any = path.join('.')

          // Destructure to remove the property from the object
          if (type === 'delete') {
            const { [key]: deleteMe, ...rest } = getNestedValue(
              activeCollection.value,
              propertyPath,
            )
            payload = rest
          }
          // Add the property to the payload
          else {
            payload[key] = value
          }

          if (payload)
            collectionMutators.edit(
              activeCollection.value?.uid,
              propertyPath,
              payload,
            )
        }
      })
      console.log({ diff })
    } else console.log('nothing to see here')
  }, FIFTEEN_SECONDS)

  // Ensure we are only polling when we should liveSync
  watch(
    [
      () => activeCollection.value?.documentUrl,
      () => activeCollection.value?.liveSync,
    ],
    ([documentUrl, liveSync]) => {
      if (documentUrl && liveSync) resume()
      else pause()
    },
    { immediate: true },
  )
}
