import { availableTargets as allTargets } from 'httpsnippet-lite'
import type { AvailableTarget } from 'httpsnippet-lite/dist/types/helpers/utils'
import { type Ref, computed, readonly, ref, watchEffect } from 'vue'

import type { HiddenClients } from '../types'

const DEFAULT_EXCLUDED_CLIENTS = {
  node: ['unirest'],
} as HiddenClients

const excludedClients = ref<HiddenClients>({
  ...DEFAULT_EXCLUDED_CLIENTS,
})

// Use a reactive reference for caching the computed targets
const cachedTargets = ref<AvailableTarget[]>([])

// Watch for changes in excludedClients and update the cachedTargets accordingly
watchEffect(() => {
  const targets = allTargets()

  // Add undici to node (@scalar/snippetz)
  targets
    .find((target) => target.key === 'node')
    ?.clients.unshift({
      description: 'An HTTP/1.1 client, written from scratch for Node.js.',
      key: 'undici',
      link: 'https://github.com/nodejs/undici',
      title: 'undici',
    })

  cachedTargets.value = filterHiddenClients(targets, excludedClients)
})

export function filterHiddenClients(
  targets: AvailableTarget[],
  exclude: Ref<HiddenClients>,
): AvailableTarget[] {
  // @ts-expect-error We checked whether it has content already.
  return (
    targets
      // Remove all targets that are excluded (`node: false`)
      .filter((target) => {
        // Make sure it’s object with `target.key` as an index
        if (Array.isArray(exclude.value)) {
          return true
        }

        return !(exclude.value[target.key] === true)
      })
      // Remove all clients that are excluded (`node: ['fetch']`)
      .map((target: AvailableTarget) => {
        // NOTE: This is for backwards compatibility with the previous behavior,
        //  If exclude is an array, it will exclude the matching clients from all targets.
        // Example: { node: ['fetch', 'xhr'] }
        if (Array.isArray(exclude.value)) {
          target.clients = target.clients.filter(
            // @ts-expect-error We checked whether it’s an Array already.
            (client) => !exclude.value.includes(client.key),
          )

          return target
        }

        // Determine if the whole target (language) is to be excluded
        // Example: { node: true }
        if (exclude.value[target.key] === true) {
          return null // Exclude the entire target by returning null
        }

        // Filter out excluded clients within the target
        if (Array.isArray(exclude.value[target.key])) {
          target.clients = target.clients.filter((client) => {
            return !(
              // @ts-expect-error We checked whether it’s an Array already.
              exclude.value[target.key].includes(client.key)
            )
          })
        }

        return target
      })
      .filter((target) => target?.clients?.length)
  )
}

export function useHttpClients() {
  // Use computed to provide a reactive interface to the cached targets
  const availableTargets = computed(() => cachedTargets.value)

  return {
    availableTargets,
    excludedClients: readonly(excludedClients),
    setExcludedClients: (v: HiddenClients) => (excludedClients.value = v),
  }
}
