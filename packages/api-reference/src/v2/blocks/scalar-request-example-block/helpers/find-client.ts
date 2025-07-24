import type { ClientOption, ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'
import { AVAILABLE_CLIENTS, type AvailableClients } from '@scalar/snippetz'

export const DEFAULT_CLIENT = 'shell/curl'

/** Type guard to check if a string is a valid client id */
export const isClient = (id: any): id is AvailableClients[number] => AVAILABLE_CLIENTS.includes(id)

/**
 * Finds and returns the appropriate client option from a list of client option groups.
 *
 * This function is used to determine which client should be initially selected in the
 * request example block. It prioritizes a specific client ID if provided, otherwise
 * falls back to the first available option.
 *
 * @param options - Array of client option groups, each containing a label and array of client options
 * @param id - Optional client identifier to search for (e.g., 'js/fetch', 'python/requests')

 * @returns The selected client option. If a specific ID is provided and found, returns that client.
 *          If the ID is not found or not provided, returns the first available client option.
 *
 * @example
 * ```typescript
 * const clientGroups = [
 *   {
 *     label: 'JavaScript',
 *     options: [
 *       { id: 'js/fetch', label: 'Fetch API', lang: 'js' },
 *       { id: 'js/axios', label: 'Axios', lang: 'js' }
 *     ]
 *   }
 * ]
 *
 * // Find specific client
 * const client = findClient(clientGroups, 'js/fetch')
 * // Returns: { id: 'js/fetch', label: 'Fetch API', lang: 'js' }
 *
 * // Find first available client
 * const firstClient = findClient(clientGroups)
 * // Returns: { id: 'js/fetch', label: 'Fetch API', lang: 'js' }
 * ```
 */
export const findClient = (
  clientGroups: ClientOptionGroup[],
  clientId?: AvailableClients[number] | undefined,
): ClientOption => {
  const firstOption = clientGroups[0]?.options[0]

  // Client ID is passed in
  if (clientId) {
    for (const group of clientGroups) {
      const option = group.options.find((option) => option.id === clientId)
      if (option) {
        return option
      }
    }
  }

  // If we dont have any custom examples, lets select the default client
  if (!firstOption?.id.startsWith('custom')) {
    for (const group of clientGroups) {
      const option = group.options.find((option) => option.id === DEFAULT_CLIENT)
      if (option) {
        return option
      }
    }
  }

  return firstOption
}
