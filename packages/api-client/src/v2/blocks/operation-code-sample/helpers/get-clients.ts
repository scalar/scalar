import type { TargetId } from '@scalar/types/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'

import type { ClientOption, ClientOptionGroup } from '@/v2/blocks/operation-code-sample'
import { generateCustomId } from '@/v2/blocks/operation-code-sample/helpers/generate-client-options'

/**
 * Merges custom code samples with the client options
 *
 * @param customCodeSamples - The custom code samples from the operation to merge with the client options
 * @param clientOptions - The client options to merge with the custom code samples
 * @returns A list of client option groups
 */
export const getClients = (
  customCodeSamples: XCodeSample[],
  clientOptions: ClientOptionGroup[],
): ClientOptionGroup[] => {
  // Handle custom code examples
  if (customCodeSamples.length) {
    const customClients = customCodeSamples.map((sample) => {
      const id = generateCustomId(sample)
      const label = sample.label || sample.lang || id

      return {
        id,
        lang: (sample.lang as TargetId) || 'plaintext',
        title: label,
        label,
      } as ClientOption // We yolo assert this as the other properties are only needed in the top selector
    })

    return [
      {
        label: 'Code Examples',
        options: customClients,
      },
      ...clientOptions,
    ]
  }

  return clientOptions
}
