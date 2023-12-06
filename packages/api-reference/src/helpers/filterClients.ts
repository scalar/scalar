import type { ClientInfo } from 'httpsnippet-lite/dist/types/targets/targets'

/**
 * We want to filter out some of the clients, that seem to be outdated.
 */
export const filterClients = (client: ClientInfo) => {
  return !['fetch', 'unirest'].includes(client.key)
}
