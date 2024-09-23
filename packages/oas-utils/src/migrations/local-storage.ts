import type { LS_KEYS } from '@/helpers'
import { DATA_VERSION_LS_LEY } from '@/migrations/data-version'
import type { v_2_1_0 } from '@/migrations/v-2.1.0'
import { parse } from 'flatted'

/**
 * Supports pre-flatted local storage
 */
export const parseLocalStorage = (
  lsKey: (typeof LS_KEYS)[keyof typeof LS_KEYS],
): Record<string, unknown> => {
  const item = localStorage.getItem(lsKey) || '[{}]'
  const data = item[0] === '[' ? parse(item) : JSON.parse(item)

  return data
}

/** Take a best guess of the localStorage version */
export const getLocalStorageVersion = (): string => {
  const collectionStr = localStorage.getItem('collection')
  const dataVersion = localStorage.getItem(DATA_VERSION_LS_LEY)

  // No flatted means first version
  if (!collectionStr?.length || collectionStr?.[0] === '{') return '0.0.0'

  // Flatted + types means 2.1.0
  try {
    const [collection] = Object.values(
      parse(collectionStr) ?? {},
    ) as v_2_1_0.Collection[]
    if (collection?.type === 'collection') return '2.1.0'

    if (dataVersion) return dataVersion
    return '0.0.0'
  } catch (e) {
    console.error(e)

    if (dataVersion) return dataVersion
    return '0.0.0'
  }
}
