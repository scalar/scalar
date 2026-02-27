import { type AvailableClients } from '@scalar/snippetz'
import type { ClientOption, CustomClientOption, CustomClientOptionGroup } from '../types'
export declare const DEFAULT_CLIENT = 'shell/curl'
/** Type guard to check if a string is a valid client id */
export declare const isClient: (id: any) => id is AvailableClients[number]
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
export declare const findClient: (
  clientGroups: CustomClientOptionGroup[],
  clientId?: AvailableClients[number] | undefined,
) => ClientOption | CustomClientOption | undefined
//# sourceMappingURL=find-client.d.ts.map
