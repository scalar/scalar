import type { ScalarComboboxFilterFunction } from '@scalar/components'

import type { CustomClientOptionGroup, CustomOrDefaultClientOption } from '@/v2/blocks/operation-code-sample/types'

/**
 * Checks if a client label, client key, or language matches a query
 */
const matchesOption = (option: CustomOrDefaultClientOption, query: string) => {
  const q = query.toLowerCase()
  return (
    option.label.toLowerCase().includes(q) ||
    option.clientKey.toLowerCase().includes(q) ||
    option.lang.toLowerCase().includes(q)
  )
}

/**
 * Checks if a client label, client key, or language matches a query
 */
const matchesGroup = (group: CustomClientOptionGroup, query: string) => {
  const q = query.toLowerCase()
  return group.label.toLowerCase().includes(q) || group.key.toLowerCase().includes(q)
}

/**
 * Filters the clients based on a query
 *
 * When dealing with multiple groups, include all options from a group if the
 * group label itself matches — so searching "JavaScript" shows all JS clients.
 */
export const filterClientsByQuery = ((
  query: string,
  options: CustomOrDefaultClientOption[],
  groups: CustomClientOptionGroup[],
): CustomOrDefaultClientOption[] => {
  if (query === '') {
    return options
  }

  const q = query.toLowerCase()

  // Only activate when more than one group is actually visible (has a label and options).
  const visibleGroupCount = groups ? groups.filter((g) => g.label && g.options.length > 0).length : 0

  if (groups && visibleGroupCount > 1) {
    const result: CustomOrDefaultClientOption[] = []
    for (const group of groups) {
      if (matchesGroup(group, q)) {
        result.push(...group.options)
      } else {
        result.push(...group.options.filter((o) => matchesOption(o, q)))
      }
    }
    return result
  }

  return options.filter((o) => matchesOption(o, q))
}) satisfies ScalarComboboxFilterFunction<CustomOrDefaultClientOption, CustomClientOptionGroup>
