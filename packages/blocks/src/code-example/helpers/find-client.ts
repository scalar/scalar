import { AVAILABLE_CLIENTS, type AvailableClients } from '@scalar/snippetz'

import type { ClientOption, CustomClientOption, CustomClientOptionGroup } from '../types'

export const DEFAULT_CLIENT = 'shell/curl'

/**
 * A selection the code sample picker understands: either a built-in client id
 * (e.g. `js/fetch`) or a custom sample id (e.g. `custom/python`).
 *
 * The custom part is typed as `string & {}` rather than the `custom/${string}`
 * template literal: unioning that template literal with the (very large) built-in
 * client-id union trips TypeScript's "union too complex" limit inside Vue's
 * `defineProps` macro. `string & {}` keeps editor hints for the known client ids
 * without expanding the union.
 */
export type SelectedClientId = AvailableClients[number] | (string & {})

/** Type guard to check if a string is a valid built-in client id */
export const isClient = (id: any): id is AvailableClients[number] => AVAILABLE_CLIENTS.includes(id)

/** Type guard for any selection the picker can restore (built-in client or custom sample id) */
export const isSelectedClient = (id: any): id is SelectedClientId =>
  isClient(id) || (typeof id === 'string' && id.startsWith('custom/'))

/**
 * Finds and returns the appropriate client option to select for an operation.
 *
 * Selection rules, given the globally selected client/sample id:
 *
 * 1. A custom sample is selected (`custom/<lang>`): show the matching sample on
 *    this operation. If this operation has no sample for that exact language, we
 *    keep showing a custom sample (its first one) so the selection stays "global".
 * 2. An explicit built-in client is selected: it wins, even when the operation
 *    also has custom samples. This includes the default client (`shell/curl`):
 *    a built-in id only reaches us through a real selection (config, persistence,
 *    or the picker), never as an implicit default, so a deliberate cURL pick must
 *    stick instead of snapping back to an SDK example.
 * 3. Otherwise (nothing selected yet): prefer a custom sample when the operation
 *    has one, so custom examples are the default.
 * 4. Fall back to the default built-in client, then the first option.
 *
 * @param clientGroups - Array of client option groups, each containing a label and array of client options
 * @param clientId - Optional selection to restore (e.g. 'js/fetch' or 'custom/python')
 * @returns The selected client option, or undefined when there is nothing to select
 */
export const findClient = (
  clientGroups: CustomClientOptionGroup[],
  clientId?: SelectedClientId | undefined,
): ClientOption | CustomClientOption | undefined => {
  const findById = (id: string) => {
    for (const group of clientGroups) {
      const option = group.options.find((option) => option.id === id)
      if (option) {
        return option
      }
    }
    return undefined
  }

  const firstCustom = clientGroups.find((group) => group.key === 'custom')?.options[0]

  // 1. A custom sample is selected: match the language, otherwise stay on a custom sample
  if (clientId?.startsWith('custom')) {
    return findById(clientId) ?? firstCustom ?? findById(DEFAULT_CLIENT) ?? clientGroups[0]?.options[0]
  }

  // 2. An explicit built-in client wins, even when custom samples exist. A built-in
  //    id (including the default `shell/curl`) only reaches us through a real
  //    selection, so it must stick rather than snap back to a custom sample.
  if (clientId) {
    const option = findById(clientId)
    if (option) {
      return option
    }
  }

  // 3. Nothing selected yet: prefer a custom sample when the operation has one
  if (firstCustom) {
    return firstCustom
  }

  // 4. Otherwise fall back to the default built-in client, then the first option
  return findById(DEFAULT_CLIENT) ?? clientGroups[0]?.options[0]
}
