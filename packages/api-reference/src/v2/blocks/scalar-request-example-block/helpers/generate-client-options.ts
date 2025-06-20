import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'
import type { XCodeSample } from '@scalar/openapi-types/schemas/extensions'
import { snippetz, type AvailableClients, type TargetId } from '@scalar/snippetz'
import { capitalize } from 'vue'

/** Helper to generate an ID for custom code samples */
export const generateCustomId = (example: XCodeSample) => `custom/${example.lang}`

/**
 * Generates client options for the request example block by combining built-in snippets
 * with custom code samples. This function creates a structured list of available
 * client options that can be used to generate code examples for different programming
 * languages and frameworks.
 *
 * The function filters built-in clients based on the allowedClients parameter and
 * groups them by their category (e.g., JavaScript, Python, etc.). Custom code samples
 * are added as a separate "Code Examples" group at the top of the list.
 *
 * @param customRequestExamples - Array of custom code samples to include in the options
 * @param allowedClients - Optional array of allowed client IDs to filter built-in clients
 * @returns Array of client option groups, each containing a label and array of client options
 */
export const generateClientOptions = (
  customRequestExamples: XCodeSample[],
  allowedClients?: AvailableClients[number][],
): ClientOptionGroup[] => {
  const options = snippetz()
    .clients()
    .flatMap((group) => {
      const options = group.clients.flatMap((plugin) => {
        const id = `${group.key}/${plugin.client}`

        // Filter out clients that are not in the allowed list
        if (allowedClients && !allowedClients.includes(id as AvailableClients[number])) {
          return []
        }

        return {
          id,
          lang: plugin.client === 'curl' ? ('curl' as const) : group.key,
          title: `${capitalize(group.title)} ${plugin.title}`,
          label: plugin.title,
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

  /** Generate options for any custom code samples */
  const customClients = customRequestExamples.map((sample) => {
    const id = generateCustomId(sample)
    const label = sample.label || sample.lang || id

    return {
      id,
      lang: (sample.lang as TargetId) || 'plaintext',
      title: label,
      label,
    }
  })

  // Add our custom clients to the top of the list
  if (customClients.length > 0) {
    options.unshift({
      label: 'Code Examples',
      options: customClients,
    })
  }

  return options
}
