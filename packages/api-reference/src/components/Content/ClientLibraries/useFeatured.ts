import { useHttpClientStore, type HttpClientState } from '@/stores'
import type { ClientId, Target } from '@scalar/snippetz'

export type FeaturedClient = { targetKey: Target['key']; clientKey: ClientId<Target['key']> }

export function useFeatured() {
  const { availableTargets } = useHttpClientStore()

  // Show popular clients with an icon, not just in a select.
  const featuredClients: FeaturedClient[] = (
    [
      {
        targetKey: 'shell',
        clientKey: 'curl',
      },
      {
        targetKey: 'ruby',
        clientKey: 'native',
      },
      {
        targetKey: 'node',
        clientKey: 'undici',
      },
      {
        targetKey: 'php',
        clientKey: 'guzzle',
      },
      {
        targetKey: 'python',
        clientKey: 'python3',
      },
    ] as const
  ).filter((featuredClient) =>
    availableTargets.value.find((target: Target) => {
      return (
        target.key === featuredClient.targetKey &&
        target.clients.find((client) => client.client === featuredClient.clientKey)
      )
    }),
  )

  const isFeatured = (client: HttpClientState) =>
    featuredClients.some((item) => item.targetKey === client.targetKey && item.clientKey === client.clientKey)

  return { featuredClients, isFeatured }
}
