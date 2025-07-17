import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import { objectReplace } from '@scalar/helpers/object/object-replace'
import { snippetz } from '@scalar/snippetz'
import type { HiddenClients } from '@scalar/types/legacy'
import type { Target, TargetId } from '@scalar/types/snippetz'
import { type Ref, computed, reactive, readonly, ref } from 'vue'

const FALLBACK_HTTP_CLIENT: HttpClientState = {
  targetKey: 'shell',
  clientKey: 'curl',
}

const { clients } = snippetz()

/**
 * Gets the client title from the availableTargets
 * { targetKey: 'shell', clientKey: 'curl' } -> 'Shell'
 */
function getTargetTitle(client: HttpClientState) {
  return availableTargets.value.find((target) => target.key === client.targetKey)?.title ?? client.targetKey
}

/**
 * Gets the client title from the availableTargets
 * { targetKey: 'shell', clientKey: 'curl' } -> 'cURL'
 */
function getClientTitle(client: HttpClientState) {
  return (
    availableTargets.value
      .find((target) => target.key === client.targetKey)
      ?.clients.find((item) => item.client === client.clientKey)?.title ?? client.clientKey
  )
}

/** Human-readable title for the selected language */
const httpTargetTitle = computed(() => {
  return getTargetTitle(httpClient)
})

/** Humand-readable title for the selected client */
const httpClientTitle = computed(() => {
  return getClientTitle(httpClient)
})

/**
 * Filters out hidden clients from the available targets (based on the given configuration).
 */
export function filterHiddenClients(targets: Target[], exclude: Ref<HiddenClients>): Target[] {
  // Just remove all clients
  if (exclude.value === true) {
    return []
  }

  return targets.flatMap((target: Target) => {
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
        // @ts-expect-error Typescript, chill. It's all good. It has to be an array.
        (client) => !exclude.value.includes(client.client),
      )
      // Remove targets that don't have any clients left
      if (!target.clients.length) {
        return []
      }
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
          // @ts-expect-error We checked whether it's an Array already.
          exclude.value[target.key].includes(client.client)
        )
      })
    }

    // Remove targets that don't have any clients left
    if (!target?.clients?.length) {
      return []
    }

    return [target]
  })
}

/**
 * Get all available targets with the hidden clients filtered out
 */
const availableTargets = computed<Target[]>(() => {
  return filterHiddenClients(clients(), excludedClients)
})

/** The selected HTTP client */
export type HttpClientState = { targetKey: TargetId; clientKey: string }

const excludedClients = ref<HiddenClients>({})

const defaultHttpClient = ref<HttpClientState>()

function setDefaultHttpClient(httpClient?: HttpClientState) {
  if (httpClient === undefined) {
    return
  }

  defaultHttpClient.value = httpClient
  setHttpClient(getDefaultHttpClient())
}

/** Determine the default HTTP Client */
const getDefaultHttpClient = (): HttpClientState => {
  // Check the configured HTTPcClient
  if (isClientAvailable(defaultHttpClient.value)) {
    return defaultHttpClient.value
  }

  // Check the defined fallback HTTP client
  if (isClientAvailable(FALLBACK_HTTP_CLIENT)) {
    return FALLBACK_HTTP_CLIENT
  }

  // Just use the first available client
  return {
    targetKey: availableTargets.value[0]?.key,
    clientKey: availableTargets.value[0]?.clients?.[0]?.client,
  }
}

/** Look for the given HTTP client in the list of available clients */
function isClientAvailable(httpClient?: HttpClientState): httpClient is HttpClientState {
  if (httpClient === undefined) {
    return false
  }

  return !!availableTargets.value.find(
    (target) =>
      target.key === httpClient.targetKey && target.clients.find((client) => client.client === httpClient.clientKey),
  )
}

function resetState() {
  objectReplace(httpClient, getDefaultHttpClient())
}

const httpClient = reactive<HttpClientState>(getDefaultHttpClient())

/** Update the selected HTTP client */
const setHttpClient = (newState: Partial<HttpClientState>) => {
  Object.assign(httpClient, {
    ...httpClient,
    ...newState,
  })

  // Save to localStorage
  safeLocalStorage().setItem(REFERENCE_LS_KEYS.SELECTED_CLIENT, JSON.stringify(httpClient))
}

/** Keep track of the available and the selected HTTP client(s) */
export const useHttpClientStore = () => {
  return {
    httpClient: readonly(httpClient),
    resetState,
    setHttpClient,
    setDefaultHttpClient,
    excludedClients: readonly(excludedClients) as Ref<HiddenClients>,
    setExcludedClients: (v: HiddenClients) => {
      // Update the excluded clients
      excludedClients.value = v

      // Reset the default state
      objectReplace(httpClient, getDefaultHttpClient())
    },
    availableTargets,
    getClientTitle,
    getTargetTitle,
    httpTargetTitle,
    httpClientTitle,
  }
}
