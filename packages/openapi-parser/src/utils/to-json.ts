import type { AnyObject } from '@scalar/types/utils'

export const toJson = (value: AnyObject) => JSON.stringify(value, null, 2)
