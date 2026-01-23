import { objectKeys } from '@scalar/helpers/object/object-keys'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { AvailableClient, TargetId } from '@scalar/types/snippetz'
import { AVAILABLE_CLIENTS, type AvailableClients, GROUPED_CLIENTS } from '@scalar/types/snippetz'

/**
 * Map the old hiddenClients config to the new httpClients config.
 * Filters out clients based on the configuration and returns the remaining clients.
 */
export const mapHiddenClientsConfig = (hiddenClients: ApiReferenceConfiguration['hiddenClients']): AvailableClients => {
  // Early return for boolean true - hide all clients
  if (hiddenClients === true) {
    return []
  }

  // Early return for falsy values or empty arrays - show all clients
  if (!hiddenClients || (Array.isArray(hiddenClients) && hiddenClients.length === 0)) {
    return AVAILABLE_CLIENTS
  }

  // Start with all clients visible and remove hidden ones
  const visibleClientsSet = new Set<AvailableClient>(AVAILABLE_CLIENTS)

  // Handle array config: ['js/fetch', 'js/axios', 'java', 'fetch', 'axios']
  if (Array.isArray(hiddenClients)) {
    for (const item of hiddenClients) {
      // Check if item is a target group first
      const group = GROUPED_CLIENTS[item as TargetId]

      // Item is a target group (e.g., 'java', 'ruby') - hide all clients in the group
      if (group) {
        for (const client of group) {
          visibleClientsSet.delete(`${item}/${client}` as AvailableClient)
        }
      }

      // Item is a full client ID (e.g., 'js/fetch') - hide this specific client
      else if (item.includes('/')) {
        visibleClientsSet.delete(item as AvailableClient)
      }

      // Item is a client name suffix (e.g., 'fetch', 'axios') - hide all matching clients
      else {
        for (const language of objectKeys(GROUPED_CLIENTS)) {
          visibleClientsSet.delete(`${language}/${item}` as AvailableClient)
        }
      }
    }
  }

  // Handle object config: { node: true, python: ['requests'] }
  else if (typeof hiddenClients === 'object') {
    for (const [targetId, clients] of Object.entries(hiddenClients)) {
      if (clients === true) {
        // Hide all clients for this target
        const group = GROUPED_CLIENTS[targetId as TargetId]
        if (group) {
          for (const client of group) {
            visibleClientsSet.delete(`${targetId}/${client}` as AvailableClient)
          }
        }
      } else if (Array.isArray(clients)) {
        // Hide specific clients for this target
        for (const client of clients) {
          // Try both formats: 'fetch' and 'js/fetch'
          visibleClientsSet.delete(client as AvailableClient)
          visibleClientsSet.delete(`${targetId}/${client}` as AvailableClient)
        }
      }
    }
  }

  return Array.from(visibleClientsSet)
}
