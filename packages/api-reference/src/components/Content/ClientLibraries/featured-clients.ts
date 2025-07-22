import type { ClientOption, ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'
import type { AvailableClients } from '@scalar/snippetz'

/** Hard coded list of default featured clients */
const FEATURED_CLIENTS = [
  'shell/curl',
  'ruby/native',
  'node/undici',
  'php/guzzle',
  'python/python3',
] as const satisfies AvailableClients[number][]

/** Whether or not a client is in the featured list */
export const isFeaturedClient = (clientId: AvailableClients[number] | undefined, featuredClients = FEATURED_CLIENTS) =>
  clientId && featuredClients.includes(clientId as (typeof featuredClients)[number])

/** Client option arry that matches the featured list */
export const getFeaturedClients = (
  clientOptions: ClientOptionGroup[],
  featuredClients = FEATURED_CLIENTS,
): ClientOption[] =>
  clientOptions.flatMap((option) => option.options.filter((option) => isFeaturedClient(option.id, featuredClients)))
