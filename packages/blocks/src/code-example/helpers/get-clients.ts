import type { TargetId } from '@scalar/types/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'

import type { ClientOptionGroup, CustomClientOption, CustomClientOptionGroup } from '../types'
import { formatLanguage } from './format-language'
import { getCustomClientIds } from './generate-client-options'
import { CODE_EXAMPLES_GROUP_LABEL } from './get-custom-code-samples'

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
  if (!customCodeSamples.length) {
    return clientOptions
  }

  const ids = getCustomClientIds(customCodeSamples)
  const groups = new Map<string, CustomClientOptionGroup>()

  for (const [index, sample] of customCodeSamples.entries()) {
    const id = ids[index]
    if (!id || ids.indexOf(id) !== index) {
      continue
    }

    // Empty headings retain the source extension's existing default group.
    const groupLabel = sample.group?.trim() || label
    const group = groups.get(groupLabel) ?? { label: groupLabel, key: 'custom', options: [] }
    const optionLabel = sample.label || formatLanguage(sample.lang) || id
    group.options.push({
      id,
      lang: (sample.lang as TargetId) || 'plaintext',
      title: optionLabel,
      label: optionLabel,
      clientKey: 'custom',
    } satisfies CustomClientOption)
    groups.set(groupLabel, group)
  }

  return [...groups.values(), ...clientOptions]
}
