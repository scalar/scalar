import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'
import type { XCodeSample } from '@scalar/openapi-types/schemas/extensions'
import { snippetz, type AvailableClients } from '@scalar/snippetz'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { capitalize } from 'vue'

/** Helper to generate an ID for custom code samples */
export const generateCustomId = (example: XCodeSample) => `custom/${example.lang}`

/**
 * Generates client options for the request example block by filtering and organizing
 * built-in snippets based on the hiddenClients configuration. This function creates
 * a structured list of available client options that can be used to generate code
 * examples for different programming languages and frameworks.
 *
 * The function filters built-in clients based on the hiddenClients parameter and
 * groups them by their category (e.g., JavaScript, Python, etc.). The hiddenClients
 * parameter supports multiple formats:
 * - boolean: true to hide all clients
 * - array: ['fetch', 'axios'] to hide specific clients across all categories
 * - object: { node: true, python: ['requests'] } to hide entire categories or specific clients within categories
 */
export const generateClientOptions = (
  hiddenClients: ApiReferenceConfiguration['hiddenClients'],
): ClientOptionGroup[] => {
  if (hiddenClients === true) {
    return []
  }

  const options = snippetz()
    .clients()
    .flatMap((group) => {
      const options = group.clients.flatMap((plugin) => {
        const id = `${group.key}/${plugin.client}` as AvailableClients[number]

        // Hide specific clients across all categories
        // ex: hiddenClients: ['fetch', 'axios']
        if (Array.isArray(hiddenClients) && hiddenClients.includes(plugin.client)) {
          return []
        }

        if (typeof hiddenClients === 'object' && hiddenClients !== null) {
          const groupConfig = hiddenClients[group.key as keyof typeof hiddenClients]

          // Hide entire category if value is true
          // ex: hiddenClients: { node: true, python: true }
          if (groupConfig === true) {
            return []
          }

          // Hide specific clients within category if value is an array
          // ex: hiddenClients: { node: ['fetch', 'axios'], js: ['fetch'] }
          if (Array.isArray(groupConfig) && groupConfig.includes(plugin.client)) {
            return []
          }
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
