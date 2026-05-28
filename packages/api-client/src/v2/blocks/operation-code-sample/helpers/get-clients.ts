import { capitalize } from '@scalar/helpers/string/capitalize'
import type { TargetId } from '@scalar/types/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'

import type { ClientOptionGroup, CustomClientOption } from '@/v2/blocks/operation-code-sample'
import { generateCustomId } from '@/v2/blocks/operation-code-sample/helpers/generate-client-options'
import type { CustomClientOptionGroup } from '@/v2/blocks/operation-code-sample/types'

/**
 * Merges custom code samples with the client options, grouping them by language.
 *
 * Custom code samples with the same `lang` are grouped together under a single
 * language group (e.g., two python samples become a "Python" group with both options).
 * This matches the grouping behavior of auto-generated snippetz clients.
 *
 * @param customCodeSamples - The custom code samples from the operation to merge with the client options
 * @param clientOptions - The client options to merge with the custom code samples
 * @returns A list of client option groups
 */
export const getClients = (
  customCodeSamples: XCodeSample[],
  clientOptions: ClientOptionGroup[],
): CustomClientOptionGroup[] => {
  if (!customCodeSamples.length) {
    return clientOptions
  }

  // Group custom code samples by language
  const groupedByLang = new Map<string, CustomClientOption[]>()

  customCodeSamples.forEach((sample, index) => {
    const id = generateCustomId(index)
    const lang = (sample.lang as TargetId) || 'plaintext'
    const label = sample.label || sample.lang || id

    const option: CustomClientOption = {
      id,
      lang,
      title: label,
      label,
      clientKey: 'custom',
    }

    const existing = groupedByLang.get(lang)
    if (existing) {
      existing.push(option)
    } else {
      groupedByLang.set(lang, [option])
    }
  })

  // Convert grouped samples to client option groups
  const customGroups: CustomClientOptionGroup[] = Array.from(groupedByLang.entries()).map(([lang, options]) => ({
    label: capitalize(lang),
    key: `custom-${lang}`,
    options,
  }))

  return [...customGroups, ...clientOptions]
}
