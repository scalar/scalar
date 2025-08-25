import type { ClientOption, ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'
import type { AvailableClients } from '@scalar/snippetz'

/** Hard coded list of default featured clients */
const FEATURED_CLIENTS = [
  'shell/curl',
  'ruby/native',
  'node/undici',
  'php/guzzle',
  'python/python3',
] satisfies AvailableClients[number][]

/** Whether or not a client is in the featured list */
export const isFeaturedClient = (
  clientId: AvailableClients[number] | undefined,
  featuredClients: AvailableClients[number][] = FEATURED_CLIENTS,
) => Boolean(clientId && featuredClients.includes(clientId as (typeof featuredClients)[number]))

/**
 * Maps featured client IDs to their corresponding ClientOption objects.
 * Returns an array of ClientOption objects that match the featured clients list,
 * maintaining the order of the featured clients.
 */
export const getFeaturedClients = (
  clientOptions: ClientOptionGroup[],
  featuredClients: AvailableClients[number][] = FEATURED_CLIENTS,
): ClientOption[] => {
  // Create a map of all available client options for quick lookup
  const clientMap = new Map<string, ClientOption>()

  // Using the map means we only have to loop through once
  for (const group of clientOptions) {
    for (const option of group.options) {
      clientMap.set(option.id, option)
    }
  }

  // Map featured clients to their corresponding options, maintaining order
  return featuredClients.flatMap((clientId) => {
    const client = clientMap.get(clientId)
    return client ?? []
  })
}
