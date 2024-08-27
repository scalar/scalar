import type { AnyObject } from '../types'

export const toJson = (value: AnyObject) => JSON.stringify(value, null, 2)
