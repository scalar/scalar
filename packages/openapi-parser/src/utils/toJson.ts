import type { AnyObject } from '../types/index.js'

export const toJson = (value: AnyObject) => JSON.stringify(value, null, 2)
