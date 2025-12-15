import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { AvailableClient, TargetId } from '@scalar/types/snippetz'
import { AVAILABLE_CLIENTS, type AvailableClients, GROUPED_CLIENTS } from '@scalar/types/snippetz'

/** Map the old hiddenClients config to the new httpClients config */
export const mapHiddenClientsConfig = (hiddenClients: ApiReferenceConfiguration['hiddenClients']): AvailableClients => {
  const clientsSet = new Set(AVAILABLE_CLIENTS)

  // Handle array config
  // hiddenClients: ['js/fetch', 'js/axios', 'java']
  if (Array.isArray(hiddenClients)) {
    hiddenClients.forEach((client) => {
      const group = GROUPED_CLIENTS[client as TargetId]

      // If we have a group, delete all clients in the group
      if (group) {
        group.forEach((client) => {
          clientsSet.delete(client as AvailableClient)
        })
      }
      // Otherwise just delete the client
      else {
        clientsSet.delete(client as AvailableClient)
      }
    })

    return Array.from(clientsSet)
  }

  // Handle object config
  // hiddenClients: { node: true, python: ['requests'] }
  if (typeof hiddenClients === 'object' && hiddenClients !== null) {
    Object.entries(hiddenClients).forEach(([targetId, clients]) => {
      // Array
      if (Array.isArray(clients)) {
        clients.forEach((client) => {
          // 'js/fetch'
          clientsSet.delete(client as AvailableClient)
          // 'fetch
          clientsSet.delete(`${targetId}/${client}` as AvailableClient)
        })
      }

      // Boolean
      if (clients === true) {
        GROUPED_CLIENTS[targetId as TargetId].forEach((client) => {
          clientsSet.delete(client as AvailableClient)
        })
      }
    })
  }

  // Handle boolean config
  if (hiddenClients === true) {
    return []
  }

  return Array.from(clientsSet)
}
