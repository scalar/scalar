import type { TargetId } from 'httpsnippet-lite'
import { computed, reactive, readonly } from 'vue'

import { objectMerge } from '../helpers'
import { useHttpClients } from '../hooks'

export type HttpClientState = { targetKey: TargetId; clientKey: string }

const defaultHttpClientState = (): HttpClientState => ({
  targetKey: 'shell',
  clientKey: 'curl',
})

const httpClient = reactive<HttpClientState>(defaultHttpClientState())

function resetState() {
  objectMerge(httpClient, defaultHttpClientState())
}

// Gets the client title from the availableTargets
// { targetKey: 'shell', clientKey: 'curl' } -> 'Shell'
function getTargetTitle(client: HttpClientState) {
  const { availableTargets } = useHttpClients()

  return (
    availableTargets.value.find((target) => target.key === client.targetKey)
      ?.title ?? client.targetKey
  )
}

// Gets the client title from the availableTargets
// { targetKey: 'shell', clientKey: 'curl' } -> 'cURL'
function getClientTitle(client: HttpClientState) {
  const { availableTargets } = useHttpClients()

  return (
    availableTargets.value
      .find((target) => target.key === client.targetKey)
      ?.clients.find((item) => item.key === client.clientKey)?.title ??
    client.clientKey
  )
}

const setHttpClient = (newState: Partial<HttpClientState>) => {
  Object.assign(httpClient, {
    ...httpClient,
    ...newState,
  })
}

const httpTargetTitle = computed(() => {
  return getTargetTitle(httpClient)
})

const httpClientTitle = computed(() => {
  return getClientTitle(httpClient)
})

export const useHttpClientStore = () => ({
  httpClient: readonly(httpClient),
  resetState,
  setHttpClient,
  httpTargetTitle,
  httpClientTitle,
  getClientTitle,
  getTargetTitle,
})
