import type { FilterFunction } from '@/components/ScalarCombobox/types'
import type { Option } from '@/components/ScalarListbox/types'

export const filterByOptionLabel = (<O extends Option>(query: string, options: O[]): O[] => {
  return query === ''
    ? options
    : options.filter((option) => {
        return option.label.toLowerCase().includes(query.toLowerCase())
      })
}) satisfies FilterFunction
