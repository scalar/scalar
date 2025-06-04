import type { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { parse } from 'flatted'

import { DATA_VERSION_LS_LEY } from '@/migrations/data-version'
import type { v_2_1_0 } from '@/migrations/v-2.1.0/types.generated'

/**
 * Supports pre-flatted local storage
 */
export const parseLocalStorage = (lsKey: (typeof LS_KEYS)[keyof typeof LS_KEYS]): Record<string, unknown> => {
  const item = localStorage.getItem(lsKey) || '[{}]'
  const data = item[0] === '[' ? parse(item) : JSON.parse(item)

  return data
}

/** Take a best guess of the localStorage version */
export const getLocalStorageVersion = (): string => {
  const collectionStr = localStorage.getItem('collection')
  const dataVersion = localStorage.getItem(DATA_VERSION_LS_LEY)
  if (dataVersion) {
    return dataVersion
  }

  // No flatted means first version
  if (!collectionStr?.length || collectionStr?.[0] === '{') {
    return '0.0.0'
  }

  // Flatted + types means > 2.1.0 but we should have a data version
  try {
    const [collection] = Object.values(parse(collectionStr) ?? {}) as v_2_1_0.Collection[]
    if (collection?.type === 'collection') {
      return '2.1.0'
    }

    return '0.0.0'
  } catch (e) {
    console.error(e)

    return '0.0.0'
  }
}
