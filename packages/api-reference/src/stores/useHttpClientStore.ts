import { objectMerge } from '@scalar/oas-utils/helpers'
import { type TargetId, availableTargets as allTargets } from 'httpsnippet-lite'
import { type Ref, computed, reactive, readonly, ref } from 'vue'

import type { AvailableTarget, HiddenClients } from '../types'

// Gets the client title from the availableTargets
// { targetKey: 'shell', clientKey: 'curl' } -> 'Shell'
function getTargetTitle(client: HttpClientState) {
  return (
    availableTargets.value.find((target) => target.key === client.targetKey)
      ?.title ?? client.targetKey
  )
}

// Gets the client title from the availableTargets
// { targetKey: 'shell', clientKey: 'curl' } -> 'cURL'
function getClientTitle(client: HttpClientState) {
  return (
    availableTargets.value
      .find((target) => target.key === client.targetKey)
      ?.clients.find((item) => item.key === client.clientKey)?.title ??
    client.clientKey
  )
}

const httpTargetTitle = computed(() => {
  return getTargetTitle(httpClient)
})

const httpClientTitle = computed(() => {
  return getClientTitle(httpClient)
})

export function filterHiddenClients(
  targets: AvailableTarget[],
  exclude: Ref<HiddenClients>,
): AvailableTarget[] {
  // Just remove all clients
  if (exclude.value === true) {
    return []
  }

  return targets.flatMap((target: AvailableTarget) => {
    // Just to please TypeScript
    if (typeof exclude.value !== 'object') {
      return []
    }

    // NOTE: This is for backwards compatibility with the previous behavior,
    // If exclude is an array, it will exclude the matching clients from all targets.
    //
    // Example: ['fetch', 'xhr']
    if (Array.isArray(exclude.value)) {
      target.clients = target.clients.filter(
        // @ts-expect-error Typescript, chill. It’s all good. It has to be an array.
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

const availableTargets = computed<AvailableTarget[]>(() => {
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

export type HttpClientState = { targetKey: TargetId; clientKey: string }

const DEFAULT_EXCLUDED_CLIENTS = {
  node: ['unirest'],
} as HiddenClients

const excludedClients = ref<HiddenClients>({
  ...(DEFAULT_EXCLUDED_CLIENTS === true ? {} : DEFAULT_EXCLUDED_CLIENTS),
})

const defaultHttpClientState = (): HttpClientState => {
  // Check if available targets has shell/curl
  // If not, return the first available target
  const curlIsAvailable = availableTargets.value.find(
    (target) =>
      target.key === 'shell' &&
      target.clients.find((client) => client.key === 'curl'),
  )

  if (curlIsAvailable) {
    return {
      targetKey: 'shell',
      clientKey: 'curl',
    }
  }

  return {
    targetKey: availableTargets.value[0]?.key,
    clientKey: availableTargets.value[0]?.clients?.[0]?.key,
  }
}

const httpClient = reactive<HttpClientState>(defaultHttpClientState())

function resetState() {
  objectMerge(httpClient, defaultHttpClientState())
}

const setHttpClient = (newState: Partial<HttpClientState>) => {
  Object.assign(httpClient, {
    ...httpClient,
    ...newState,
  })
}

export const useHttpClientStore = () => ({
  httpClient: readonly(httpClient),
  resetState,
  setHttpClient,
  excludedClients: readonly(excludedClients) as Ref<HiddenClients>,
  setExcludedClients: (v: HiddenClients) => {
    // Update the excluded clients
    excludedClients.value = v

    // Reset the default state
    objectMerge(httpClient, defaultHttpClientState())
  },
  availableTargets,
  getClientTitle,
  getTargetTitle,
  httpTargetTitle,
  httpClientTitle,
})
