import { availableTargets as allTargets } from 'httpsnippet-lite'
import { computed, readonly, ref } from 'vue'

const DEFAULT_EXCLUDED_CLIENTS = ['fetch', 'unirest'] as const

const excludedClients = ref<string[]>([...DEFAULT_EXCLUDED_CLIENTS])

export function useSnippetTargets() {
  const availableTargets = computed(() =>
    allTargets().map((target) => {
      // Remove excluded clients
      target.clients = target.clients.filter(
        (client) => !excludedClients.value.includes(client.key),
      )

      // Node.js
      if (target.key === 'node') {
        target.default = 'undici'

        target.clients.unshift({
          description:
            'A browser-compatible implementation of the fetch() function.',
          key: 'fetch',
          link: 'https://nodejs.org/dist/latest/docs/api/globals.html#fetch',
          title: 'fetch',
        })

        target.clients.unshift({
          description: 'An HTTP/1.1 client, written from scratch for Node.js.',
          key: 'undici',
          link: 'https://github.com/nodejs/undici',
          title: 'undici',
        })
      }

      // JS
      if (target.key === 'javascript') {
        target.default = 'fetch'

        target.clients.unshift({
          description:
            'A browser-compatible implementation of the fetch() function.',
          key: 'fetch',
          link: 'https://nodejs.org/dist/latest/docs/api/globals.html#fetch',
          title: 'fetch',
        })
      }

      return target
    }),
  )

  return {
    availableTargets,
    excludedClients: readonly(excludedClients),
    setExcludedClients: (v: string[]) => (excludedClients.value = v),
  }
}
