import type { AnyObject } from '../types/index.ts'

export const toJson = (value: AnyObject) => JSON.stringify(value, null, 2)
