import { availableTargets as allTargets } from 'httpsnippet-lite'
import { computed, readonly, ref, watchEffect } from 'vue'

const DEFAULT_EXCLUDED_CLIENTS = ['unirest'] as const

const excludedClients = ref<string[]>([...DEFAULT_EXCLUDED_CLIENTS])

// Use a reactive reference for caching the computed targets
const cachedTargets = ref([])

// Watch for changes in excludedClients and update the cachedTargets accordingly
watchEffect(() => {
  cachedTargets.value = allTargets()
    .map((target) => {
      // Filter out excluded clients
      target.clients = target.clients.filter(
        (client) => !excludedClients.value.includes(client.key),
      )

      return target
    })
    .filter((target) => target.clients.length)
})

export function useHttpClients() {
  // Use computed to provide a reactive interface to the cached targets
  const availableTargets = computed(() => cachedTargets.value)

  return {
    availableTargets,
    excludedClients: readonly(excludedClients),
    setExcludedClients: (v: string[]) => (excludedClients.value = v),
  }
}
