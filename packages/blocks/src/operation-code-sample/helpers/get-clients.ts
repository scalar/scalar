import type { TargetId } from '@scalar/types/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'

import type { ClientOptionGroup, CustomClientOption } from '@/v2/blocks/operation-code-sample'
import { generateCustomId } from '@/v2/blocks/operation-code-sample/helpers/generate-client-options'
import type { CustomClientOptionGroup } from '@/v2/blocks/operation-code-sample/types'

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
): CustomClientOptionGroup[] => {
  // Handle custom code examples
  if (customCodeSamples.length) {
    const customClients = customCodeSamples.map((sample) => {
      const id = generateCustomId(sample)
      const label = sample.label || sample.lang || id
      const lang = (sample.lang as TargetId) || 'plaintext'

      return {
        id,
        lang,
        title: label,
        label,
        clientKey: 'custom',
      } satisfies CustomClientOption
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
