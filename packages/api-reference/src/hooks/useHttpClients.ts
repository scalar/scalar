import { availableTargets as allTargets } from 'httpsnippet-lite'
import { computed, readonly, ref } from 'vue'

const DEFAULT_EXCLUDED_CLIENTS = ['unirest'] as const

const excludedClients = ref<string[]>([...DEFAULT_EXCLUDED_CLIENTS])

// Move this out so it only gets run once
const targets = allTargets()
  .map((target) => {
    // Node.js
    if (target.key === 'node') {
      target.default = 'undici'

      target.clients.unshift({
        description: 'An HTTP/1.1 client, written from scratch for Node.js.',
        key: 'undici',
        link: 'https://github.com/nodejs/undici',
        title: 'undici',
      })
    }

    // Filter out excluded clients
    target.clients = target.clients.filter(
      (client) => !excludedClients.value.includes(client.key),
    )

    return target
  })
  .filter((target) => target.clients.length)

export function useHttpClients() {
  const availableTargets = computed(() => targets)

  return {
    availableTargets,
    excludedClients: readonly(excludedClients),
    setExcludedClients: (v: string[]) => (excludedClients.value = v),
  }
}
