import { AVAILABLE_CLIENTS, type AvailableClients, snippetz } from '@scalar/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import { capitalize } from 'vue'

import type { ClientOptionGroup } from '@/v2/blocks/operation-code-sample/types'

/** Type of custom code sample IDs */
export type CustomCodeSampleId = `custom/${string}`

/** Helper to generate an ID for custom code samples */
export const generateCustomId = (example: XCodeSample): CustomCodeSampleId => `custom/${example.lang}`

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
        options,
      }
    })

  return options
}
