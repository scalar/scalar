import type { AnyObject } from '@/types/index'

export const toJson = (value: AnyObject) => JSON.stringify(value, null, 2)
