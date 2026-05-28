import { AVAILABLE_CLIENTS, type AvailableClients, snippetz } from '@scalar/snippetz'
import { capitalize } from 'vue'

import type { ClientOptionGroup } from '@/v2/blocks/operation-code-sample/types'

/** Type of custom code sample IDs */
export type CustomCodeSampleId = `custom/${string}`

/**
 * Generate a unique ID for a custom code sample.
 *
 * The ID is keyed by the sample's position in the operation's code samples, so multiple
 * samples that share the same `lang` (e.g. separate sync and async examples) stay
 * individually selectable.
 */
export const generateCustomId = (index: number): CustomCodeSampleId => `custom/${index}`

/**
 * Generate client options for the request example block by filtering by allowed clients
 *
 * @param allowedClients - The list of allowed clients to include in the options
 * @returns A list of client option groups
 */
export const generateClientOptions = (allowedClients: AvailableClients = AVAILABLE_CLIENTS): ClientOptionGroup[] => {
  /** Create set of allowlist for quicker lookups */
  const allowedClientsSet = new Set(allowedClients)

  const options = snippetz()
    .clients()
    .flatMap((group) => {
      const options = group.clients.flatMap((plugin) => {
        const id = `${group.key}/${plugin.client}` as AvailableClients[number]

        // If the client is not allowed, skip it
        if (!allowedClientsSet.has(id)) {
          return []
        }

        return {
          id,
          lang: plugin.client === 'curl' ? ('curl' as const) : group.key,
          title: `${capitalize(group.title)} ${plugin.title}`,
          label: plugin.title,
          targetKey: group.key,
          targetTitle: group.title,
          clientKey: plugin.client,
        }
      })

      // If no clients are allowed, skip this group
      if (options.length === 0) {
        return []
      }

      return {
        label: group.title,
        key: group.key,
        options,
      }
    })

  return options
}
