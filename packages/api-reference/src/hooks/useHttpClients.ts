import { availableTargets as allTargets } from 'httpsnippet-lite'
import type { AvailableTarget } from 'httpsnippet-lite/dist/types/helpers/utils'
import { type Ref, computed, readonly, ref } from 'vue'

import type { HiddenClients } from '../types'

const DEFAULT_EXCLUDED_CLIENTS = {
  node: ['unirest'],
} as HiddenClients

const excludedClients = ref<HiddenClients>({
  ...DEFAULT_EXCLUDED_CLIENTS,
})

export function filterHiddenClients(
  targets: AvailableTarget[],
  exclude: Ref<HiddenClients>,
): AvailableTarget[] {
  return targets.flatMap((target: AvailableTarget) => {
    // NOTE: This is for backwards compatibility with the previous behavior,
    // If exclude is an array, it will exclude the matching clients from all targets.
    //
    // Example: ['fetch', 'xhr']
    if (Array.isArray(exclude.value)) {
      target.clients = target.clients.filter(
        // @ts-expect-error We checked whether it’s an Array already.
        (client) => !exclude.value.includes(client.key),
      )

      return [target]
    }

    // Determine if the whole target (language) is to be excluded
    // Example: { node: true }
    if (exclude.value[target.key] === true) {
      return []
    }

    // Filter out excluded clients within the target
    // Example: { node: ['fetch', 'xhr'] }
    if (Array.isArray(exclude.value[target.key])) {
      target.clients = target.clients.filter((client) => {
        return !(
          // @ts-expect-error We checked whether it’s an Array already.
          exclude.value[target.key].includes(client.key)
        )
      })
    }

    // Remove targets that don’t have any clients left
    if (!target?.clients?.length) {
      return []
    }

    return [target]
  })
}

const availableTargets = computed(() => {
  const targets = allTargets()

  // Add undici to node (comes from @scalar/snippetz)
  targets
    .find((target) => target.key === 'node')
    ?.clients.unshift({
      description: 'An HTTP/1.1 client, written from scratch for Node.js.',
      key: 'undici',
      link: 'https://github.com/nodejs/undici',
      title: 'undici',
    })

  return filterHiddenClients(targets, excludedClients)
})

export function useHttpClients() {
  return {
    availableTargets,
    excludedClients: readonly(excludedClients),
    setExcludedClients: (v: HiddenClients) => (excludedClients.value = v),
  }
}
