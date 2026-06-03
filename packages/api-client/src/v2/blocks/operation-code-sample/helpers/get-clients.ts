import type { TargetId } from '@scalar/types/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'

import type { ClientOptionGroup, CustomClientOption } from '@/v2/blocks/operation-code-sample'
import { generateCustomId } from '@/v2/blocks/operation-code-sample/helpers/generate-client-options'
import { CODE_EXAMPLES_GROUP_LABEL } from '@/v2/blocks/operation-code-sample/helpers/get-custom-code-samples'
import type { CustomClientOptionGroup } from '@/v2/blocks/operation-code-sample/types'

/**
 * Merges custom code samples with the client options
 *
 * @param customCodeSamples - The custom code samples from the operation to merge with the client options
 * @param clientOptions - The client options to merge with the custom code samples
 * @param label - The label for the custom samples group (e.g. "SDK" or "Code Examples")
 * @returns A list of client option groups
 */
export const getClients = (
  customCodeSamples: XCodeSample[],
  clientOptions: ClientOptionGroup[],
  label: string = CODE_EXAMPLES_GROUP_LABEL,
): CustomClientOptionGroup[] => {
  // Handle custom code examples
  if (customCodeSamples.length) {
    const customClients = customCodeSamples.map((sample, index) => {
      const id = generateCustomId(index)
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
        label,
        key: 'custom',
        options: customClients,
      },
      ...clientOptions,
    ]
  }

  return clientOptions
}
